/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Student Achievement Passport:
 * Extracurricular digital transcript powered by MagicBento.
 * Semantic tokens only, dark/light theme, verified certificates with QR and instant PDF download.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { attendanceService } from '../../services/attendanceService';
import { certificateService } from '../../services/certificateService';
import { pointsService } from '../../services/pointsService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import MagicBento from '../../components/MagicBento/MagicBento';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Sparkles,
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  Download,
  Calendar,
  Building2,
  GraduationCap,
  ShieldCheck,
  Trophy,
  Users,
  Briefcase,
  FileText,
  Star,
  ExternalLink
} from 'lucide-react';

export default function StudentPassportPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const { resolvedTheme } = useTheme();

  const [attendances, setAttendances] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [pointsSummary, setPointsSummary] = useState({ totalPoints: 0, history: [] });
  const [userRank, setUserRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPassportData() {
      setIsLoading(true);
      try {
        const [attData, certData, ptsData, leaderboard] = await Promise.all([
          attendanceService.getStudentAttendanceHistory(),
          certificateService.getMyCertificates(),
          pointsService.getStudentPointsSummary(user?.id),
          pointsService.getLeaderboard(null, 100),
        ]);

        setAttendances(attData || []);
        setCertificates(certData || []);
        setPointsSummary(ptsData || { totalPoints: 0, history: [] });

        // Find user rank in leaderboard
        const myEntry = (leaderboard || []).find((entry) => entry.student_id === user?.id);
        if (myEntry) {
          setUserRank(myEntry.leaderboard_rank);
        }
      } catch (err) {
        console.error('Failed to load achievement passport:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (user?.id) {
      loadPassportData();
    }
  }, [user]);

  const handleDownloadCert = (cert) => {
    try {
      const canvasEl = document.getElementById(`passport-qr-${cert.certificate_code}`);
      const qrDataUrl = canvasEl ? canvasEl.toDataURL('image/png') : null;

      const certPayload = {
        certificate_code: cert.certificate_code,
        student_name: profile?.name || user?.email?.split('@')[0],
        department_name: profile?.departments?.name || profile?.department || 'Engineering',
        event_title: cert.event?.title || 'Technical Lecture',
        event_date: cert.event?.start_time,
        speaker_name: cert.event?.speaker?.name,
        speaker_designation: cert.event?.speaker?.designation,
        speaker_company: cert.event?.speaker?.company,
        issued_at: cert.issued_at,
      };

      certificateService.generateCertificatePDF(certPayload, qrDataUrl);
      showToast('Certificate downloaded!', 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to download certificate.', 'error');
    }
  };

  // Certified learning hours: 2 hrs standard per session
  const totalLearningHours = attendances.length * 2;

  // Extract distinct speakers interacted with
  const speakersMap = new Map();
  attendances.forEach((a) => {
    const sp = a.event?.speaker;
    if (sp && sp.name && !speakersMap.has(sp.id || sp.name)) {
      speakersMap.set(sp.id || sp.name, {
        ...sp,
        eventTitle: a.event.title,
        date: a.event.start_time,
      });
    }
  });
  const uniqueSpeakers = Array.from(speakersMap.values());

  // Build unified chronological activity timeline
  const timeline = [];

  attendances.forEach((a) => {
    timeline.push({
      id: `att-${a.id}`,
      type: 'attendance',
      title: `Attended: ${a.event?.title || 'Guest Lecture'}`,
      timestamp: a.verified_at || a.created_at,
      badge: 'Attendance Verified',
      badgeVariant: 'success',
    });
  });

  certificates.forEach((c) => {
    timeline.push({
      id: `cert-${c.id}`,
      type: 'certificate',
      title: `Earned Official Certificate: ${c.event?.title || 'Session'}`,
      timestamp: c.issued_at,
      badge: c.certificate_code,
      badgeVariant: 'primary',
      certObj: c,
    });
  });

  (pointsSummary.history || []).forEach((p) => {
    if (['asked_question', 'answered_question', 'discussion', 'other'].includes(p.category)) {
      timeline.push({
        id: `pts-${p.id}`,
        type: 'points',
        title: `Interactive Bonus (+${p.points} pts): ${p.reason}`,
        timestamp: p.created_at,
        badge: `+${p.points} pts`,
        badgeVariant: 'warning',
      });
    }
  });

  timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const dynamicGlow = resolvedTheme === 'dark' ? 'rgb(var(--primary))' : 'rgb(var(--primary))';

  // MagicBento transcript overview metrics
  const bentoItems = useMemo(() => [
    {
      id: 'passport-hours',
      title: 'Certified Learning Hours',
      label: 'Accreditation',
      colSpan: 2,
      rowSpan: 1,
      visual: (
        <div className="w-full h-full flex items-center justify-between px-3 select-none">
          <div className="space-y-1">
            <span className="text-3xl font-extrabold text-primary tabular-nums">
              {totalLearningHours} hrs
            </span>
            <p className="text-xs text-muted font-medium">
              Verified co-curricular industrial learning across {attendances.length} guest sessions
            </p>
          </div>
          <Badge variant="success" size="sm" className="gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified
          </Badge>
        </div>
      ),
    },
    {
      id: 'passport-lectures',
      title: 'Lectures Attended',
      label: 'Engagement',
      colSpan: 1,
      rowSpan: 1,
      visual: (
        <div className="w-full h-full flex flex-col justify-center px-2 select-none">
          <span className="text-3xl font-extrabold text-ink tabular-nums">
            {attendances.length}
          </span>
          <p className="text-xs text-muted font-medium mt-1">Sessions completed</p>
        </div>
      ),
    },
    {
      id: 'passport-rank',
      title: 'Campus Rank',
      label: 'Recognition',
      colSpan: 1,
      rowSpan: 1,
      visual: (
        <div className="w-full h-full flex flex-col justify-center px-2 select-none">
          <span className="text-3xl font-extrabold text-ink tabular-nums">
            {userRank ? `#${userRank}` : '—'}
          </span>
          <p className="text-xs text-muted font-medium mt-1">
            {pointsSummary.totalPoints} total points
          </p>
        </div>
      ),
    },
    {
      id: 'passport-identity',
      title: 'Student Identity',
      label: 'Institutional Record',
      colSpan: 2,
      rowSpan: 1,
      visual: (
        <div className="w-full h-full flex items-center justify-between px-3 select-none">
          <div className="space-y-1">
            <span className="text-base font-bold text-ink">
              {profile?.name || 'Student Name'}
            </span>
            <p className="text-xs text-muted">
              Reg No: <strong className="text-ink font-mono">{profile?.register_number || 'N/A'}</strong> • {profile?.departments?.code || 'Engineering'}
            </p>
          </div>
          <span className="text-xs font-semibold text-muted bg-surface-2 px-2.5 py-1 rounded-[8px] border border-line">
            FXEC Autonomous
          </span>
        </div>
      ),
    },
    {
      id: 'passport-certs',
      title: 'Verified Credentials',
      label: 'Credentials',
      colSpan: 2,
      rowSpan: 1,
      visual: (
        <div className="w-full h-full flex items-center justify-between px-3 select-none">
          <div className="space-y-1">
            <span className="text-3xl font-extrabold text-ink tabular-nums">
              {certificates.length}
            </span>
            <p className="text-xs text-muted font-medium">
              Tamper-evident certificates with cryptographic QR validation
            </p>
          </div>
          <Link to="/student/certificates">
            <Button size="xs" variant="outline">
              Certificates
            </Button>
          </Link>
        </div>
      ),
    },
  ], [totalLearningHours, attendances.length, userRank, pointsSummary.totalPoints, profile, certificates.length]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted font-medium">Assembling your official achievement passport...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Achievement Passport"
      subtitle="Co-curricular digital transcript of verified industrial sessions, certified hours & speaker interactions"
    >
      <div className="space-y-8">
        {/* Hidden QR Code Canvas container */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          {certificates.map((cert) => (
            <QRCodeCanvas
              key={cert.certificate_code}
              id={`passport-qr-${cert.certificate_code}`}
              value={`${window.location.origin}/verify/${cert.certificate_code}`}
              size={200}
              level="M"
            />
          ))}
        </div>

        {/* MagicBento Achievement Passport Metrics */}
        <MagicBento
          items={bentoItems}
          columns={4}
          rowHeight={150}
          gap={14}
          radius={20}
          theme={resolvedTheme || 'light'}
          glowColor={dynamicGlow}
          enableBorderGlow={true}
          enableSpotlight={true}
          spotlightRadius={300}
          clickEffect={true}
          intro={true}
          enableStars={false}
          enableTilt={false}
          enableMagnetism={false}
        />

        {/* Certificates Grid with Instant Download */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-line">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Verified Certificates ({certificates.length})
            </h3>
            <Link to="/student/certificates" className="text-xs font-semibold text-primary hover:underline">
              View All Certificates →
            </Link>
          </div>

          {certificates.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted border-line shadow-xs">
              No certificates issued yet. Attend guest lectures and complete reviews to receive official credentials.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <Card key={cert.id} className="p-4 border-line shadow-xs flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary bg-primary-soft px-2 py-0.5 rounded">
                        {cert.certificate_code}
                      </span>
                      <span className="text-xs text-muted">
                        {new Date(cert.issued_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-ink line-clamp-1">
                      {cert.event?.title || 'Session'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-line">
                    <Link
                      to={`/verify/${cert.certificate_code}`}
                      target="_blank"
                      className="text-xs text-muted hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      Verify <ExternalLink className="w-3 h-3" />
                    </Link>
                    <Button
                      size="xs"
                      variant="primary"
                      icon={Download}
                      onClick={() => handleDownloadCert(cert)}
                    >
                      Download PDF
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Keynote Speakers Interacted With */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2 pb-1 border-b border-line">
            <Users className="w-5 h-5 text-primary" />
            Keynote Speakers Interacted With ({uniqueSpeakers.length})
          </h3>

          {uniqueSpeakers.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted border-line shadow-xs">
              Attend guest lectures to connect with leading industry keynote speakers and faculty experts.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {uniqueSpeakers.map((sp, idx) => (
                <Card key={idx} className="p-4 border-line shadow-xs space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-2 border border-line flex items-center justify-center font-bold text-primary text-sm shrink-0">
                      {sp.name[0]}
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <h4 className="text-xs font-bold text-ink truncate">{sp.name}</h4>
                      <p className="text-xs text-muted truncate">
                        {sp.designation || 'Speaker'}
                      </p>
                    </div>
                  </div>
                  {sp.company && (
                    <p className="text-xs text-muted flex items-center gap-1 truncate">
                      <Briefcase className="w-3.5 h-3.5 text-muted shrink-0" />
                      {sp.company}
                    </p>
                  )}
                  <p className="text-xs text-muted border-t border-line pt-1 line-clamp-1">
                    Lecture: {sp.eventTitle}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-ink flex items-center gap-2 pb-1 border-b border-line">
            <Clock className="w-5 h-5 text-primary" />
            Verified Activity Timeline
          </h3>

          {timeline.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted border-line shadow-xs">
              No activity logs recorded yet.
            </Card>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
              {timeline.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-surface shrink-0" />
                  <div className="bg-surface p-4 rounded-[16px] border border-line shadow-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-ink">{item.title}</p>
                      <Badge variant={item.badgeVariant} size="sm" className="text-xs">
                        {item.badge}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted block">
                      {new Date(item.timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
