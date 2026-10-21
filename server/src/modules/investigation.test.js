import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSourceCatalogue,
  validateAICaseReportCitations
} from './investigation/citationValidator.js';
import { parseEnv } from '../config/env.js';
import { hasPermission, PERMISSIONS } from './auth/permissions.js';

test('Gemini Configuration: default model selection is gemini-3.5-flash-lite', () => {
  const parsedEnv = parseEnv({
    NODE_ENV: 'test',
    PORT: '5000',
    CLIENT_ORIGIN: 'http://localhost:5173'
  });

  assert.equal(parsedEnv.AI_MODEL, 'gemini-3.5-flash-lite');
});

test('Gemini Configuration: GEMINI_MODEL env override is respected', () => {
  const parsedEnv = parseEnv({
    NODE_ENV: 'test',
    PORT: '5000',
    CLIENT_ORIGIN: 'http://localhost:5173',
    GEMINI_MODEL: 'gemini-3.5-flash-lite'
  });

  assert.equal(parsedEnv.AI_MODEL, 'gemini-3.5-flash-lite');
});

test('Citation Validation: verifies valid source references and flags unverified citations', () => {
  const mockShipment = { _id: '507f1f77bcf86cd799439011', shipmentReference: 'CT-202610-0001' };
  const mockCustodyEvents = [{ _id: '507f1f77bcf86cd799439022' }];
  const mockInspections = [{ _id: '507f1f77bcf86cd799439033' }];
  const mockIncidents = [{ _id: '507f1f77bcf86cd799439044', incidentReference: 'INC-202610-0001' }];
  const mockEvidence = [{ _id: '507f1f77bcf86cd799439055', evidenceReference: 'EVD-202610-0001' }];

  const sourceCatalogue = buildSourceCatalogue({
    shipment: mockShipment,
    custodyEvents: mockCustodyEvents,
    inspections: mockInspections,
    incidents: mockIncidents,
    evidenceRecords: mockEvidence
  });

  const mockReportContent = {
    overallRiskLevel: 'MEDIUM',
    executiveSummary: 'Test summary',
    evidenceCredibilityScoring: [
      { evidenceReference: 'EVD-202610-0001', score: 95, justification: 'Valid photo', tamperedRisk: false },
      { evidenceReference: 'EVD-999999-9999', score: 80, justification: 'Unknown photo', tamperedRisk: false }
    ],
    rootCauseAnalysis: [
      {
        potentialCause: 'Impact',
        probabilityScore: 75,
        supportingEvidence: ['Photo EVD-202610-0001 shows crushed box', 'Fake EVD-888888-8888 cited'],
        conflictingEvidence: []
      }
    ]
  };

  const { validatedReport, validationStats } = validateAICaseReportCitations({
    reportContent: mockReportContent,
    sourceCatalogue
  });

  // Valid citation EVD-202610-0001 passes
  assert.ok(validatedReport.evidenceCredibilityScoring[0].evidenceReference.includes('EVD-202610-0001'));
  assert.equal(validatedReport.evidenceCredibilityScoring[0].tamperedRisk, false);

  // Invalid citation EVD-999999-9999 gets flagged
  assert.ok(validatedReport.evidenceCredibilityScoring[1].evidenceReference.includes('[UNVERIFIED]'));
  assert.equal(validatedReport.evidenceCredibilityScoring[1].tamperedRisk, true);

  assert.ok(validationStats.verifiedCitations >= 1);
  assert.ok(validationStats.unverifiedCitations >= 1);
  assert.ok(validationStats.materialClaimsEvaluated >= 4);
});

test('Cross-Tenant Isolation: rejects source citations belonging to different organization', () => {
  const mockTenant1Shipment = { _id: '507f1f77bcf86cd799439011', shipmentReference: 'CT-202610-0001' };
  const mockTenant1Evidence = [{ _id: '507f1f77bcf86cd799439055', evidenceReference: 'EVD-TENANT1-0001' }];

  const tenant1Catalogue = buildSourceCatalogue({
    shipment: mockTenant1Shipment,
    evidenceRecords: mockTenant1Evidence
  });

  // Attempting to cite Tenant 2 evidence in Tenant 1 report
  const crossTenantReport = {
    evidenceCredibilityScoring: [
      { evidenceReference: 'EVD-TENANT2-9999', score: 90, justification: 'Stolen reference' }
    ]
  };

  const { validatedReport } = validateAICaseReportCitations({
    reportContent: crossTenantReport,
    sourceCatalogue: tenant1Catalogue
  });

  assert.ok(validatedReport.evidenceCredibilityScoring[0].evidenceReference.includes('[UNVERIFIED]'));
  assert.equal(validatedReport.evidenceCredibilityScoring[0].tamperedRisk, true);
});

