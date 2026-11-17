import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { certificateService } from '../../services/certificateService';
import { attendanceService } from '../../services/attendanceService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { QRCodeCanvas } from 'qrcode.react';
import {
  FileText,
  Award,
  CheckCircle2,
  Download,
  ShieldCheck,
  Calendar,
  Building2,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Copy,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function StudentCertificatesPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [issuedCertificates, setIssuedCertificates] = useState([]);
  const [attendedSessions, setAttendedSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingEventId, setClaimingEventId] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [certs, attendance] = await Promise.all([
        certificateService.getMyCertificates(),
        attendanceService.getStudentAttendanceHistory(),
      ]);

      setIssuedCertificates(certs || []);

      // Filter attended sessions that have concluded and may be eligible for certificates
      const completedSessions = (attendance || []).filter((item) => {
        const ev = item.event;
        if (!ev) return false;
        const isEnded = ev.end_time ? new Date(ev.end_time) <= new Date() || ev.status === 'completed' : false;
        return isEnded;
      });
      setAttendedSessions(completedSessions);
    } catch (err) {
      console.error('Failed to load certificates:', err);
      showToast('Failed to load certificates.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClaimCertificate = async (eventId) => {
    setClaimingEventId(eventId);
    try {
      const res = await certificateService.issueCertificate(eventId);
      if (res.success) {
        showToast(res.message || 'Certificate issued successfully!', 'success');
        await loadData();
      } else {
        showToast(res.message || 'Could not issue certificate.', 'warning');
      }
    } catch (err) {
      console.error('Claim error:', err);
      showToast(err.message || 'Failed to claim certificate.', 'error');
    } finally {
      setClaimingEventId(null);
    }
  };

  const handleDownloadPDF = (cert) => {
    try {
      const canvasEl = document.getElementById(`qr-canvas-${cert.certificate_code}`);
      const qrDataUrl = canvasEl ? canvasEl.toDataURL('image/png') : null;

      const certPayload = {
        certificate_code: cert.certificate_code,
        student_name: profile?.name || user?.email?.split('@')[0],
        department_name: profile?.departments?.name || profile?.department || 'Engineering',
        event_title: cert.event?.title || 'Technical Session',
        event_date: cert.event?.start_time,
        speaker_name: cert.event?.speaker?.name,
        speaker_designation: cert.event?.speaker?.designation,
        speaker_company: cert.event?.speaker?.company,
        issued_at: cert.issued_at,
      };

      certificateService.generateCertificatePDF(certPayload, qrDataUrl);
      showToast('Certificate PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('Failed to generate PDF.', 'error');
    }
  };

  const handleCopyLink = (code) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    showToast('Verification URL copied to clipboard!', 'info');
  };

  // Set of event IDs that already have an issued certificate
  const issuedEventIds = new Set(issuedCertificates.map((c) => c.event?.id || c.event_id));

  // Sessions eligible to claim
  const unissuedSessions = attendedSessions.filter((att) => att.event && !issuedEventIds.has(att.event.id));

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500 font-medium">Loading your verified participation certificates...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Participation Certificates"
      subtitle="Institutional e-credentials generated for concluded, verified sessions • Francis Xavier Engineering College"
    >
      <div className="space-y-8">
        {/* Hidden QR Code Canvas container for crisp PDF generation */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          {issuedCertificates.map((cert) => (
            <QRCodeCanvas
              key={cert.certificate_code}
              id={`qr-canvas-${cert.certificate_code}`}
              value={`${window.location.origin}/verify/${cert.certificate_code}`}
              size={200}
              level="M"
            />
          ))}
        </div>

        {/* Unclaimed / Available to Claim Section */}
        {unissuedSessions.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  New Certificates Ready to Claim ({unissuedSessions.length})
                </h3>
                <p className="text-xs text-neutral-600">
                  You have attended these concluded sessions. Claim your official autonomous credential.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {unissuedSessions.map((item) => {
                const ev = item.event;
                const isClaiming = claimingEventId === ev.id;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg p-4 border border-amber-200 flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <p className="text-xs font-bold text-neutral-900 line-clamp-1">{ev.title}</p>
                      <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {new Date(ev.start_time).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Attendance Verified
                      </span>
                      <Button
                        size="xs"
                        variant="primary"
                        isLoading={isClaiming}
                        onClick={() => handleClaimCertificate(ev.id)}
                        icon={Award}
                      >
                        Claim Certificate
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Issued Certificates List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-neutral-900">
              Official Certificates ({issuedCertificates.length})
            </h2>
          </div>

          {issuedCertificates.length === 0 ? (
            <EmptyState
              title="No Certificates Issued Yet"
              description="Certificates are issued once you attend a guest lecture, submit your session feedback, and the event concludes."
              action={
                <Link to="/events">
                  <Button variant="primary" size="sm">
                    Explore Guest Lectures
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {issuedCertificates.map((cert) => {
                const ev = cert.event || {};
                const speaker = ev.speaker || {};

                return (
                  <Card
                    key={cert.id}
                    className="p-5 flex flex-col justify-between hover:border-burgundy/40 transition-colors bg-white shadow-xs"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-burgundy bg-burgundy/10 px-2 py-0.5 rounded">
                          {cert.certificate_code}
                        </span>
                        <Badge variant="success" size="sm" className="gap-1 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </Badge>
                      </div>

                      <div>
                        <h3 className="font-bold text-neutral-900 text-sm leading-snug line-clamp-2">
                          {ev.title || 'Technical Lecture'}
                        </h3>
                        {speaker.name && (
                          <p className="text-xs text-neutral-500 mt-1">
                            Keynote: <span className="font-semibold text-neutral-700">{speaker.name}</span>
                            {speaker.company ? ` (${speaker.company})` : ''}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>
                            {ev.start_time
                              ? new Date(ev.start_time).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Concluded'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          <span>
                            Issued{' '}
                            {new Date(cert.issued_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 mt-2 border-t border-neutral-100">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Download}
                        onClick={() => handleDownloadPDF(cert)}
                        className="flex-1"
                      >
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Copy}
                        onClick={() => handleCopyLink(cert.certificate_code)}
                        title="Copy Verification Link"
                      >
                        Copy Link
                      </Button>
                      <Link to={`/verify/${cert.certificate_code}`} target="_blank">
                        <Button variant="ghost" size="sm" icon={ExternalLink} title="Open Verification Registry" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
