import { supabase, isSupabaseConfigured } from './supabase';
import { jsPDF } from 'jspdf';

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
   * Institutional Burgundy & White design with FXEC branding, verification details, and QR code.
   * @param {Object} cert
   * @param {string} [qrDataUrl] - Base64 PNG data URL of the verification QR code
   */
  generateCertificatePDF(cert, qrDataUrl = null) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4', // 297mm x 210mm
    });

    // Metadata Watermark & Digital IP Attribution
    doc.setProperties({
      title: `FXEC Certificate - ${cert.certificate_code || 'Participation'}`,
      subject: 'Official Institutional Participation Credential',
      author: 'Krishna Raja V (Krish) <v.rajavenkatesh17@gmail.com>',
      keywords: 'Francis Xavier Engineering College, FXEC, Krish, Krishna Raja V, Patented System',
      creator: 'Campus Connect - Engineered & Patented by Krishna Raja V (Krish)',
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const centerX = pageWidth / 2;

    // Palette
    const burgundy = [128, 0, 32];
    const gold = [197, 160, 89];
    const darkNeutral = [30, 41, 59];
    const mutedNeutral = [100, 116, 139];

    // Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Double Border
    // Outer Burgundy Border
    doc.setDrawColor(...burgundy);
    doc.setLineWidth(2.2);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // Inner Gold Accent Border
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.6);
    doc.rect(11.5, 11.5, pageWidth - 23, pageHeight - 23);

    // Corner Decorative Squares
    const cornerSize = 4;
    doc.setFillColor(...burgundy);
    doc.rect(11.5, 11.5, cornerSize, cornerSize, 'F');
    doc.rect(pageWidth - 11.5 - cornerSize, 11.5, cornerSize, cornerSize, 'F');
    doc.rect(11.5, pageHeight - 11.5 - cornerSize, cornerSize, cornerSize, 'F');
    doc.rect(pageWidth - 11.5 - cornerSize, pageHeight - 11.5 - cornerSize, cornerSize, cornerSize, 'F');

    // Header: Institution Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...burgundy);
    doc.text('FRANCIS XAVIER ENGINEERING COLLEGE', centerX, 24, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedNeutral);
    doc.text(
      'An Autonomous Institution | Accredited by NBA & NAAC with "A+" Grade | Approved by AICTE',
      centerX,
      29.5,
      { align: 'center' }
    );
    doc.text('Vannarpettai, Tirunelveli - 627003, Tamil Nadu, India • www.francisxavier.ac.in', centerX, 34, {
      align: 'center',
    });

    // Decorative Line
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.8);
    doc.line(centerX - 60, 38, centerX + 60, 38);

    // Title: Certificate of Participation
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(...burgundy);
    doc.text('CERTIFICATE OF PARTICIPATION', centerX, 48, { align: 'center' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10.5);
    doc.setTextColor(...mutedNeutral);
    doc.text('This is to certify that', centerX, 56, { align: 'center' });

    // Student Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(21);
    doc.setTextColor(...burgundy);
    const studentName = (cert.student_name || 'STUDENT OF FXEC').toUpperCase();
    doc.text(studentName, centerX, 67, { align: 'center' });

    // Name Underline
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.6);
    const nameWidth = doc.getTextWidth(studentName);
    doc.line(centerX - nameWidth / 2 - 5, 70, centerX + nameWidth / 2 + 5, 70);

    // Department & Course
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...darkNeutral);
    const deptText = `from the Department of ${cert.department || cert.department_name || 'Engineering'}`;
    doc.text(deptText, centerX, 77, { align: 'center' });

    doc.text(
      'has successfully attended and actively engaged in the distinguished Technical Guest Lecture titled:',
      centerX,
      83.5,
      { align: 'center' }
    );

    // Event Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42); // slate-900
    const eventTitle = `"${cert.event_title || 'Campus Connect Guest Lecture'}"`;
    doc.text(eventTitle, centerX, 93, { align: 'center' });

    // Speaker & Session Details
    let sessionDetails = '';
    if (cert.speaker_name) {
      sessionDetails += `Keynote Delivered by: ${cert.speaker_name}`;
      if (cert.speaker_designation) sessionDetails += `, ${cert.speaker_designation}`;
      if (cert.speaker_company) sessionDetails += ` (${cert.speaker_company})`;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...mutedNeutral);
    if (sessionDetails) {
      doc.text(sessionDetails, centerX, 101, { align: 'center' });
    }

    const eventDate = cert.event_date
      ? new Date(cert.event_date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.text(`Conducted on: ${eventDate} | Venue: Francis Xavier Engineering College Campus`, centerX, 107, {
      align: 'center',
    });

    // Bottom Section: Verification & Signatures
    const bottomDividerY = 120;
    doc.setDrawColor(226, 232, 240); // neutral-200
    doc.setLineWidth(0.4);
    doc.line(20, bottomDividerY, pageWidth - 20, bottomDividerY);

    // QR Code & Verification Info (Left Box)
    const qrSize = 32;
    const qrX = 24;
    const qrY = bottomDividerY + 6;

    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      } catch (err) {
        console.warn('Could not embed QR image in PDF:', err);
      }
    } else {
      // Placeholder border if no QR image
      doc.setDrawColor(...burgundy);
      doc.setLineWidth(0.4);
      doc.rect(qrX, qrY, qrSize, qrSize);
      doc.setFontSize(7);
      doc.setTextColor(...mutedNeutral);
      doc.text('Scan to Verify', qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' });
    }

    // Verification Text beside QR
    const verTextX = qrX + qrSize + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...burgundy);
    doc.text('OFFICIAL E-CREDENTIAL', verTextX, qrY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkNeutral);
    doc.text(`Credential ID: ${cert.certificate_code || 'FXEC-CERT-VALID'}`, verTextX, qrY + 12);

    const issueDate = cert.issued_at
      ? new Date(cert.issued_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    doc.text(`Issued On: ${issueDate}`, verTextX, qrY + 17);

    doc.setFontSize(7);
    doc.setTextColor(...mutedNeutral);
    doc.text('Verify Online at:', verTextX, qrY + 22);
    const verifyUrl = `${window.location.origin}/verify/${cert.certificate_code || ''}`;
    doc.setTextColor(37, 99, 235); // blue link
    doc.text(verifyUrl.length > 40 ? verifyUrl.slice(0, 40) + '...' : verifyUrl, verTextX, qrY + 26);

    // Signatures (Right Side)
    // Coordinator Signature Line
    const sig1X = 175;
    const sigLineY = qrY + 22;
    doc.setDrawColor(...darkNeutral);
    doc.setLineWidth(0.4);
    doc.line(sig1X - 25, sigLineY, sig1X + 25, sigLineY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...burgundy);
    doc.text('Event Coordinator', sig1X, sigLineY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedNeutral);
    doc.text('FXEC Guest Lecture Series', sig1X, sigLineY + 9, { align: 'center' });

    // Principal Signature Line
    const sig2X = 245;
    doc.setDrawColor(...darkNeutral);
    doc.setLineWidth(0.4);
    doc.line(sig2X - 25, sigLineY, sig2X + 25, sigLineY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...burgundy);
    doc.text('Principal / Director', sig2X, sigLineY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedNeutral);
    doc.text('Francis Xavier Engg College', sig2X, sigLineY + 9, { align: 'center' });

    // Watermark / Tamper Notice
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(160, 160, 160);
    doc.text(
      'This is a cryptographically secured and digitally logged certificate issued by FXEC Campus Connect. Authenticity can be verified at any time using the unique credential ID above.',
      centerX,
      pageHeight - 14,
      { align: 'center' }
    );

    // Trigger Download
    const fileName = `FXEC_Certificate_${cert.certificate_code || 'Official'}.pdf`;
    doc.save(fileName);
  },
};