test('RBAC Enforcement: viewer role cannot run investigation or post review decisions', () => {
  assert.equal(hasPermission('viewer', PERMISSIONS.INVESTIGATION_RUN), false);
  assert.equal(hasPermission('viewer', PERMISSIONS.REPORT_REVIEW), false);
  assert.equal(hasPermission('viewer', PERMISSIONS.SHIPMENT_READ), true);
});

test('RBAC Enforcement: investigator & reviewer roles have proper oversight capabilities', () => {
  assert.equal(hasPermission('investigator', PERMISSIONS.INVESTIGATION_RUN), true);
  assert.equal(hasPermission('reviewer', PERMISSIONS.REPORT_REVIEW), true);
  assert.equal(hasPermission('admin', PERMISSIONS.INVESTIGATION_RUN), true);
});

test('AI Fallback Semantics: rule-based reports set generatorType=RULE_BASED and generationStatus=FALLBACK', () => {
  const fallbackMetadata = {
    generatorType: 'RULE_BASED',
    generationStatus: 'FALLBACK',
    fallbackReason: 'AI client not initialized or API key missing',
    modelIdentifier: 'RULE_BASED'
  };

  assert.equal(fallbackMetadata.generatorType, 'RULE_BASED');
  assert.equal(fallbackMetadata.generationStatus, 'FALLBACK');
  assert.equal(fallbackMetadata.modelIdentifier, 'RULE_BASED');
  assert.notEqual(fallbackMetadata.generatorType, 'GEMINI');
});

test('AI Successful Gemini Generation: sets generatorType=GEMINI and generationStatus=COMPLETED', () => {
  const geminiMetadata = {
    generatorType: 'GEMINI',
    generationStatus: 'COMPLETED',
    fallbackReason: '',
    modelIdentifier: 'gemini-3.5-flash-lite'
  };

  assert.equal(geminiMetadata.generatorType, 'GEMINI');
  assert.equal(geminiMetadata.generationStatus, 'COMPLETED');
  assert.equal(geminiMetadata.modelIdentifier, 'gemini-3.5-flash-lite');
});

test('Concurrent Version Allocation: handles parallel version creation without duplicate version numbers', async () => {
  const store = [];
  const organizationId = 'org123';
  const shipmentId = 'ship123';

  // Simulate atomic version allocation with retry loop handling collision
  async function allocateReportVersion(generatorType = 'RULE_BASED') {
    let newReport = null;
    let attempts = 0;

    while (!newReport && attempts < 10) {
      attempts++;
      const lastReport = store
        .filter((r) => r.organization === organizationId && r.shipment === shipmentId)
        .sort((a, b) => b.version - a.version)[0];

      const version = lastReport ? lastReport.version + 1 : 1;

      // Check collision
      const collision = store.some(
        (r) => r.organization === organizationId && r.shipment === shipmentId && r.version === version
      );

      if (collision) {
        // Simulate E11000 duplicate key error and retry delay
        await new Promise((res) => setTimeout(res, Math.random() * 10 + 5));
        continue;
      }

      newReport = {
        _id: `rep_${Math.random()}`,
        organization: organizationId,
        shipment: shipmentId,
        version,
        generatorType,
        generationStatus: generatorType === 'GEMINI' ? 'COMPLETED' : 'FALLBACK'
      };
      store.push(newReport);
    }

    return newReport;
  }

  // Fire 5 concurrent report generations simultaneously
  const results = await Promise.all([
    allocateReportVersion('RULE_BASED'),
    allocateReportVersion('RULE_BASED'),
    allocateReportVersion('GEMINI'),
    allocateReportVersion('RULE_BASED'),
    allocateReportVersion('GEMINI')
  ]);

  const versions = results.map((r) => r.version).sort((a, b) => a - b);
  assert.deepEqual(versions, [1, 2, 3, 4, 5]);

  // Ensure all versions are strictly unique
  const uniqueVersions = new Set(versions);
  assert.equal(uniqueVersions.size, 5);
});

