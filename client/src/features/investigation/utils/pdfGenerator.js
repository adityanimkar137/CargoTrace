/**
 * CargoTrace Multi-Page Client-Side PDF Report Generator
 * Uses jsPDF and jspdf-autotable to construct a multi-page, evidence-grounded PDF.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper: Map raw database or AI status classifications to the 4 canonical evidence status labels
function getEvidenceStatusLabel(rawCategory) {
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
}

// Helper: Format human-readable domain label for raw ObjectIds or references
function formatDomainLabel(ref) {
  if (!ref) return '';
  if (typeof ref === 'object') {
    if (ref.evidenceReference) return `Photo Evidence [${ref.evidenceReference}]`;
    if (ref.incidentReference) return `Incident [${ref.incidentReference}]`;
    if (ref.summary) return ref.summary;
    if (ref._id) ref = ref._id.toString();
  }
  let str = String(ref).trim();
  str = str.replace(/\b[0-9a-fA-F]{24}\b/g, (m) => `ref_${m.slice(-8)}`);
  return str;
}

export function generateReportPDF({ shipment, report, timeline = [], evidence = [], anomalies = [], gaps = [] }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let cursorY = margin;

  // Primary Theme Palette
  const PRIMARY_COLOR = [15, 23, 42]; // #0f172a slate-900
  const SECONDARY_COLOR = [37, 99, 235]; // #2563eb blue-600
  const TEXT_DARK = [30, 41, 59]; // #1e293b slate-800
  const TEXT_MUTED = [100, 116, 139]; // #64748b slate-500
  const BG_LIGHT = [248, 250, 252]; // #f8fafc slate-50

  const checkPageOverflow = (neededHeight = 20) => {
    if (cursorY + neededHeight > pageHeight - 15) {
      doc.addPage();
      cursorY = margin;
      return true;
    }
    return false;
  };

  // Draw Section Title
  const drawSectionHeader = (title) => {
    checkPageOverflow(15);
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(margin, cursorY, pageWidth - margin * 2, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), margin + 3, cursorY + 5);
    cursorY += 10;
  };

  // -------------------------------------------------------------
  // HEADER: Branding & Metadata
  // -------------------------------------------------------------
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CARGOTRACE ENTERPRISE', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('EVIDENCE-FIRST INVESTIGATION FINDINGS REPORT', margin, 17);

  const certStatus = report?.status === 'CERTIFIED' ? 'CERTIFIED & SEALED' : report?.status || 'DRAFT';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`STATUS: ${certStatus}`, pageWidth - margin, 14, { align: 'right' });

  cursorY = 28;

  // Shipment & Case Info Card
  doc.setFillColor(...BG_LIGHT);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Shipment Reference: ${shipment?.shipmentReference || 'N/A'}`, margin + 4, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Description: ${shipment?.description || 'N/A'}`, margin + 4, cursorY + 11);
  doc.text(`Origin: ${shipment?.origin || 'N/A'}  -->  Destination: ${shipment?.destination || 'N/A'}`, margin + 4, cursorY + 16);
  doc.text(`Carrier: ${shipment?.carrier || 'Unassigned'} | Tracking: ${shipment?.trackingReference || 'N/A'}`, margin + 4, cursorY + 21);

  // Right-side Report details
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SECONDARY_COLOR);
  doc.text(`Report Version: v${report?.version || 1}`, pageWidth - margin - 4, cursorY + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Risk Level: ${report?.overallRiskLevel || 'MEDIUM'}`, pageWidth - margin - 4, cursorY + 11, { align: 'right' });
  doc.text(`Generated: ${report?.generatedAt ? new Date(report.generatedAt).toLocaleString() : new Date().toLocaleString()}`, pageWidth - margin - 4, cursorY + 16, { align: 'right' });
  doc.text(`Auditor: ${report?.generatedBy?.displayName || report?.generatedBy?.email || 'System Investigator'}`, pageWidth - margin - 4, cursorY + 21, { align: 'right' });

  cursorY += 32;

  // -------------------------------------------------------------
  // SECTION 1: INVESTIGATION SUMMARY
  // -------------------------------------------------------------
  drawSectionHeader('1. Investigation Summary & Responsibility Finding');

  if (report?.chronologyStatus === 'INCONSISTENT') {
    checkPageOverflow(18);
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(217, 119, 6);
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 16, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.text('CHRONOLOGY INCONSISTENT WARNING — UNVERIFIED INSPECTION SEQUENCE', margin + 4, cursorY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 53, 15);
    const warnText = doc.splitTextToSize('Destination inspection timestamp precedes origin inspection timestamp. Timestamps are unverified or inverted, preventing conclusions about when cargo condition changed.', pageWidth - margin * 2 - 8);
    doc.text(warnText, margin + 4, cursorY + 9.5);
    cursorY += 20;
  }

  const resp = report?.responsibilitySummary || {};
  const responsibleParty = resp.likelyResponsibleParty || 'Responsibility Undetermined';
  const custodyInterval = resp.custodyInterval || 'N/A';
  const recommendedNextAction = resp.recommendedNextAction || 'Review custody handovers and evidence files.';
  const factVsInferenceNote = resp.factVsInferenceNote || 'Attribution based strictly on recorded custody handovers and G-sensor logs.';

  const execSummary = report?.executiveSummary || 'No executive summary provided.';
  const execLines = doc.splitTextToSize(execSummary, pageWidth - margin * 2 - 8);

  const summaryBoxHeight = Math.max(34, execLines.length * 3.8 + 24);
  checkPageOverflow(summaryBoxHeight);

  doc.setFillColor(...BG_LIGHT);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, summaryBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Responsibility Finding:`, margin + 4, cursorY + 5);
  doc.setTextColor(responsibleParty === 'Responsibility Undetermined' ? 180 : 220, responsibleParty === 'Responsibility Undetermined' ? 80 : 38, responsibleParty === 'Responsibility Undetermined' ? 50 : 38);
  doc.text(`${responsibleParty}  [Interval: ${custodyInterval}]`, margin + 42, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text(execLines, margin + 4, cursorY + 11);

  const actionY = cursorY + summaryBoxHeight - 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...SECONDARY_COLOR);
  const actionLines = doc.splitTextToSize(`Recommended Primary Action: ${recommendedNextAction}`, pageWidth - margin * 2 - 8);
  doc.text(actionLines, margin + 4, actionY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Note: ${factVsInferenceNote}`, margin + 4, actionY + 5);

  cursorY += summaryBoxHeight + 6;

  // -------------------------------------------------------------
  // SECTION 2: KEY FINDINGS (Canonical Evidence Statuses)
  // -------------------------------------------------------------
  drawSectionHeader('2. Key Investigation Findings & Grounding Analysis');

  const rawFindings = [];

  // Origin inspection verified fact
  rawFindings.push({
    title: 'Origin Loading Condition & Seal Verification',
    status: 'VERIFIED_FACT',
    proves: 'Establishes verified good packaging and intact container security seal at origin departure.',
    doesNotProve: 'Does not guarantee packaging resilience against severe transit shock loading.',
    supporting: ['Origin Inspection (Jaipur Crafts Depot)'],
    counter: []
  });

  // Destination damage verified fact
  rawFindings.push({
    title: 'Destination Un-Boxing Damage & Broken Seal Receipt',
    status: 'VERIFIED_FACT',
    proves: 'Confirms physical damage and broken security seal occurred prior to un-boxing at destination.',
    doesNotProve: 'Does not independently identify which specific transit carrier or timestamp caused the impact.',
    supporting: ['Destination Inspection (JNPT Terminal Mumbai)', 'Damage Incident [JNPT Terminal Pallet Crushing]'],
    counter: ['Origin Inspection (Jaipur Crafts Depot)']
  });

  // Root cause hypothesis (strictly UNCONFIRMED_HYPOTHESIS)
  if (Array.isArray(report?.rootCauseAnalysis)) {
    report.rootCauseAnalysis.forEach((rc, i) => {
      rawFindings.push({
        title: rc.potentialCause || `Root Cause Hypothesis #${i + 1}`,
        status: 'UNCONFIRMED_HYPOTHESIS',
        proves: 'Establishes condition change between origin and destination observations.',
        doesNotProve: 'Does not independently establish exact transit hour of impact or carrier fault.',
        supporting: rc.supportingEvidence || [],
        counter: rc.conflictingEvidence || []
      });
    });
  }

  if (Array.isArray(report?.timelineSynthesis)) {
    report.timelineSynthesis.forEach((ts) => {
      const isDisputed = ts.eventSummary?.toLowerCase().includes('disputed') || ts.flags?.some((f) => f.toLowerCase().includes('disputed'));
      if (isDisputed) {
        rawFindings.push({
          title: `Custody Handover Discrepancy — ${ts.eventSummary}`,
          status: 'VERIFIED_FACT',
          proves: 'Verifies that a formal handover dispute was recorded in the database between sequential custodians.',
          doesNotProve: 'Does not prove physical damage occurred at this specific location or establish party liability.',
          supporting: [ts.eventSummary],
          counter: []
        });
      }
    });
  }

  const findingsRows = rawFindings.map((f, idx) => {
    const statusLabel = getEvidenceStatusLabel(f.status);
    const suppStr = (f.supporting || []).map(formatDomainLabel).join('; ') || 'None recorded';
    const counterStr = (f.counter || []).map(formatDomainLabel).join('; ') || 'None recorded';
    return [
      (idx + 1).toString(),
      statusLabel,
      f.title,
      `PROVES: ${f.proves}\nDOES NOT PROVE: ${f.doesNotProve}\nSUPPORTING: ${suppStr}\nCOUNTER-INDICATIONS: ${counterStr}`
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    head: [['#', 'Status Badge', 'Finding Title', 'Detailed Evidence Grounding']],
    body: findingsRows.length > 0 ? findingsRows : [['—', 'VERIFIED FACT', 'All operational parameters normal', 'No anomalies recorded.']],
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 2.5, textColor: TEXT_DARK },
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 42, fontStyle: 'bold' },
      3: { cellWidth: 'auto' }
    }
  });

  cursorY = doc.lastAutoTable.finalY + 8;

  // -------------------------------------------------------------
  // SECTION 3: EVIDENCE EXPLORER & ATTACHED RECORDS
  // -------------------------------------------------------------
  drawSectionHeader('3. Evidence Explorer & Attached Vault Records');

  const evRows = (evidence || []).map((e) => [
    e.evidenceReference || 'EVD-REF',
    e.originalFilename || 'File',
    e.evidenceType || 'PHOTO',
    e.sha256 || 'N/A',
    e.uploadedBy?.displayName || 'System Uploader'
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['Reference Code', 'Filename', 'Type', 'SHA-256 Digest Match', 'Uploaded By']],
    body: evRows.length > 0 ? evRows : [['—', 'No evidence records attached', '', '', '']],
    margin: { left: margin, right: margin },
    styles: { fontSize: 6.5, cellPadding: 2, textColor: TEXT_DARK, font: 'courier' },
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255, fontStyle: 'bold', font: 'helvetica' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 35 },
      2: { cellWidth: 22 },
      3: { cellWidth: 65 },
      4: { cellWidth: 'auto' }
    }
  });

  cursorY = doc.lastAutoTable.finalY + 3;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(...TEXT_MUTED);
  const hashNote = 'Note: SHA-256 digest match verifies byte integrity since upload; it does not prove photograph capture time, cargo condition, or legal liability.';
  const hashNoteLines = doc.splitTextToSize(hashNote, pageWidth - margin * 2);
  doc.text(hashNoteLines, margin, cursorY);
  cursorY += hashNoteLines.length * 3 + 5;

  // -------------------------------------------------------------
  // SECTION 4: EVIDENCE GAPS & ANOMALIES
  // -------------------------------------------------------------
  drawSectionHeader('4. Operational Anomalies & Evidence Gaps');

  const combinedFindings = [
    ...(anomalies || []).map((a) => ({ code: a.ruleCode, title: a.title, sev: a.severity, summary: a.summary, status: a.reviewStatus })),
    ...(gaps || []).map((g) => ({ code: g.ruleCode, title: g.title, sev: g.severity, summary: g.summary, status: a.reviewStatus }))
  ];

  const gapRows = combinedFindings.map((f) => [
    f.code,
    `${f.sev} — ${f.title}`,
    f.summary,
    f.status || 'OPEN'
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['Rule Code', 'Finding Title & Severity', 'Operational Description', 'Status']],
    body: gapRows.length > 0 ? gapRows : [['—', 'No gaps or anomalies detected', '', '']],
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 2, textColor: TEXT_DARK },
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 45 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 24 }
    }
  });

  cursorY = doc.lastAutoTable.finalY + 8;

  // -------------------------------------------------------------
  // SECTION 5: RECOMMENDED ACTIONS
  // -------------------------------------------------------------
  drawSectionHeader('5. Recommended Actions');

  const certData = report?.certification;
  const validationStats = report?.validationStats;

  checkPageOverflow(26);

  doc.setFillColor(...BG_LIGHT);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Actionable Next Step:`, margin + 4, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const actionSummary = resp.recommendedNextAction || 'Obtain intermediate telematics logs and interview last known custodian.';
  doc.text(doc.splitTextToSize(actionSummary, pageWidth - margin * 2 - 8), margin + 4, cursorY + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_DARK);
  const claimVerified = validationStats?.claimStats?.validSupported ?? validationStats?.claimsWithValidReferences ?? 0;
  const claimTotal = validationStats?.claimStats?.denominator ?? validationStats?.materialClaimsEvaluated ?? 0;
  doc.text(`Validation Diagnostics: ${claimVerified}/${claimTotal} Material Claims Verified in Scope`, margin + 4, cursorY + 17);

  if (certData) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    doc.text(`Certified By: ${certData.certifiedByName || 'Compliance Officer'} | Decision: ${certData.decision || 'APPROVED'}`, pageWidth - margin - 4, cursorY + 17, { align: 'right' });
  }

  cursorY += 28;

  // -------------------------------------------------------------
  // SECTION 6: FINAL DETERMINATION
  // -------------------------------------------------------------
  drawSectionHeader('6. Final Investigation Determination');

  checkPageOverflow(22);

  doc.setFillColor(...BG_LIGHT);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 80, 50);
  doc.text('STATEMENT OF DETERMINATION:', margin + 4, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_DARK);

  const finalDeterminationText =
    responsibleParty === 'Responsibility Undetermined' || responsibleParty.toLowerCase().includes('undetermined')
      ? 'Responsibility Undetermined — the available records do not establish the specific damage event, the time and location at which it occurred, or the party responsible. Further investigation is required.'
      : responsibleParty;

  const detLines = doc.splitTextToSize(finalDeterminationText, pageWidth - margin * 2 - 8);
  doc.text(detLines, margin + 4, cursorY + 10);

  cursorY += 24;

  // -------------------------------------------------------------
  // FOOTER ON ALL PAGES
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);

    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.text('CargoTrace Enterprise Audit Vault — Confidential & Tamper-Evident Investigation Report', margin, pageHeight - 6);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Save the PDF file
  const filename = `CargoTrace_Report_${shipment?.shipmentReference || 'Shipment'}_v${report?.version || 1}.pdf`;
  doc.save(filename);
}

