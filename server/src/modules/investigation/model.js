/**
 * CargoTrace Investigation Review Model
 * Persists human review decisions and oversight notes for system-detected anomalies and evidence gaps.
 */
import mongoose from 'mongoose';

export const REVIEW_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'ADDRESSED', 'NOT_APPLICABLE'];
export const FINDING_TYPES = ['ANOMALY', 'EVIDENCE_GAP'];

const investigationReviewSchema = new mongoose.Schema(
  {
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
      index: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    findingId: {
      type: String,
      required: true,
      trim: true
    },
    findingType: {
      type: String,
      enum: FINDING_TYPES,
      required: true
    },
    status: {
      type: String,
      enum: REVIEW_STATUSES,
      default: 'ACKNOWLEDGED'
    },
    reviewNotes: {
      type: String,
      trim: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

investigationReviewSchema.index({ organization: 1, shipment: 1, findingId: 1 }, { unique: true });

export const InvestigationReview = mongoose.model('InvestigationReview', investigationReviewSchema);

const aiInvestigationReportSchema = new mongoose.Schema(
  {
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
      index: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    version: {
      type: Number,
      required: true,
      default: 1
    },
    overallRiskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM'
    },
    executiveSummary: {
      type: String,
      required: true
    },
    timelineSynthesis: [
      {
        eventSummary: String,
        significance: String,
        credibilityScore: Number,
        flags: [String]
      }
    ],
    rootCauseAnalysis: [
      {
        potentialCause: String,
        probabilityScore: Number,
        supportingEvidence: [String],
        conflictingEvidence: [String]
      }
    ],
    evidenceCredibilityScoring: [
      {
        evidenceReference: String,
        score: Number,
        justification: String,
        tamperedRisk: Boolean
      }
    ],
    missingProofCallouts: [
      {
        gapDescription: String,
        impactOnLiability: String,
        recommendation: String
      }
    ],
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    generatorType: {
      type: String,
      enum: ['GEMINI', 'RULE_BASED'],
      default: 'GEMINI'
    },
    generationStatus: {
      type: String,
      enum: ['COMPLETED', 'FALLBACK', 'FAILED'],
      default: 'COMPLETED'
    },
    fallbackReason: {
      type: String,
      default: ''
    },
    modelIdentifier: {
      type: String,
      default: 'gemini-3.5-flash-lite'
    },
    validationStats: {
      totalCitations: { type: Number, default: 0 },
      verifiedCitations: { type: Number, default: 0 },
      unverifiedCitations: { type: Number, default: 0 },
      materialClaimsEvaluated: { type: Number, default: 0 },
      claimsWithValidReferences: { type: Number, default: 0 },
      claimsUnsupportedByRecords: { type: Number, default: 0 },
      claimsWithInvalidReferences: { type: Number, default: 0 },
      claimsNotEvaluated: { type: Number, default: 0 },
      coverageDenominator: { type: Number, default: 0 },
      coverageScope: { type: String, default: '' },
      isFullyValidated: { type: Boolean, default: false },
      claimStats: {
        totalEvaluated: { type: Number, default: 0 },
        validSupported: { type: Number, default: 0 },
        unsupportedProposition: { type: Number, default: 0 },
        missingCitation: { type: Number, default: 0 },
        invalidCitation: { type: Number, default: 0 },
        unverifiedSupport: { type: Number, default: 0 },
        notEvaluated: { type: Number, default: 0 },
        denominator: { type: Number, default: 0 }
      },
      referenceStats: {
        totalExamined: { type: Number, default: 0 },
        verifiedInScope: { type: Number, default: 0 },
        notFound: { type: Number, default: 0 },
        shipmentMismatch: { type: Number, default: 0 },
        tenantMismatch: { type: Number, default: 0 },
        typeMismatch: { type: Number, default: 0 },
        unresolved: { type: Number, default: 0 }
      }
    },
    claimValidations: [
      {
        claimId: String,
        section: String,
        classification: { type: String, enum: ['RECORDED_FACT', 'CORROBORATED_FINDING', 'HYPOTHESIS', 'UNRESOLVED', 'CONFIRMED_GAP'], default: 'HYPOTHESIS' },
        proposition: String,
        referencedType: String,
        referencedId: String,
        internalId: String,
        existsInScope: Boolean,
        supportsClaim: Boolean,
        validationStatus: { type: String, enum: ['VALID', 'UNSUPPORTED', 'UNVERIFIED', 'CROSS_TENANT_REJECTED', 'CROSS_SHIPMENT_REJECTED', 'TYPE_MISMATCH', 'NO_REFERENCE_PROVIDED'], default: 'UNVERIFIED' },
        explanation: String,
        supportingReferences: [String],
        contradictoryReferences: [String]
      }
    ],
    confidenceDimensions: {
      recordExistenceNote: { type: String, default: 'High confidence that recorded database events exist.' },
      claimCorroborationNote: { type: String, default: 'Corroboration assessed against independent physical and digital evidence.' },
      causalHypothesisNote: { type: String, default: 'Root cause interval remains a plausible hypothesis until direct physical proof is provided.' },
      partyAttributionNote: { type: String, default: 'Party attribution requires formal dispute resolution or direct eyewitness photo proof.' }
    },
    dataSnapshotAt: {
      type: Date,
      default: Date.now
    },
    responsibilitySummary: {
      likelyResponsibleParty: { type: String, default: 'Responsibility Undetermined' },
      custodyInterval: { type: String, default: 'N/A' },
      supportingEvidence: [{ type: String }],
      contradictoryEvidence: [{ type: String }],
      missingEvidenceGaps: [{ type: String }],
      recommendedNextAction: { type: String, default: 'Review custody handovers and evidence files.' },
      factVsInferenceNote: { type: String, default: 'Attribution based strictly on recorded custody handovers and G-sensor logs.' }
    },
    status: {
      type: String,
      enum: ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'CERTIFIED'],
      default: 'DRAFT'
    },
    chronologyStatus: {
      type: String,
      enum: ['CONSISTENT', 'INCONSISTENT', 'NOT_VERIFIABLE'],
      default: 'NOT_VERIFIABLE'
    },
    certification: {
      certifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      certifiedByName: { type: String, default: '' },
      certifiedAt: { type: Date },
      decision: { type: String, enum: ['APPROVED', 'REJECTED', 'CERTIFIED_WITH_RESERVATIONS'] },
      comments: { type: String, default: '' },
      reportContentHash: { type: String, default: '' }
    }
  },
  {
    timestamps: true
  }
);

aiInvestigationReportSchema.index({ organization: 1, shipment: 1, version: 1 }, { unique: true });

export const AIInvestigationReport = mongoose.model('AIInvestigationReport', aiInvestigationReportSchema);