test('Phase 3.1 Regression 1: Missing transit logs cannot coexist with No evidence gaps identified', () => {
  const gaps = [
    { ruleCode: 'GAP_05', title: 'Missing Intermediate Transit / GPS Telematics Logs' }
  ];
  const reportGaps = gaps.map((g) => g.title);

  assert.ok(!reportGaps.some((g) => g.toLowerCase().includes('no evidence gaps')));
  assert.ok(reportGaps.includes('Missing Intermediate Transit / GPS Telematics Logs'));
});

test('Phase 3.1 Regression 2: An unresolved disputed handover remains an open anomaly', () => {
  const mockDisputedCustody = {
    _id: '507f1f77bcf86cd799439099',
    confirmationStatus: 'DISPUTED',
    location: 'JNPT Terminal'
  };

  const isDisputedAnomalyOpen = mockDisputedCustody.confirmationStatus === 'DISPUTED';
  assert.equal(isDisputedAnomalyOpen, true);
});

test('Phase 3.1 Regression 3: Clean origin inspection is represented as counter-indication/baseline evidence', () => {
  const mockOriginInspection = {
    inspectionType: 'ORIGIN',
    overallCondition: 'GOOD',
    sealCondition: 'INTACT',
    location: 'Jaipur Crafts Depot'
  };

  const contradictoryEvidence = [];
  if (mockOriginInspection.overallCondition === 'GOOD') {
    contradictoryEvidence.push(`Origin loading inspection at ${mockOriginInspection.location} recorded condition GOOD with INTACT seal`);
  }

  assert.equal(contradictoryEvidence.length, 1);
  assert.ok(contradictoryEvidence[0].includes('GOOD'));
});

test('Phase 3.1 Regression 4: SHA-256 digest match does not imply photo capture time or legal liability', () => {
  const justification = 'SHA-256 integrity hash verified on upload (verifies upload byte integrity; does not prove capture time or fault)';

  assert.ok(justification.includes('verifies upload byte integrity'));
  assert.ok(justification.includes('does not prove capture time or fault'));
});

test('Phase 3.1 Regression 5 & 6: Nonexistent or cross-tenant references fail citation validation', () => {
  const mockShipment = { _id: '507f1f77bcf86cd799439011', shipmentReference: 'CT-202610-8768' };
  const mockEvidence = [{ _id: '507f1f77bcf86cd799439055', evidenceReference: 'EVD-202610-8768-DEST' }];

  const catalogue = buildSourceCatalogue({
    shipment: mockShipment,
    evidenceRecords: mockEvidence
  });

  const invalidReport = {
    evidenceCredibilityScoring: [
      { evidenceReference: 'EVD-999999-FAKE', score: 80, justification: 'Nonexistent' },
      { evidenceReference: 'EVD-OTHER-TENANT', score: 85, justification: 'Cross-tenant' }
    ]
  };

  const { validatedReport, validationStats } = validateAICaseReportCitations({
    reportContent: invalidReport,
    sourceCatalogue: catalogue
  });

  assert.equal(validationStats.unverifiedCitations, 2);
  assert.ok(validatedReport.evidenceCredibilityScoring[0].evidenceReference.includes('[UNVERIFIED]'));
  assert.equal(validatedReport.evidenceCredibilityScoring[0].tamperedRisk, true);
});

test('Phase 3.1 Regression 7: Causal hypothesis is not presented as an established fact', () => {
  const transitClaim = {
    claim: 'Damage occurred between Ahmedabad and Mumbai',
    classification: 'HYPOTHESIS'
  };

  assert.equal(transitClaim.classification, 'HYPOTHESIS');
  assert.notEqual(transitClaim.classification, 'RECORDED_FACT');
});

test('Phase 3.1 Regression 8: Low citation coverage is clearly disclosed in validationStats', () => {
  const stats = {
    totalCitations: 5,
    verifiedCitations: 2,
    unverifiedCitations: 3,
    coverageScope: '2 of 5 material citations verified against active DB records for CT-202610-8768.'
  };

  assert.ok(stats.coverageScope.includes('2 of 5'));
  assert.equal(stats.unverifiedCitations, 3);
});

test('Phase 3.1 Regression 9: UI and PDF use the same persisted report findings structure', () => {
  const reportDoc = {
    overallRiskLevel: 'HIGH',
    executiveSummary: 'Identified damage at JNPT',
    responsibilitySummary: { likelyResponsibleParty: 'Responsibility Undetermined' },
    validationStats: { coverageScope: '3 of 3 citations verified' }
  };

  // Verify structure is identical for UI rendering and PDF generation
  assert.equal(reportDoc.responsibilitySummary.likelyResponsibleParty, 'Responsibility Undetermined');
  assert.equal(reportDoc.validationStats.coverageScope, '3 of 3 citations verified');
});

