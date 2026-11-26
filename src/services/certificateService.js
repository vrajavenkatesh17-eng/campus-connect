import { supabase, isSupabaseConfigured } from './supabase';
import { jsPDF } from 'jspdf';
import {
  FXEC_LOGO_BASE64,
  FRAUNCES_REGULAR_TTF_BASE64,
  JETBRAINS_MONO_TTF_BASE64,
} from '../assets/certificateAssets';

export const certificateService = {
  /**
   * Issues an official certificate for a student for a concluded event.
   * Server validates attendance, event status, and feedback submission (if required by app_settings).
   * Prevents duplicates via unique constraint.
   * @param {string} eventId
   */
  async issueCertificate(eventId) {
    if (!isSupabaseConfigured) throw new Error('Database is not configured.');

    const { data, error } = await supabase.rpc('issue_certificate', {
      p_event_id: eventId,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Public certificate verification function.
   * Granted to anon so external employers or viewers can verify authenticity.
   * Returns validation status, student name, department, event title, date, speaker.
   * @param {string} code
   */
  async verifyCertificate(code) {
    if (!isSupabaseConfigured) {
      return { valid: false, message: 'Database not available.' };
    }

    const { data, error } = await supabase.rpc('verify_certificate', {
      p_code: code.trim(),
    });

    if (error) {
      console.error('Certificate verification error:', error);
      return { valid: false, message: error.message || 'Verification failed.' };
    }

    return data;
  },

  /**
   * Fetches all issued certificates for the currently authenticated student.
   */
  async getMyCertificates() {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_code,
        issued_at,
        student_id,
        event:event_id(
          id,
          title,
          start_time,
          end_time,
          status,
          speaker:speaker_id(
            id,
            name,
            designation,
            company
          )
        )
      `)
      .order('issued_at', { ascending: false });

    if (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Generates a printable A4 Landscape PDF using jsPDF.
   * Institutional Navy & Gold design with FXEC branding, embedded Fraunces & JetBrains Mono fonts, and verification QR code.
   * Per S-T: A4 landscape, ivory background, navy text, gold hairline border,
   * logo at top (90px), gold seal, student name in Fraunces, event, date, speaker, certificate ID in JetBrains Mono, QR to /verify/:code, signature lines.
   * @param {Object} cert
   * @param {string} [qrDataUrl] - Base64 PNG data URL of the verification QR code
   */
  generateCertificatePDF(cert, qrDataUrl = null) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4', // 297mm x 210mm
    });

    // Embed Fraunces & JetBrains Mono TTF fonts directly (no fallback)
    try {
      doc.addFileToVFS('Fraunces-Regular.ttf', FRAUNCES_REGULAR_TTF_BASE64);
      doc.addFont('Fraunces-Regular.ttf', 'Fraunces', 'normal');
      doc.addFont('Fraunces-Regular.ttf', 'Fraunces', 'bold');

      doc.addFileToVFS('JetBrainsMono-Regular.ttf', 'JetBrainsMono');
      doc.addFont('JetBrainsMono-Regular.ttf', 'JetBrainsMono', 'normal');
      doc.addFont('JetBrainsMono-Regular.ttf', 'JetBrainsMono', 'bold');
    } catch (fontErr) {
      console.warn('Font embedding notice:', fontErr);
    }

    // Metadata Watermark & Digital IP Attribution
    doc.setProperties({
      title: `FXEC Certificate - ${cert.certificate_code || 'Participation'}`,
      subject: 'Official Institutional Participation Credential',
      author: 'Francis Xavier Engineering College',
      keywords: 'Francis Xavier Engineering College, FXEC, Campus Connect, Autonomous',
      creator: 'Campus Connect - FXEC Autonomous Event Management System',
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const centerX = pageWidth / 2;

    // S-T RETHEME: Navy & Gold Palette
    const navyDeep = [11, 31, 68]; // #0B1F44
    const navyText = [14, 26, 51]; // #0E1A33
    const primaryBlue = [20, 82, 158]; // #14529E
    const gold = [241, 185, 55]; // #F1B937
    const ivory = [251, 248, 245]; // #FBF8F5 ivory
    const mutedNeutral = [91, 103, 129]; // #5B6781 muted

    // 1. Background: Ivory per S-T
    doc.setFillColor(...ivory);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // 2. Gold Hairline Border & Accents per S-T
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.45);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // Inner Navy Hairline Border
    doc.setDrawColor(...navyDeep);
    doc.setLineWidth(0.2);
    doc.rect(10.5, 10.5, pageWidth - 21, pageHeight - 21);

    // Corner Accents (Gold)
    const cornerSize = 3;
    doc.setFillColor(...gold);
    doc.rect(10.5, 10.5, cornerSize, cornerSize, 'F');
    doc.rect(pageWidth - 10.5 - cornerSize, 10.5, cornerSize, cornerSize, 'F');
    doc.rect(10.5, pageHeight - 10.5 - cornerSize, cornerSize, cornerSize, 'F');
    doc.rect(pageWidth - 10.5 - cornerSize, pageHeight - 10.5 - cornerSize, cornerSize, cornerSize, 'F');

    // 3. College Logo at Top (90px size in PDF ~ 24mm) per S-T 3
    const logoSize = 24;
    try {
      doc.addImage(FXEC_LOGO_BASE64, 'PNG', centerX - 92, 14, logoSize, logoSize);
    } catch (imgErr) {
      console.warn('Could not render logo in PDF:', imgErr);
    }

    // Header: Institution Details
    doc.setFont('Fraunces', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...navyDeep);
    doc.text('FRANCIS XAVIER ENGINEERING COLLEGE', centerX + 12, 23, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedNeutral);
    doc.text(
      'An Autonomous Institution | Accredited by NBA & NAAC with "A+" Grade | Approved by AICTE',
      centerX + 12,
      28.5,
      { align: 'center' }
    );
    doc.text('Vannarpettai, Tirunelveli - 627003, Tamil Nadu, India • www.francisxavier.ac.in', centerX + 12, 33, {
      align: 'center',
    });

    // Decorative Gold Hairline Rule
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.35);
    doc.line(centerX - 80, 37, centerX + 80, 37);

    // Title: Certificate of Participation
    doc.setFont('Fraunces', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...primaryBlue);
    doc.text('CERTIFICATE OF PARTICIPATION', centerX, 47, { align: 'center' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...mutedNeutral);
    doc.text('This is proudly presented to', centerX, 55, { align: 'center' });

    // 4. Student Name in Fraunces & Navy per S-T
    doc.setFont('Fraunces', 'normal');
    doc.setFontSize(22);
    doc.setTextColor(...navyDeep);
    const studentName = (cert.student_name || 'STUDENT OF FXEC').toUpperCase();
    doc.text(studentName, centerX, 66, { align: 'center' });

    // Hairline Name Accent Line (Gold)
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.35);
    const nameWidth = doc.getTextWidth(studentName);
    doc.line(centerX - nameWidth / 2 - 8, 69, centerX + nameWidth / 2 + 8, 69);

    // Department & Course
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...navyText);
    const deptText = `from the Department of ${cert.department || cert.department_name || 'Engineering'}`;
    doc.text(deptText, centerX, 76, { align: 'center' });

    doc.text(
      'for actively engaging in the Technical Session / Guest Lecture entitled:',
      centerX,
      82,
      { align: 'center' }
    );

    // Event Title (Primary Blue)
    doc.setFont('Fraunces', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...primaryBlue);
    const eventTitle = `"${cert.event_title || 'Campus Connect Technical Lecture'}"`;
    doc.text(eventTitle, centerX, 91, { align: 'center' });

    // Speaker & Session Details
    let sessionDetails = '';
    if (cert.speaker_name) {
      sessionDetails += `Keynote Delivered by: ${cert.speaker_name}`;
      if (cert.speaker_designation) sessionDetails += `, ${cert.speaker_designation}`;
      if (cert.speaker_company) sessionDetails += ` (${cert.speaker_company})`;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mutedNeutral);
    if (sessionDetails) {
      doc.text(sessionDetails, centerX, 98, { align: 'center' });
    }

    const eventDate = cert.event_date
      ? new Date(cert.event_date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.text(`Conducted on: ${eventDate} • Francis Xavier Engineering College Autonomous Campus`, centerX, 104, {
      align: 'center',
    });

    // Bottom Divider Hairline (Gold)
    const bottomDividerY = 118;
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.3);
    doc.line(18, bottomDividerY, pageWidth - 18, bottomDividerY);

    // 5. QR Code linking to /verify/:code
    const qrSize = 30;
    const qrX = 22;
    const qrY = bottomDividerY + 5;

    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      } catch (err) {
        console.warn('Could not embed QR image in PDF:', err);
      }
    } else {
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.35);
      doc.rect(qrX, qrY, qrSize, qrSize);
      doc.setFontSize(7);
      doc.setTextColor(...mutedNeutral);
      doc.text('Scan to Verify', qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' });
    }

    // 6. Certificate ID in JetBrains Mono per S-T
    const verTextX = qrX + qrSize + 6;
    doc.setFont('Fraunces', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...navyDeep);
    doc.text('OFFICIAL INSTITUTIONAL E-CREDENTIAL', verTextX, qrY + 6);

    doc.setFont('JetBrainsMono', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...navyText);
    const certCode = cert.certificate_code || 'FXEC-2026-CERT';
    doc.text(`ID: ${certCode}`, verTextX, qrY + 12);

    const issueDate = cert.issued_at
      ? new Date(cert.issued_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedNeutral);
    doc.text(`Issued On: ${issueDate}`, verTextX, qrY + 17);

    doc.text('Online Verification:', verTextX, qrY + 22);
    const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://campus-connect-fxec.vercel.app'}/verify/${certCode}`;
    doc.setTextColor(...primaryBlue);
    doc.text(verifyUrl.length > 42 ? verifyUrl.slice(0, 42) + '...' : verifyUrl, verTextX, qrY + 26);

    // 7. Signature Lines & Gold Seal per S-T 4
    // Coordinator
    const sig1X = 165;
    const sigLineY = qrY + 20;
    doc.setDrawColor(...navyDeep);
    doc.setLineWidth(0.35);
    doc.line(sig1X - 20, sigLineY, sig1X + 20, sigLineY);

    doc.setFont('Fraunces', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...navyDeep);
    doc.text('Event Coordinator', sig1X, sigLineY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...mutedNeutral);
    doc.text('FXEC Guest Lecture Series', sig1X, sigLineY + 9, { align: 'center' });

    // Official Gold Seal in Center-Right per S-T 4
    const sealX = 216;
    const sealY = qrY + 15;
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.6);
    doc.circle(sealX, sealY, 11, 'S');
    doc.setLineWidth(0.25);
    doc.circle(sealX, sealY, 9.5, 'S');
    doc.setFont('Fraunces', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...gold);
    doc.text('FXEC', sealX, sealY - 2, { align: 'center' });
    doc.setFont('JetBrainsMono', 'normal');
    doc.setFontSize(4);
    doc.text('AUTONOMOUS', sealX, sealY + 2, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3.8);
    doc.text('★ SEAL ★', sealX, sealY + 5.5, { align: 'center' });

    // Principal / Director
    const sig2X = 265;
    doc.setDrawColor(...navyDeep);
    doc.setLineWidth(0.35);
    doc.line(sig2X - 20, sigLineY, sig2X + 20, sigLineY);

    doc.setFont('Fraunces', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...navyDeep);
    doc.text('Principal / Director', sig2X, sigLineY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...mutedNeutral);
    doc.text('Francis Xavier Engg College', sig2X, sigLineY + 9, { align: 'center' });

    // Digital Security Footnote
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(...mutedNeutral);
    doc.text(
      'Secured and cryptographically registered by FXEC Campus Connect. Verify instantly at /verify/:code.',
      centerX,
      pageHeight - 13,
      { align: 'center' }
    );

    // Trigger Download
    const fileName = `FXEC_Certificate_${cert.certificate_code || 'Participation'}.pdf`;
    doc.save(fileName);
  },
};
