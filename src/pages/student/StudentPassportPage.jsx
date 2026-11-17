import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { attendanceService } from '../../services/attendanceService';
import { certificateService } from '../../services/certificateService';
import { pointsService } from '../../services/pointsService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
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
        setPointsSummary(ptsData);

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

  pointsSummary.history.forEach((p) => {
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500 font-medium">Assembling your official achievement passport...</p>
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

        {/* Passport Profile Header Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-burgundy/10 text-burgundy border-2 border-burgundy/30 flex items-center justify-center font-bold text-2xl uppercase shrink-0">
              {profile?.name ? profile.name[0] : 'S'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-neutral-900">{profile?.name || 'Student'}</h2>
                <Badge variant="success" size="sm" className="gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Identity
                </Badge>
              </div>
              <p className="text-xs text-neutral-500">
                Register No:{' '}
                <span className="font-mono font-semibold text-neutral-800">
                  {profile?.register_number || 'N/A'}
                </span>{' '}
                • Department of {profile?.departments?.name || profile?.department || 'Engineering'}
              </p>
              <p className="text-[11px] text-neutral-400">
                Francis Xavier Engineering College • Autonomous Institution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-neutral-100 pt-4 sm:pt-0 sm:pl-6 text-center">
            <div>
              <p className="text-2xl font-extrabold text-burgundy">{totalLearningHours} hrs</p>
              <p className="text-[11px] text-neutral-500 font-medium">Certified Hours</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-emerald-600">{attendances.length}</p>
              <p className="text-[11px] text-neutral-500 font-medium">Lectures Attended</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-amber-500">{pointsSummary.totalPoints}</p>
              <p className="text-[11px] text-neutral-500 font-medium">Total Points</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-neutral-900">
                {userRank ? `#${userRank}` : '—'}
              </p>
              <p className="text-[11px] text-neutral-500 font-medium">Campus Rank</p>
            </div>
          </div>
        </div>

        {/* Certificates Grid with Instant Download */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-burgundy" />
              Verified Certificates ({certificates.length})
            </h3>
            <Link to="/student/certificates" className="text-xs font-semibold text-burgundy hover:underline">
              View All Certificates →
            </Link>
          </div>

          {certificates.length === 0 ? (
            <Card className="p-6 text-center text-xs text-neutral-500">
              No certificates issued yet. Attend guest lectures and complete reviews to receive official credentials.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <Card key={cert.id} className="p-4 bg-white flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-burgundy bg-burgundy/10 px-2 py-0.5 rounded">
                        {cert.certificate_code}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {new Date(cert.issued_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-neutral-900 line-clamp-1">
                      {cert.event?.title || 'Session'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <Link
                      to={`/verify/${cert.certificate_code}`}
                      target="_blank"
                      className="text-[11px] text-neutral-500 hover:text-burgundy flex items-center gap-1"
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
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-burgundy" />
            Keynote Speakers Interacted With ({uniqueSpeakers.length})
          </h3>

          {uniqueSpeakers.length === 0 ? (
            <Card className="p-6 text-center text-xs text-neutral-500">
              Attend guest lectures to connect with leading industry keynote speakers and faculty experts.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {uniqueSpeakers.map((sp, idx) => (
                <Card key={idx} className="p-4 bg-white space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-burgundy text-sm shrink-0">
                      {sp.name[0]}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-neutral-900 truncate">{sp.name}</h4>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {sp.designation || 'Speaker'}
                      </p>
                    </div>
                  </div>
                  {sp.company && (
                    <p className="text-[11px] text-neutral-600 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                      {sp.company}
                    </p>
                  )}
                  <p className="text-[10px] text-neutral-400 border-t border-neutral-100 pt-1 line-clamp-1">
                    Lecture: {sp.eventTitle}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-burgundy" />
            Verified Activity Timeline
          </h3>

          {timeline.length === 0 ? (
            <Card className="p-6 text-center text-xs text-neutral-500">
              No activity logs recorded yet.
            </Card>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
              {timeline.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-burgundy ring-4 ring-white shrink-0" />
                  <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-neutral-900">{item.title}</p>
                      <Badge variant={item.badgeVariant} size="sm" className="text-[10px]">
                        {item.badge}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-neutral-400 block">
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