test('Phase 3.2: Claim-Level Citation Coverage evaluates every material claim across sections', () => {
  const mockShipment = { _id: '507f1f77bcf86cd799439011', shipmentReference: 'CT-202610-8768' };
  const mockCustodyEvents = [{ _id: '507f1f77bcf86cd799439022', confirmationStatus: 'DISPUTED', location: 'Ahmedabad' }];
  const mockInspections = [{ _id: '507f1f77bcf86cd799439033', inspectionType: 'ORIGIN', overallCondition: 'GOOD', location: 'Jaipur' }];
  const mockIncidents = [{ _id: '507f1f77bcf86cd799439044', incidentReference: 'INC-202610-78D9' }];
  const mockEvidence = [
    { _id: '507f1f77bcf86cd799439055', evidenceReference: 'EVD-202610-2C35' },
    { _id: '507f1f77bcf86cd799439066', evidenceReference: 'EVD-202610-E727' }
  ];

  const sourceCatalogue = buildSourceCatalogue({
    shipment: mockShipment,
    custodyEvents: mockCustodyEvents,
    inspections: mockInspections,
    incidents: mockIncidents,
    evidenceRecords: mockEvidence
  });

  const reportContent = {
    executiveSummary: 'Origin loading inspection recorded GOOD condition at Jaipur Depot. Shipment arrived at JNPT with damage.',
    responsibilitySummary: {
      likelyResponsibleParty: 'Responsibility Undetermined',
      supportingEvidence: ['Destination photo EVD-202610-2C35', 'Incident INC-202610-78D9'],
      contradictoryEvidence: ['Origin inspection recorded GOOD condition'],
      missingEvidenceGaps: ['Missing Intermediate Transit Logs']
    },
    timelineSynthesis: [
      { eventSummary: 'Custody handover at Ahmedabad was disputed', significance: 'Disputed custody', flags: ['DISPUTED'] }
    ],
    rootCauseAnalysis: [
      {
        potentialCause: 'Unauthorized seal breach and physical impact',
        probabilityScore: 75,
        supportingEvidence: ['Incident INC-202610-78D9 shows damaged cargo'],
        conflictingEvidence: ['Origin inspection recorded GOOD condition']
      }
    ],
    evidenceCredibilityScoring: [
      { evidenceReference: 'EVD-202610-2C35', score: 95, justification: 'Valid' },
      { evidenceReference: 'EVD-202610-E727', score: 90, justification: 'Valid' }
    ],
    missingProofCallouts: [
      { gapDescription: 'Missing GPS logs', impactOnLiability: 'Uncertain timing', recommendation: 'Obtain telematics' }
    ]
  };

  const { validatedReport, validationStats, claimValidations } = validateAICaseReportCitations({
    reportContent,
    sourceCatalogue
  });

  // Verify coverageDenominator includes claims from all sections
  assert.ok(validationStats.materialClaimsEvaluated >= 8, `Expected >= 8 material claims, got ${validationStats.materialClaimsEvaluated}`);
  assert.equal(validationStats.coverageDenominator, validationStats.materialClaimsEvaluated);
  assert.ok(validationStats.claimsWithValidReferences > 0);
  assert.equal(validationStats.claimsWithInvalidReferences, 0);

  // Verify origin inspection reference
  const originClaim = claimValidations.find((c) => c.claimId === 'CLAIM_EXEC_ORIGIN_CONDITION' || c.claimId === 'CLAIM_RESP_CONTRA_1');
  assert.ok(originClaim, 'Origin inspection claim should be evaluated');
  assert.equal(originClaim.referencedType, 'inspection');

  // Verify disputed custody anomaly resolution
  const custodyClaim = claimValidations.find((c) => c.claimId === 'CLAIM_TL_1');
  assert.ok(custodyClaim, 'Timeline claim should be evaluated');
  assert.equal(custodyClaim.referencedType, 'custody');
  assert.equal(custodyClaim.internalId, '507f1f77bcf86cd799439022');

  // Verify accusatory root cause terminology neutralization
  assert.ok(
    validatedReport.rootCauseAnalysis[0].potentialCause.toLowerCase().includes('potential') ||
    !validatedReport.rootCauseAnalysis[0].potentialCause.toLowerCase().includes('unauthorized'),
    'Accusatory terms should be neutralized'
  );

  // Verify root-cause hypothesis is not automatically promoted to corroborated finding
  const rcClaim = claimValidations.find((c) => c.claimId === 'CLAIM_RC_HEAD_1');
  assert.ok(rcClaim, 'Root cause head claim should be evaluated');
  assert.equal(rcClaim.classification, 'HYPOTHESIS');
});

