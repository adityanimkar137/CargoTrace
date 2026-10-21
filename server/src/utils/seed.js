/**
 * CargoTrace Initial Seed Data Utility
 * Seeds default organization and pre-registered accounts (Admin, Reviewer, Investigator)
 * and realistic Indian supply chain investigation scenarios with persistent relationships.
 */
import { User } from '../modules/users/model.js';
import { Organization } from '../modules/organizations/model.js';
import { Membership } from '../modules/memberships/model.js';
import { Shipment } from '../modules/shipments/model.js';
import { CustodyEvent } from '../modules/custody/model.js';
import { Inspection } from '../modules/inspections/model.js';
import { DamageIncident } from '../modules/incidents/model.js';
import { Evidence } from '../modules/evidence/model.js';
import { EventRelationship } from '../modules/relationships/model.js';
import { logger } from './logger.js';

export async function seedInitialDataIfEmpty() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      // Ensure the registered reviewer account exists even if other users exist
      const existingReviewer = await User.findOne({ email: 'reviewer@cargotrace.internal' });
      if (!existingReviewer) {
        const org = await Organization.findOne();
        if (org) {
          const revPasswordHash = await User.hashPassword('Reviewer2026!');
          const newReviewer = await User.create({
            email: 'reviewer@cargotrace.internal',
            passwordHash: revPasswordHash,
            displayName: 'Aarav Patel (Compliance Reviewer)',
            status: 'active'
          });
          await Membership.create({
            user: newReviewer._id,
            organization: org._id,
            role: 'reviewer',
            status: 'active'
          });
          logger.info('Auto-seeded default registered reviewer: reviewer@cargotrace.internal');
        }
      }
      return;
    }

    logger.info('Database is empty. Seeding default CargoTrace organization, admin, and Indian logistics scenario...');

    // 1. Create Admin User
    const adminPasswordHash = await User.hashPassword('Admin2026!');
    const adminUser = await User.create({
      email: 'admin@cargotrace.internal',
      passwordHash: adminPasswordHash,
      displayName: 'Aditya Sharma (Director of Supply Chain Security)',
      status: 'active'
    });

    // 2. Create Organization
    const organization = await Organization.create({
      name: 'CargoTrace India Freight Systems',
      slug: 'cargotrace-india',
      status: 'active',
      createdBy: adminUser._id
    });

    // 3. Create Admin Membership
    await Membership.create({
      user: adminUser._id,
      organization: organization._id,
      role: 'admin',
      status: 'active'
    });

    // 4. Create Registered Reviewer
    const reviewerPasswordHash = await User.hashPassword('Reviewer2026!');
    const reviewerUser = await User.create({
      email: 'reviewer@cargotrace.internal',
      passwordHash: reviewerPasswordHash,
      displayName: 'Ananya Verma (Lead Compliance Reviewer)',
      status: 'active'
    });

    await Membership.create({
      user: reviewerUser._id,
      organization: organization._id,
      role: 'reviewer',
      status: 'active'
    });

    // 5. Create Registered Investigator
    const investigatorPasswordHash = await User.hashPassword('Investigator2026!');
    const investigatorUser = await User.create({
      email: 'investigator@cargotrace.internal',
      passwordHash: investigatorPasswordHash,
      displayName: 'Rohan Mehta (Senior Cargo Loss Investigator)',
      status: 'active'
    });

    await Membership.create({
      user: investigatorUser._id,
      organization: organization._id,
      role: 'investigator',
      status: 'active'
    });

    // 6. Seed Realistic Indian Logistics Scenario: Jaipur -> Ahmedabad -> Mumbai
    const shipmentRef = 'CT-202610-8768';
    let shipment = await Shipment.findOne({ shipmentReference: shipmentRef, organization: organization._id });
    if (!shipment) {
      shipment = await Shipment.create({
        shipmentReference: shipmentRef,
        organization: organization._id,
        description: 'Handcrafted Precision Ceramic Ware & Export Glassware (Jaipur Batch #IN-8891)',
        origin: 'Jaipur Crafts Depot, Sitapura Industrial Area, Rajasthan',
        destination: 'Mumbai JNPT Port Terminal, Navi Mumbai, Maharashtra',
        carrier: 'Mahindra Logistics Express Cargo',
        status: 'ARRIVED',
        createdBy: adminUser._id,
        notes: 'Fragile export cargo. Require origin loading seal verification and JNPT un-boxing inspection.'
      });
    }

    // Custody Handover 1: Pickup at Jaipur
    const timePickup = new Date(Date.now() - 72 * 3600 * 1000);
    const custody1 = await CustodyEvent.create({
      shipment: shipment._id,
      organization: organization._id,
      eventType: 'PICKUP',
      location: 'Jaipur Crafts Depot, Sitapura Industrial Area',
      fromParty: 'Jaipur Warehouse Logistics',
      toParty: 'Rajesh Sharma (Mahindra Driver - Truck RJ-14-GC-8812)',
      notes: 'Loaded 4 pallets onto covered container truck. Security seal #IND-SEAL-8821 applied.',
      recordedBy: adminUser._id,
      occurredAt: timePickup
    });

    // Origin Inspection: Jaipur Warehouse
    const inspOrigin = await Inspection.create({
      shipment: shipment._id,
      organization: organization._id,
      inspectionType: 'ORIGIN',
      location: 'Jaipur Crafts Depot, Sitapura Industrial Area',
      overallCondition: 'GOOD',
      packagingCondition: 'INTACT',
      sealCondition: 'INTACT',
      visibleDamage: false,
      inspectedBy: investigatorUser._id,
      inspectedAt: timePickup,
      observations: 'All 4 pallets film-wrapped, corner protectors intact, security seal #IND-SEAL-8821 verified.'
    });

    // Origin Evidence Photo
    const evOrigin = await Evidence.create({
      evidenceReference: Evidence.generateReference(),
      shipment: shipment._id,
      organization: organization._id,
      originalFilename: 'jaipur_origin_dispatch_pallet_photo.jpg',
      storagePath: 'uploads/evidence/jaipur_dispatch.jpg',
      fileUrl: '/uploads/evidence/jaipur_dispatch.jpg',
      storageMode: 'local',
      contentType: 'image/jpeg',
      sizeBytes: 1245000,
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      uploadedBy: investigatorUser._id,
      uploadedAt: timePickup,
      description: 'High-resolution origin dispatch photo showing intact shrink-wrapped pallets at Jaipur.',
      evidenceType: 'CARGO_PHOTO',
      inspection: inspOrigin._id
    });

    // Custody Handover 2: Transit Hub at Ahmedabad
    const timeAhmedabad = new Date(Date.now() - 48 * 3600 * 1000);
    const custody2 = await CustodyEvent.create({
      shipment: shipment._id,
      organization: organization._id,
      eventType: 'TRANSIT_HUB_RECEIPT',
      location: 'Ahmedabad Logistics Park, Sanand Highway, Gujarat',
      fromParty: 'Rajesh Sharma (Mahindra Driver)',
      toParty: 'Amit Patel (Ahmedabad Hub Supervisor)',
      notes: 'Intermediate trailer inspection. Container seal #IND-SEAL-8821 confirmed intact.',
      recordedBy: investigatorUser._id,
      occurredAt: timeAhmedabad
    });

    // Custody Handover 3: Arrival at JNPT Mumbai
    const timeJNPT = new Date(Date.now() - 18 * 3600 * 1000);
    const custody3 = await CustodyEvent.create({
      shipment: shipment._id,
      organization: organization._id,
      eventType: 'DESTINATION_DELIVERY',
      location: 'Mumbai JNPT Port Terminal, Navi Mumbai',
      fromParty: 'Ahmedabad Inter-State Cargo Line',
      toParty: 'Vikram Singh (JNPT Terminal Receiver)',
      notes: 'Delivery received at JNPT Gate 3. Receiver noted outer carton crushing and broken seal.',
      recordedBy: investigatorUser._id,
      occurredAt: timeJNPT
    });

    // Destination Inspection: Mumbai JNPT
    const inspDest = await Inspection.create({
      shipment: shipment._id,
      organization: organization._id,
      inspectionType: 'DESTINATION',
      location: 'Mumbai JNPT Port Terminal, Navi Mumbai',
      overallCondition: 'SEVERE_DAMAGE',
      packagingCondition: 'CRUSHED',
      sealCondition: 'BROKEN',
      visibleDamage: true,
      damageDescription: 'Pallet #3 side wall crushed. 2 inner cases of ceramic mugs cracked. Container seal #IND-SEAL-8821 snapped.',
      inspectedBy: investigatorUser._id,
      inspectedAt: timeJNPT,
      observations: 'Physical impact damage observed on left side pallet. Seal broken prior to un-boxing.'
    });

    // Destination Evidence Photo
    const evDest = await Evidence.create({
      evidenceReference: Evidence.generateReference(),
      shipment: shipment._id,
      organization: organization._id,
      originalFilename: 'mumbai_jnpt_damaged_pallet_photo.jpg',
      storagePath: 'uploads/evidence/jnpt_damage.jpg',
      fileUrl: '/uploads/evidence/jnpt_damage.jpg',
      storageMode: 'local',
      contentType: 'image/jpeg',
      sizeBytes: 1892000,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      uploadedBy: investigatorUser._id,
      uploadedAt: timeJNPT,
      description: 'Destination receipt photograph documenting broken seal IND-SEAL-8821 and crushed ceramic mug carton.',
      evidenceType: 'DAMAGE_PHOTO',
      inspection: inspDest._id
    });

    // Damage Incident: Mumbai JNPT Crushing & Broken Seal
    const incidentRef = DamageIncident.generateReference();
    const incident = await DamageIncident.create({
      incidentReference: incidentRef,
      shipment: shipment._id,
      organization: organization._id,
      title: 'JNPT Terminal Pallet Crushing & Security Seal Breach',
      description: 'Severe impact crushing detected on Pallet #3 upon un-loading at JNPT Terminal. Security seal #IND-SEAL-8821 snapped.',
      damageType: 'PHYSICAL_DAMAGE',
      severity: 'MAJOR',
      status: 'UNDER_INVESTIGATION',
      location: 'Mumbai JNPT Port Terminal, Navi Mumbai',
      affectedCargo: 'Pallet #3 — Handcrafted Export Ceramic Mugs (Est. 120 units damaged)',
      discoveredAt: timeJNPT,
      occurredAt: timeJNPT,
      reportedBy: investigatorUser._id,
      relatedInspections: [inspDest._id],
      relatedCustodyEvents: [custody3._id],
      evidence: [evDest._id]
    });

    // 7. Seed Explicit Persistent Event Relationships
    await Promise.all([
      EventRelationship.create({
        organization: organization._id,
        shipment: shipment._id,
        sourceType: 'inspection',
        sourceId: inspOrigin._id,
        targetType: 'evidence',
        targetId: evOrigin._id,
        relationshipType: 'INSPECTION_SUPPORTED_BY_EVIDENCE',
        explanation: 'Jaipur origin inspection condition supported by loading dispatch photo',
        createdBy: investigatorUser._id
      }),
      EventRelationship.create({
        organization: organization._id,
        shipment: shipment._id,
        sourceType: 'inspection',
        sourceId: inspDest._id,
        targetType: 'evidence',
        targetId: evDest._id,
        relationshipType: 'INSPECTION_SUPPORTED_BY_EVIDENCE',
        explanation: 'Mumbai JNPT destination damage findings backed by high-resolution damage photo',
        createdBy: investigatorUser._id
      }),
      EventRelationship.create({
        organization: organization._id,
        shipment: shipment._id,
        sourceType: 'incident',
        sourceId: incident._id,
        targetType: 'evidence',
        targetId: evDest._id,
        relationshipType: 'INCIDENT_SUPPORTED_BY_EVIDENCE',
        explanation: 'JNPT damage incident corroborated by photograph of crushed carton and snapped seal',
        createdBy: investigatorUser._id
      }),
      EventRelationship.create({
        organization: organization._id,
        shipment: shipment._id,
        sourceType: 'inspection',
        sourceId: inspDest._id,
        targetType: 'incident',
        targetId: incident._id,
        relationshipType: 'INSPECTION_DOCUMENTS_INCIDENT',
        explanation: 'JNPT destination condition inspection documents the physical damage incident',
        createdBy: investigatorUser._id
      }),
      EventRelationship.create({
        organization: organization._id,
        shipment: shipment._id,
        sourceType: 'custody',
        sourceId: custody1._id,
        targetType: 'custody',
        targetId: custody2._id,
        relationshipType: 'CUSTODY_EVENT_PRECEDES_CUSTODY_EVENT',
        explanation: 'Jaipur dispatch handover precedes Ahmedabad transit hub receipt',
        createdBy: investigatorUser._id
      }),
      EventRelationship.create({
        organization: organization._id,
        shipment: shipment._id,
        sourceType: 'custody',
        sourceId: custody2._id,
        targetType: 'custody',
        targetId: custody3._id,
        relationshipType: 'CUSTODY_EVENT_PRECEDES_CUSTODY_EVENT',
        explanation: 'Ahmedabad hub receipt precedes JNPT destination delivery',
        createdBy: investigatorUser._id
      }),
      EventRelationship.create({
        organization: organization._id,
        shipment: shipment._id,
        sourceType: 'incident',
        sourceId: incident._id,
        targetType: 'custody',
        targetId: custody3._id,
        relationshipType: 'INCIDENT_OCCURRED_DURING_CUSTODY',
        explanation: 'Damage discovered during destination delivery handover at JNPT Navi Mumbai',
        createdBy: investigatorUser._id
      })
    ]);

    logger.info('Indian logistics investigation scenario & persistent event relationships seeded successfully.');
  } catch (err) {
    logger.warn('Error during default data seeding (ignoring if duplicate)', { error: err.message });
  }
}
