/**
 * CargoTrace Shipment Service
 * Business logic for tenant-isolated shipment CRUD operations and audit integration.
 */
import { Shipment } from './model.js';
import { recordAudit } from '../audit/model.js';
import { AppError } from '../../middleware/errorHandler.js';

export async function createShipment({ data, organizationId, userId, req }) {
  // Generate unique collision-safe reference
  let shipmentReference = Shipment.generateReference();
  let attempts = 0;

  // Verify reference uniqueness (up to 3 retries in rare collision)
  while (attempts < 3) {
    const existing = await Shipment.findOne({ shipmentReference });
    if (!existing) break;
    shipmentReference = Shipment.generateReference();
    attempts++;
  }

  const shipment = await Shipment.create({
    shipmentReference,
    organization: organizationId,
    description: data.description,
    origin: data.origin,
    destination: data.destination,
    carrier: data.carrier || null,
    trackingReference: data.trackingReference || null,
    status: data.status || 'REGISTERED',
    expectedArrival: data.expectedArrival || null,
    notes: data.notes || null,
    createdBy: userId
  });

  // Record Audit Log
  await recordAudit({
    action: 'SHIPMENT_CREATED',
    userId,
    organizationId,
    details: {
      shipmentId: shipment._id.toString(),
      shipmentReference: shipment.shipmentReference,
      status: shipment.status
    },
    req
  });

  return shipment;
}

export async function getShipments({ organizationId, query }) {
  const { page, limit, search, status, origin, destination, sortBy, sortOrder } = query;

  // Strict tenant boundary filter
  const filter = { organization: organizationId };

  if (status) {
    filter.status = status;
  }

  if (origin) {
    filter.origin = new RegExp(origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  if (destination) {
    filter.destination = new RegExp(destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [
      { shipmentReference: regex },
      { description: regex },
      { trackingReference: regex },
      { carrier: regex },
      { origin: regex },
      { destination: regex }
    ];
  }

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sortOptions = { [sortBy]: sortDirection };

  const [shipments, total] = await Promise.all([
    Shipment.find(filter)
      .populate('createdBy', 'displayName email')
      .populate('updatedBy', 'displayName email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Shipment.countDocuments(filter)
  ]);

  return {
    shipments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

export async function getShipmentById({ shipmentId, organizationId }) {
  const shipment = await Shipment.findOne({
    _id: shipmentId,
    organization: organizationId
  })
    .populate('createdBy', 'displayName email')
    .populate('updatedBy', 'displayName email');

  if (!shipment) {
    throw new AppError('Shipment not found or inaccessible.', 404, 'SHIPMENT_NOT_FOUND');
  }

  return shipment;
}

export async function updateShipment({ shipmentId, organizationId, data, userId, req }) {
  const shipment = await Shipment.findOne({
    _id: shipmentId,
    organization: organizationId
  });

  if (!shipment) {
    throw new AppError('Shipment not found or inaccessible.', 404, 'SHIPMENT_NOT_FOUND');
  }

  const previousStatus = shipment.status;

  // Apply allowed field updates
  if (data.description !== undefined) shipment.description = data.description;
  if (data.origin !== undefined) shipment.origin = data.origin;
  if (data.destination !== undefined) shipment.destination = data.destination;
  if (data.carrier !== undefined) shipment.carrier = data.carrier;
  if (data.trackingReference !== undefined) shipment.trackingReference = data.trackingReference;
  if (data.status !== undefined) shipment.status = data.status;
  if (data.expectedArrival !== undefined) shipment.expectedArrival = data.expectedArrival;
  if (data.notes !== undefined) shipment.notes = data.notes;

  shipment.updatedBy = userId;

  await shipment.save();

  await recordAudit({
    action: 'SHIPMENT_UPDATED',
    userId,
    organizationId,
    details: {
      shipmentId: shipment._id.toString(),
      shipmentReference: shipment.shipmentReference,
      previousStatus,
      newStatus: shipment.status
    },
    req
  });

  return shipment.populate([
    { path: 'createdBy', select: 'displayName email' },
    { path: 'updatedBy', select: 'displayName email' }
  ]);
}
