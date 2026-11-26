/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Report Export Utilities: High-fidelity PDF (jsPDF) & Excel (SheetJS / xlsx)
 * for Attendance, Feedback, Department Participation, and Reward Points.
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

/**
 * Generic Excel (.xlsx) file exporter using SheetJS
 * @param {Array<Object>} rows - Array of objects representing rows
 * @param {string} fileName - Destination filename (without extension)
 * @param {string} sheetName - Excel sheet tab name
 */
export function exportToExcel(rows, fileName = 'report', sheetName = 'Sheet1') {
  if (!rows || rows.length === 0) {
    throw new Error('No data available to export.');
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-fit column widths
  const colWidths = Object.keys(rows[0] || {}).map((key) => {
    const maxLen = rows.reduce(
      (acc, row) => Math.max(acc, String(row[key] ?? '').length),
      key.length
    );
    return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Institutional PDF Exporter using jsPDF
 * Renders an official FXEC header, summary banner, clean table layout, and IP watermark.
 */
export function exportToPDF({
  title = 'Institutional Report',
  subtitle = 'Francis Xavier Engineering College — Campus Connect',
  headers = [],
  rows = [],
  fileName = 'fxec_report',
  orientation = 'portrait',
}) {
  const isLandscape = orientation === 'landscape';
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4', // 210 x 297mm (portrait) or 297 x 210mm (landscape)
  });

  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;
  const margin = 14;
  const usableWidth = pageWidth - margin * 2;

  // Metadata Watermark
  doc.setProperties({
    title: `${title} - FXEC Campus Connect`,
    subject: subtitle,
    author: 'Krish & Ihsan',
    creator: 'Campus Connect Autonomous System (KRISH-IHSAN-FXEC-PATENT-2026-CC)',
  });

  // Header Banner (FXEC Royal Navy)
  const navy = [20, 82, 158];
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Institution Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FRANCIS XAVIER ENGINEERING COLLEGE', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Campus Connect Autonomous Guest Lecture & Event Management Platform', margin, 17);

  // Subtitle / Date in Header
  doc.setFontSize(8);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    pageWidth - margin,
    14,
    { align: 'right' }
  );

  let cursorY = 34;

  // Report Section Heading
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, margin, cursorY);
  cursorY += 5;

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, margin, cursorY);
    cursorY += 8;
  }

  // Calculate Column Widths
  const colCount = headers.length || 1;
  const colWidth = usableWidth / colCount;

  // Render Table Header
  const renderTableHeader = (y) => {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, usableWidth, 8, 'F');
    doc.setDrawColor(209, 213, 219);
    doc.line(margin, y + 8, margin + usableWidth, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    headers.forEach((h, i) => {
      const cellX = margin + i * colWidth + 2;
      doc.text(String(h).toUpperCase(), cellX, y + 5.5);
    });
  };

  renderTableHeader(cursorY);
  cursorY += 10;

  // Render Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  rows.forEach((row, rowIndex) => {
    // Page overflow check
    if (cursorY > pageHeight - 20) {
      // Footer before new page
      renderFooter(doc, pageWidth, pageHeight, margin);
      doc.addPage();

      // Top margin on next page
      cursorY = 16;
      renderTableHeader(cursorY);
      cursorY += 10;
    }

    // Zebra striping
    if (rowIndex % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, cursorY - 3.5, usableWidth, 7, 'F');
    }

    doc.setTextColor(30, 41, 59);
    row.forEach((cell, i) => {
      const cellX = margin + i * colWidth + 2;
      const textVal = String(cell ?? '—');
      // Truncate if too long for column
      const truncated = doc.splitTextToSize(textVal, colWidth - 4)[0] || textVal;
      doc.text(truncated, cellX, cursorY);
    });

    cursorY += 7;
  });

  // Final Page Footer
  renderFooter(doc, pageWidth, pageHeight, margin);

  doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

function renderFooter(doc, pageWidth, pageHeight, margin) {
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Campus Connect Platform • Patented by Krish & Ihsan • KRISH-IHSAN-FXEC-PATENT-2026-CC',
    margin,
    pageHeight - 7
  );

  const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
  doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
}

// ==============================================================================
// DOMAIN-SPECIFIC REPORT EXPORTERS
// ==============================================================================

/**
 * 1. Attendance Report Export
 */