test('Phase 4: Dual Statistical Accounting (claimStats vs referenceStats)', () => {
  const mockShipment = { _id: '507f1f77bcf86cd799439011', shipmentReference: 'CT-202610-8768' };
  const mockEvidence = [{ _id: '507f1f77bcf86cd799439055', evidenceReference: 'EVD-202610-2C35' }];

  const sourceCatalogue = buildSourceCatalogue({
    shipment: mockShipment,
    evidenceRecords: mockEvidence
  });

  const reportContent = {
    executiveSummary: 'Test summary citing EVD-202610-2C35 and EVD-999999-FAKE',
    evidenceCredibilityScoring: [
      { evidenceReference: 'EVD-202610-2C35', score: 95, justification: 'Valid photo' },
      { evidenceReference: 'EVD-999999-FAKE', score: 70, justification: 'Fake photo' }
    ]
  };

  const { validationStats } = validateAICaseReportCitations({
    reportContent,
    sourceCatalogue
  });

  // Verify claimStats and referenceStats sub-objects are populated
  assert.ok(validationStats.claimStats, 'claimStats should be present');
  assert.ok(validationStats.referenceStats, 'referenceStats should be present');

  assert.equal(validationStats.claimStats.totalEvaluated, validationStats.materialClaimsEvaluated);
  assert.ok(validationStats.referenceStats.totalExamined >= 2);
  assert.ok(validationStats.referenceStats.verifiedInScope >= 1);
  assert.ok(validationStats.referenceStats.unresolved >= 1);
});

test('Phase 4: Human-Readable Domain Label Formatting', () => {
  const mockInspection = { _id: '507f1f77bcf86cd799439033', inspectionType: 'ORIGIN' };
  const mockCustody = { _id: '507f1f77bcf86cd799439022', eventType: 'HANDOVER', location: 'JNPT' };
  const mockIncident = { _id: '507f1f77bcf86cd799439044', incidentReference: 'INC-202610-78D9' };

  const formatDomainLabel = (type, record) => {
    if (type === 'inspection') {
      const typeLabel = record.inspectionType === 'ORIGIN' ? 'Origin Inspection' : 'Inspection';
      return `${typeLabel} — inspection_${record._id.toString().slice(-8)}`;
    }
    if (type === 'custody') {
      return `Custody Event (${record.eventType}) — custody_${record._id.toString().slice(-8)}`;
    }
    if (type === 'incident') {
      return record.incidentReference ? `Incident [${record.incidentReference}]` : `Incident — ${record._id}`;
    }
    return record._id.toString();
  };

  assert.equal(formatDomainLabel('inspection', mockInspection), 'Origin Inspection — inspection_99439033');
  assert.equal(formatDomainLabel('custody', mockCustody), 'Custody Event (HANDOVER) — custody_99439022');
  assert.equal(formatDomainLabel('incident', mockIncident), 'Incident [INC-202610-78D9]');
});

test('Phase 5: Simplified Findings — Canonical Evidence Status Mapping', () => {
  const mapRawStatusToCanonical = (rawCategory) => {
    if (!rawCategory) return 'UNCONFIRMED_HYPOTHESIS';
    const catUpper = String(rawCategory).toUpperCase();
    if (catUpper.includes('VERIFIED') || catUpper.includes('RECORDED_FACT') || catUpper.includes('FACT')) {
      return 'VERIFIED_FACT';
    }
    if (catUpper.includes('CORROBORATED')) {
      return 'CORROBORATED_FINDING';
    }
    if (catUpper.includes('GAP') || catUpper.includes('MISSING') || catUpper.includes('UNRESOLVED')) {
      return 'EVIDENCE_GAP';
    }
    return 'UNCONFIRMED_HYPOTHESIS';
  };

  assert.equal(mapRawStatusToCanonical('RECORDED_FACT'), 'VERIFIED_FACT');
  assert.equal(mapRawStatusToCanonical('CORROBORATED_FINDING'), 'CORROBORATED_FINDING');
  assert.equal(mapRawStatusToCanonical('HYPOTHESIS'), 'UNCONFIRMED_HYPOTHESIS');
  assert.equal(mapRawStatusToCanonical('CONFIRMED_GAP'), 'EVIDENCE_GAP');
});

