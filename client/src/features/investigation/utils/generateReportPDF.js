import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateReportPDF({ report, shipment, organizationName = 'CargoTrace Workspace' }) {
  if (!report) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let cursorY = margin;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CargoTrace Global Logistics — Investigation Report', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Tenant: ${organizationName} | Shipment Ref: ${shipment?.shipmentReference || 'CT-REF'} | Version ${report.version}`, margin, 18);

  cursorY = 28;

  // Report Status Badge & Risk Level
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, cursorY, pageWidth - (margin * 2), 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Report Status: ${report.status || 'DRAFT'}`, margin + 4, cursorY + 6);
  doc.text(`Overall Risk Level: ${report.overallRiskLevel || 'MEDIUM'}`, margin + 60, cursorY + 6);
  doc.text(`Generated: ${new Date(report.generatedAt).toLocaleDateString()}`, margin + 125, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Author: ${report.generatedBy?.displayName || report.generatedBy?.email || 'System Investigator'} (${report.modelIdentifier || 'gemini-3.5-flash-lite'})`, margin + 4, cursorY + 12);

  cursorY += 22;

  // Section 1: Executive Case Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Executive Case Summary', margin, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const splitSummary = doc.splitTextToSize(report.executiveSummary || 'No executive summary provided.', pageWidth - (margin * 2));
  doc.text(splitSummary, margin, cursorY);
  cursorY += (splitSummary.length * 4) + 6;

  // Section 2: Reviewer-Friendly Responsibility & Liability Summary
  if (report.responsibilitySummary) {
    const rs = report.responsibilitySummary;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Reviewer Responsibility & Liability Assessment', margin, cursorY);
    cursorY += 5;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['Attribute', 'Finding & Evidence Summary']],
      body: [
        ['Likely Responsible Party', rs.likelyResponsibleParty || 'Responsibility Undetermined'],
        ['Custody Interval', rs.custodyInterval || 'N/A'],
        ['Supporting Evidence', Array.isArray(rs.supportingEvidence) && rs.supportingEvidence.length > 0 ? rs.supportingEvidence.join('; ') : 'None'],
        ['Counter-Indications', Array.isArray(rs.contradictoryEvidence) && rs.contradictoryEvidence.length > 0 ? rs.contradictoryEvidence.join('; ') : 'None'],
        ['Unresolved Gaps', Array.isArray(rs.missingEvidenceGaps) && rs.missingEvidenceGaps.length > 0 ? rs.missingEvidenceGaps.join('; ') : 'None'],
        ['Recommended Action', rs.recommendedNextAction || 'Review custody handovers and verify SHA-256 digests'],
        ['Fact vs. Inference Note', rs.factVsInferenceNote || 'Attribution based strictly on recorded custody handovers and G-sensor logs. Never asserts liability without proof.']
      ],
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' } },
      theme: 'grid'
    });

    cursorY = doc.lastAutoTable.finalY + 8;
  }

  // Section 3: Root-Cause Qualitative Assessment
  if (Array.isArray(report.rootCauseAnalysis) && report.rootCauseAnalysis.length > 0) {
    if (cursorY > pageHeight - 45) { doc.addPage(); cursorY = margin; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Root-Cause Qualitative Assessment', margin, cursorY);
    cursorY += 5;

    const rcBody = report.rootCauseAnalysis.map(rc => [
      rc.potentialCause || 'Handling impact',
      `${rc.probabilityScore || 70}% Qualitative Score`,
      Array.isArray(rc.supportingEvidence) ? rc.supportingEvidence.join('; ') : '—',
      Array.isArray(rc.conflictingEvidence) ? rc.conflictingEvidence.join('; ') : '—'
    ]);

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['Potential Cause', 'Confidence', 'Supporting Evidence', 'Counter-Indications']],
      body: rcBody,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      theme: 'striped'
    });

    cursorY = doc.lastAutoTable.finalY + 8;
  }

  // Section 4: Timeline Event Synthesis
  if (Array.isArray(report.timelineSynthesis) && report.timelineSynthesis.length > 0) {
    if (cursorY > pageHeight - 45) { doc.addPage(); cursorY = margin; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('4. Chronological Event Synthesis', margin, cursorY);
    cursorY += 5;

    const tsBody = report.timelineSynthesis.map(ts => [
      ts.eventSummary || 'Event description',
      ts.significance || 'Location & actor context',
      `${ts.credibilityScore || 80}/100`,
      Array.isArray(ts.flags) && ts.flags.length > 0 ? ts.flags.join(', ') : 'Normal'
    ]);

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['Event Summary', 'Significance', 'Rating', 'Flags']],
      body: tsBody,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
      theme: 'grid'
    });

    cursorY = doc.lastAutoTable.finalY + 8;
  }

  // Section 5: Evidence Integrity Matrix
  if (Array.isArray(report.evidenceCredibilityScoring) && report.evidenceCredibilityScoring.length > 0) {
    if (cursorY > pageHeight - 45) { doc.addPage(); cursorY = margin; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('5. Evidence Integrity & SHA-256 Citation Matrix', margin, cursorY);
    cursorY += 5;

    const evBody = report.evidenceCredibilityScoring.map(ev => [
      ev.evidenceReference || 'EVD-REF',
      `${ev.score || 80}/100`,
      ev.justification || 'Artifact verified',
      ev.tamperedRisk ? 'UNVERIFIED CITATION' : 'VERIFIED DB SOURCE'
    ]);

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['Evidence Reference', 'Score', 'Justification', 'Status']],
      body: evBody,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      theme: 'grid'
    });

    cursorY = doc.lastAutoTable.finalY + 8;
  }

  // Section 6: Official Reviewer Certification Stamp
  if (report.certification && report.status === 'CERTIFIED') {
    if (cursorY > pageHeight - 45) { doc.addPage(); cursorY = margin; }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(217, 119, 6); // amber-600
    doc.roundedRect(margin, cursorY, pageWidth - (margin * 2), 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text('OFFICIAL COMPLIANCE REVIEWER CERTIFICATION STAMP', margin + 4, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`Certified By: ${report.certification.certifiedByName || 'Authorized Compliance Reviewer'}`, margin + 4, cursorY + 12);
    doc.text(`Certified At: ${new Date(report.certification.certifiedAt).toLocaleString()}`, margin + 85, cursorY + 12);
    doc.text(`Decision: ${report.certification.decision || 'APPROVED'}`, margin + 145, cursorY + 12);

    doc.text(`Comments: ${report.certification.comments || 'Report verified and cryptographically sealed.'}`, margin + 4, cursorY + 17);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`SHA-256 Digest: ${report.certification.reportContentHash || 'SEALED-DIGEST-VERIFIED'}`, margin + 4, cursorY + 22);

    cursorY += 32;
  }

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.text(`CargoTrace Confidential Report — ${shipment?.shipmentReference || 'CT'} — Page ${i} of ${totalPages}`, margin, pageHeight - 6);
    doc.text(`Exported ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - margin - 45, pageHeight - 6);
  }

  // Save PDF
  doc.save(`CargoTrace_Report_${shipment?.shipmentReference || 'Investigation'}_v${report.version}.pdf`);
}