export function exportAttendanceReport(records, eventTitle = 'Event', format = 'excel') {
  if (!records || records.length === 0) throw new Error('No attendance records found.');

  const formattedRows = records.map((r, i) => ({
    'S.No': i + 1,
    'Student Name': r.profiles?.name || r.student_name || 'N/A',
    'Register / Roll No': r.profiles?.register_number || r.profiles?.roll_number || 'N/A',
    'Department': r.profiles?.departments?.code || r.department_code || 'N/A',
    'Year': r.profiles?.year_of_study ? `Year ${r.profiles?.year_of_study}` : 'N/A',
    'Verification Mode': (r.method || 'QR_SCAN').toUpperCase(),
    'Verified At': r.verified_at
      ? new Date(r.verified_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : 'Present',
  }));

  const baseName = `fxec_attendance_${eventTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}`;

  if (format === 'excel') {
    exportToExcel(formattedRows, baseName, 'Attendance');
  } else {
    exportToPDF({
      title: `Official Attendance Register: ${eventTitle}`,
      subtitle: `Verified attendees list with tamper-proof institutional timestamp`,
      headers: ['S.No', 'Student Name', 'Roll No', 'Dept', 'Year', 'Mode', 'Verified Time'],
      rows: formattedRows.map((r) => [
        r['S.No'],
        r['Student Name'],
        r['Register / Roll No'],
        r['Department'],
        r['Year'],
        r['Verification Mode'],
        r['Verified At'],
      ]),
      fileName: baseName,
      orientation: 'landscape',
    });
  }
}

/**
 * 2. Anonymous Feedback Report Export
 */
export function exportFeedbackReport(reportData, eventTitle = 'All Sessions', format = 'excel') {
  if (!reportData) throw new Error('No feedback data available.');

  const baseName = `fxec_feedback_${eventTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}`;

  // Summary and Comments
  const comments = (reportData.anonymous_comments || []).map((c, i) => ({
    'Feedback #': i + 1,
    'Event': c.event_title || eventTitle,
    'Rating (Stars)': `${c.rating} / 5`,
    'Constructive Comment': c.comment || 'No textual commentary provided',
    'Date': c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : 'N/A',
  }));

  if (format === 'excel') {
    exportToExcel(
      comments.length > 0 ? comments : [{ 'Notice': 'No anonymous comments submitted yet.' }],
      baseName,
      'Anonymous Feedback'
    );
  } else {
    exportToPDF({
      title: `Anonymized Feedback Report: ${eventTitle}`,
      subtitle: `Average Rating: ${reportData.average_rating || 0}/5.0 • Total Reviews: ${reportData.total_submissions || 0} • Strictly Zero Student Identification`,
      headers: ['#', 'Session', 'Rating', 'Constructive Feedback Comment', 'Date'],
      rows: comments.map((c) => [
        c['Feedback #'],
        c['Event'],
        c['Rating (Stars)'],
        c['Constructive Comment'],
        c['Date'],
      ]),
      fileName: baseName,
      orientation: 'landscape',
    });
  }
}

/**
 * 3. Department Participation Report Export
 */
export function exportParticipationReport(deptStats, format = 'excel') {
  if (!deptStats || deptStats.length === 0) throw new Error('No department statistics available.');

  const rows = deptStats.map((d, i) => ({
    'Rank': i + 1,
    'Department Code': d.department_code,
    'Department Name': d.department_name,
    'Enrolled Students': d.student_count || 0,
    'Total Registrations': d.registration_count || 0,
    'Total Attendance': d.attendance_count || 0,
    'Attendance Ratio': `${Math.round(((d.attendance_count || 0) / Math.max(d.registration_count || 1, 1)) * 100)}%`,
    'Points Accumulated': d.points_earned || 0,
  }));

  const baseName = 'fxec_department_participation_analytics';

  if (format === 'excel') {
    exportToExcel(rows, baseName, 'Participation');
  } else {
    exportToPDF({
      title: 'Department Participation & Engagement Matrix',
      subtitle: 'Institutional breakdown of registrations, verified attendance, and points across FXEC departments',
      headers: ['Rank', 'Dept Code', 'Department Name', 'Students', 'Regs', 'Attended', 'Rate', 'Points'],
      rows: rows.map((r) => [
        r['Rank'],
        r['Department Code'],
        r['Department Name'],
        r['Enrolled Students'],
        r['Total Registrations'],
        r['Total Attendance'],
        r['Attendance Ratio'],
        r['Points Accumulated'],
      ]),
      fileName: baseName,
      orientation: 'landscape',
    });
  }
}

/**
 * 4. Reward Points & Leaderboard Export
 */
export function exportPointsReport(pointsList, format = 'excel') {
  if (!pointsList || pointsList.length === 0) throw new Error('No reward points data found.');

  const rows = pointsList.map((p, i) => ({
    'Rank': i + 1,
    'Student Name': p.student_name,
    'Department': p.department_code,
    'Events Attended': p.events_attended || 0,
    'Reward Points': p.total_points || 0,
  }));

  const baseName = 'fxec_student_points_leaderboard';

  if (format === 'excel') {
    exportToExcel(rows, baseName, 'Points Leaderboard');
  } else {
    exportToPDF({
      title: 'Student Points & Engagement Leaderboard',
      subtitle: 'Merit standing based on verified attendance and coordinator-awarded interaction points',
      headers: ['Rank', 'Student Name', 'Department', 'Events Attended', 'Total Reward Points'],
      rows: rows.map((r) => [
        r['Rank'],
        r['Student Name'],
        r['Department'],
        r['Events Attended'],
        r['Reward Points'],
      ]),
      fileName: baseName,
      orientation: 'portrait',
    });
  }
}