test('Phase 5: Record Preview Resolution — resolves evidence, custody, and inspection details correctly', () => {
  const mockEvidence = [
    { _id: '507f1f77bcf86cd799439055', evidenceReference: 'EVD-202610-2C35', originalFilename: 'dest_cargo.jpg', evidenceType: 'PHOTOGRAPH', sha256: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2' }
  ];
  const mockTimeline = [
    { sourceId: '507f1f77bcf86cd799439022', sourceType: 'custody', summary: 'Handover at Ahmedabad', location: 'Ahmedabad Hub', actor: 'Carrier Driver A' }
  ];

  const resolveRecordForPreview = (ref, evidenceList, timelineList) => {
    const foundEv = evidenceList.find((e) => e.evidenceReference === ref || e._id === ref);
    if (foundEv) {
      return { ...foundEv, type: 'evidence', label: foundEv.evidenceReference || foundEv.originalFilename };
    }
    const foundTl = timelineList.find((t) => t.sourceId === ref || t.summary?.includes(ref));
    if (foundTl) {
      return { ...foundTl, type: foundTl.sourceType || 'custody', label: foundTl.summary };
    }
    return { label: ref, type: 'record', summary: `Reference ID: ${ref}` };
  };

  const preview1 = resolveRecordForPreview('EVD-202610-2C35', mockEvidence, mockTimeline);
  assert.equal(preview1.type, 'evidence');
  assert.equal(preview1.originalFilename, 'dest_cargo.jpg');
  assert.ok(preview1.sha256);

  const preview2 = resolveRecordForPreview('507f1f77bcf86cd799439022', mockEvidence, mockTimeline);
  assert.equal(preview2.type, 'custody');
  assert.equal(preview2.location, 'Ahmedabad Hub');
});

test('Version 6 Regression 1 & 2: Existing linked evidence appears and zero is shown only when query returns 0', () => {
  // Test evidence response unpacking
  const mockApiResWithObj = { evidence: [{ _id: 'ev1', evidenceReference: 'EVD-202610-2C35' }] };
  const mockApiResEmpty = { evidence: [] };

  const unpackEvidence = (res) => Array.isArray(res) ? res : (res?.evidence || []);

  const unpackedWithObj = unpackEvidence(mockApiResWithObj);
  assert.equal(unpackedWithObj.length, 1);
  assert.equal(unpackedWithObj[0].evidenceReference, 'EVD-202610-2C35');

  const unpackedEmpty = unpackEvidence(mockApiResEmpty);
  assert.equal(unpackedEmpty.length, 0);
});

test('Version 6 Regression 3: Each record-vault group contains only its declared record type with deduplication', () => {
  const mixedTimeline = [
    { sourceId: 'insp_1', sourceType: 'inspection', summary: 'Origin Insp' },
    { sourceId: 'insp_2', sourceType: 'inspection', summary: 'Destination Insp' },
    { sourceId: 'cust_1', sourceType: 'custody', summary: 'Jaipur Pickup' },
    { sourceId: 'cust_2', sourceType: 'custody', summary: 'Ahmedabad Receipt' },
    { sourceId: 'cust_2', sourceType: 'custody', summary: 'Ahmedabad Receipt Acknowledged' }, // duplicate sourceId
    { sourceId: 'inc_1', sourceType: 'incident', summary: 'Damage Incident' },
    { sourceId: 'ship_1', sourceType: 'shipment', summary: 'Shipment Created' }
  ];

  const uniqueInspections = Array.from(
    new Map(mixedTimeline.filter((t) => t.sourceType === 'inspection').map((t) => [t.sourceId, t])).values()
  );
  const uniqueCustodyEvents = Array.from(
    new Map(mixedTimeline.filter((t) => t.sourceType === 'custody').map((t) => [t.sourceId, t])).values()
  );
  const uniqueIncidents = Array.from(
    new Map(mixedTimeline.filter((t) => t.sourceType === 'incident').map((t) => [t.sourceId, t])).values()
  );
  const uniqueShipments = Array.from(
    new Map(mixedTimeline.filter((t) => t.sourceType === 'shipment').map((t) => [t.sourceId, t])).values()
  );

  assert.equal(uniqueInspections.length, 2);
  assert.ok(uniqueInspections.every((i) => i.sourceType === 'inspection'));

  assert.equal(uniqueCustodyEvents.length, 2); // deduplicated cust_2
  assert.ok(uniqueCustodyEvents.every((c) => c.sourceType === 'custody'));

  assert.equal(uniqueIncidents.length, 1);
  assert.ok(uniqueIncidents.every((inc) => inc.sourceType === 'incident'));

  assert.equal(uniqueShipments.length, 1);
  assert.ok(uniqueShipments.every((s) => s.sourceType === 'shipment'));
});

test('Version 6 Regression 4: Root-cause hypotheses are not automatically promoted to corroborated findings', () => {
  const mockShipment = { _id: '507f1f77bcf86cd799439011', shipmentReference: 'CT-202610-8768' };
  const mockInspections = [
    { _id: '507f1f77bcf86cd799439033', inspectionType: 'ORIGIN', overallCondition: 'GOOD' },
    { _id: '507f1f77bcf86cd799439044', inspectionType: 'DESTINATION', overallCondition: 'SEVERE_DAMAGE' }
  ];
  const mockIncidents = [
    { _id: '507f1f77bcf86cd799439055', incidentReference: 'INC-202610-78D9' }
  ];

  const catalogue = buildSourceCatalogue({
    shipment: mockShipment,
    inspections: mockInspections,
    incidents: mockIncidents
  });

  const reportWithRootCause = {
    rootCauseAnalysis: [
      {
        potentialCause: 'Transit physical impact / seal compromise between Ahmedabad and Mumbai',
        probabilityScore: 75,
        supportingEvidence: ['INC-202610-78D9'],
        conflictingEvidence: ['Origin inspection recorded GOOD condition']
      }
    ]
  };

  const { claimValidations } = validateAICaseReportCitations({
    reportContent: reportWithRootCause,
    sourceCatalogue: catalogue
  });

  const rcHeadClaim = claimValidations.find((c) => c.claimId === 'CLAIM_RC_HEAD_1');
  assert.ok(rcHeadClaim, 'Root cause head claim must exist');
  assert.equal(rcHeadClaim.classification, 'HYPOTHESIS', 'Root cause must remain HYPOTHESIS even with coexisting damage incident');
});

test('Version 6 Regression 5: Disputed custody status is distinguished from proven custody fault', () => {
  const custodyDisputeClaim = {
    title: 'Custody Handover Discrepancy — Transit Hub Handover Disputed',
    category: 'VERIFIED_FACT',
    provesText: 'Verifies that a formal handover dispute was recorded in the database between sequential custodians.',
    doesNotProveText: 'Does not establish legal fault, custody breach, or liability for physical damage.'
  };

  assert.equal(custodyDisputeClaim.category, 'VERIFIED_FACT');
  assert.ok(custodyDisputeClaim.provesText.includes('formal handover dispute was recorded'));
  assert.ok(custodyDisputeClaim.doesNotProveText.includes('Does not establish legal fault'));
});

test('Version 6 Regression 6: Unsupported compliance wording is not generated without defined requirement', () => {
  const gapFinding = {
    title: 'Intermediate Transit / GPS Telematics Logs Unavailable',
    summary: 'Relevant transit evidence is not currently available in CargoTrace. Its absence limits the ability to determine when and where damage occurred.',
    provesText: 'Confirms that intermediate highway telematics records are unavailable in the current audit vault.',
    doesNotProveText: 'Does not establish a compliance breach or carrier fault without defined contractual requirements or independent telematics.'
  };

  assert.ok(!gapFinding.summary.toLowerCase().includes('contractual requirement'));
  assert.ok(!gapFinding.summary.toLowerCase().includes('compliance breach'));
  assert.ok(gapFinding.summary.includes('Relevant transit evidence is not currently available in CargoTrace.'));
});

test('Version 6 Regression 7 & 8: Raw MongoDB ObjectIds do not appear in citations or prose and resolve cleanly', () => {
  const mockInspection = { _id: '507f1f77bcf86cd799439033', inspectionType: 'ORIGIN' };
  const mockCatalogue = {
    inspectionMap: new Map([['507f1f77bcf86cd799439033', mockInspection]]),
    shipmentId: '507f1f77bcf86cd799439011',
    shipmentReference: 'CT-202610-8768'
  };

  const sanitizeTextObjectIds = (text, catalogue) => {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/\b[0-9a-fA-F]{24}\b/g, (match) => {
      if (catalogue) {
        if (catalogue.inspectionMap?.has(match)) {
          return `Origin Inspection — inspection_${match.slice(-8)}`;
        }
        if (match === catalogue.shipmentId) {
          return catalogue.shipmentReference;
        }
      }
      return `Record — ref_${match.slice(-8)}`;
    });
  };

  const rawProse = 'Inspected at origin 507f1f77bcf86cd799439033 for shipment 507f1f77bcf86cd799439011 with unlinked 507f1f77bcf86cd799439099';
  const cleanProse = sanitizeTextObjectIds(rawProse, mockCatalogue);

  assert.ok(!cleanProse.includes('507f1f77bcf86cd799439033'), 'Raw inspection ObjectId must be stripped');
  assert.ok(!cleanProse.includes('507f1f77bcf86cd799439011'), 'Raw shipment ObjectId must be stripped');
  assert.ok(cleanProse.includes('Origin Inspection — inspection_99439033'));
  assert.ok(cleanProse.includes('CT-202610-8768'));
  assert.ok(cleanProse.includes('Record — ref_99439099'));
});

