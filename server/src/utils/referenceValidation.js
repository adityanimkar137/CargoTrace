import { Evidence } from '../modules/evidence/model.js';
import { Inspection } from '../modules/inspections/model.js';
import { CustodyEvent } from '../modules/custody/model.js';
import { AppError } from '../middleware/errorHandler.js';

export async function validateRelatedReferences({ organizationId, shipmentId, evidenceIds, relatedInspections, relatedCustodyEvents }) {
  if (evidenceIds && evidenceIds.length > 0) {
    const foundEvidence = await Evidence.find({
      _id: { $in: evidenceIds },
      organization: organizationId,
      shipment: shipmentId
    });
    if (foundEvidence.length !== evidenceIds.length) {
      throw new AppError('One or more evidence items are invalid, not found, or belong to a different organization/shipment.', 400, 'INVALID_EVIDENCE_REFERENCE');
    }
  }

  if (relatedInspections && relatedInspections.length > 0) {
    const foundInspections = await Inspection.find({
      _id: { $in: relatedInspections },
      organization: organizationId,
      shipment: shipmentId
    });
    if (foundInspections.length !== relatedInspections.length) {
      throw new AppError('One or more related inspections are invalid or belong to a different organization/shipment.', 400, 'INVALID_INSPECTION_REFERENCE');
    }
  }

  if (relatedCustodyEvents && relatedCustodyEvents.length > 0) {
    const foundCustody = await CustodyEvent.find({
      _id: { $in: relatedCustodyEvents },
      organization: organizationId,
      shipment: shipmentId
    });
    if (foundCustody.length !== relatedCustodyEvents.length) {
      throw new AppError('One or more related custody events are invalid or belong to a different organization/shipment.', 400, 'INVALID_CUSTODY_REFERENCE');
    }
  }
}