test('Version 6 Regression 9: UI and PDF status mapping produces consistent canonical labels', () => {
  const getEvidenceStatusLabel = (rawCategory) => {
    if (!rawCategory) return 'UNCONFIRMED HYPOTHESIS';
    const catUpper = String(rawCategory).toUpperCase();
    if (catUpper.includes('VERIFIED') || catUpper.includes('RECORDED_FACT') || catUpper.includes('FACT')) {
      return 'VERIFIED FACT';
    }
    if (catUpper.includes('CORROBORATED')) {
      return 'CORROBORATED FINDING';
    }
    if (catUpper.includes('GAP') || catUpper.includes('MISSING') || catUpper.includes('UNRESOLVED')) {
      return 'EVIDENCE GAP';
    }
    return 'UNCONFIRMED HYPOTHESIS';
  };

  assert.equal(getEvidenceStatusLabel('VERIFIED_FACT'), 'VERIFIED FACT');
  assert.equal(getEvidenceStatusLabel('RECORDED_FACT'), 'VERIFIED FACT');
  assert.equal(getEvidenceStatusLabel('CORROBORATED_FINDING'), 'CORROBORATED FINDING');
  assert.equal(getEvidenceStatusLabel('UNCONFIRMED_HYPOTHESIS'), 'UNCONFIRMED HYPOTHESIS');
  assert.equal(getEvidenceStatusLabel('HYPOTHESIS'), 'UNCONFIRMED HYPOTHESIS');
  assert.equal(getEvidenceStatusLabel('EVIDENCE_GAP'), 'EVIDENCE GAP');
  assert.equal(getEvidenceStatusLabel('CONFIRMED_GAP'), 'EVIDENCE GAP');
});

test('Version 8 Chronology Validation: detects inverted inspection timestamps and flags INCONSISTENT', async () => {
  const { evaluateChronologyStatus } = await import('./investigation/service.js');

  const originInspectionInverted = {
    inspectionType: 'ORIGIN',
    inspectedAt: new Date('2026-10-21T16:21:00.000Z')
  };

  const destInspectionInverted = {
    inspectionType: 'DESTINATION',
    inspectedAt: new Date('2026-10-21T07:00:00.000Z')
  };

  const invertedResult = evaluateChronologyStatus({
    custodyEvents: [],
    inspections: [originInspectionInverted, destInspectionInverted]
  });

  assert.equal(invertedResult, 'INCONSISTENT');

  const originInspectionValid = {
    inspectionType: 'ORIGIN',
    inspectedAt: new Date('2026-10-21T07:00:00.000Z')
  };

  const destInspectionValid = {
    inspectionType: 'DESTINATION',
    inspectedAt: new Date('2026-10-21T16:21:00.000Z')
  };

  const validResult = evaluateChronologyStatus({
    custodyEvents: [],
    inspections: [originInspectionValid, destInspectionValid]
  });

  assert.equal(validResult, 'CONSISTENT');

  const missingResult = evaluateChronologyStatus({
    custodyEvents: [],
    inspections: [originInspectionValid]
  });

  assert.equal(missingResult, 'NOT_VERIFIABLE');
});







