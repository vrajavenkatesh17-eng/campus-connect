import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { pointsService } from '../../services/pointsService';
import { eventService } from '../../services/eventService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Table from '../../components/common/Table';
import AppSelect from '../../components/app/AppSelect';
import AppSegmented from '../../components/app/AppSegmented';
import {
  Award,
  Sparkles,
  Trophy,
  Flame,
  Calendar,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Building2,
  Medal,
  Users,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

export default function StudentPointsPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'leaderboard'
  const [summary, setSummary] = useState({
    totalPoints: 0,
    categoryBreakdown: { attendance: 0, feedback: 0, interaction: 0, adjustments: 0 },
    history: [],
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [sumData, deptsData] = await Promise.all([
          pointsService.getStudentPointsSummary(user?.id),
          eventService.getDepartments().catch(() => []),
        ]);
        setSummary(sumData);
        setDepartments(deptsData || []);
      } catch (err) {
        console.error('Failed to load points data:', err);
        showToast('Error loading points ledger.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    if (user?.id) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLeaderboardLoading(true);
      try {
        const data = await pointsService.getLeaderboard(selectedDeptId || null);
        setLeaderboard(data || []);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setIsLeaderboardLoading(false);
      }
    }
    fetchLeaderboard();
  }, [selectedDeptId]);

  const totalPoints = summary.totalPoints;
  const tier =
    totalPoints >= 300
      ? 'Platinum Scholar'
      : totalPoints >= 150
      ? 'Gold Achiever'
      : totalPoints >= 50
      ? 'Silver Explorer'
      : 'Bronze Participant';

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'attendance':
        return <Badge variant="success">Attendance</Badge>;
      case 'feedback':
        return <Badge variant="primary">Feedback Review</Badge>;
      case 'asked_question':
        return <Badge variant="warning">Asked Question</Badge>;
      case 'answered_question':
        return <Badge variant="info">Answered Question</Badge>;
      case 'discussion':
        return <Badge variant="info">Discussion</Badge>;
      case 'admin_adjustment':
        return <Badge variant="neutral">Admin Adjustment</Badge>;
      default:
        return <Badge variant="neutral">{category || 'Bonus'}</Badge>;
    }
  };

  const ledgerColumns = [
    {
      header: 'Date & Time',
      key: 'created_at',
      render: (row) => (
        <span className="text-xs text-muted">
          {new Date(row.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'Category',
      key: 'category',
      render: (row) => getCategoryBadge(row.category),
    },
    {
      header: 'Associated Event / Reason',
      key: 'reason',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-ink">{row.reason}</p>
          {row.event?.title && (
            <p className="text-xs text-muted line-clamp-1">{row.event.title}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Points',
      key: 'points',
      render: (row) => (
        <span
          className={`font-mono font-bold text-xs ${
            row.points > 0 ? 'text-emerald-700' : 'text-red-700'
          }`}
        >
          {row.points > 0 ? `+${row.points}` : row.points} pts
        </span>
      ),
    },
  ];

  const leaderboardColumns = [
    {
      header: 'Rank',
      key: 'rank',
      render: (row) => {
        const rank = parseInt(row.leaderboard_rank, 10);
        if (rank === 1) {
          return (
            <span className="inline-flex items-center gap-1.5 font-bold text-gold text-xs px-2.5 py-0.5 rounded-full border border-gold/50 bg-gold/10 shadow-xs">
              <Trophy className="w-3.5 h-3.5 text-gold" /> #1 Rank
            </span>
          );
        }
        if (rank === 2) {
          return (
            <span className="inline-flex items-center gap-1 font-bold text-slate-400 text-sm">
              <Medal className="w-4 h-4 text-slate-400" /> #2
            </span>
          );
        }
        if (rank === 3) {
          return (
            <span className="inline-flex items-center gap-1 font-bold text-amber-700 text-sm">
              <Medal className="w-4 h-4 text-amber-700" /> #3
            </span>
          );
        }
        return <span className="font-mono text-xs font-medium text-muted">#{rank}</span>;
      },
    },
    {
      header: 'Student Name',
      key: 'name',
      render: (row) => {
        const isMe = row.student_id === user?.id;
        return (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isMe ? 'text-primary' : 'text-ink'}`}>
              {row.student_name}
            </span>
            {isMe && (
              <Badge variant="primary" size="sm" className="text-xs">
                You
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: 'Department',
      key: 'dept',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-muted">
          {row.department_code || 'FXEC'}
        </span>
      ),
    },
    {
      header: 'Total Points',
      key: 'points',
      render: (row) => (
        <span className="font-mono font-black text-xs text-primary">
          {row.total_points} pts
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted">Loading your points ledger & milestones...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Reward Points & Leaderboard"
      subtitle="Earn verified points through session attendance, reviews, and faculty-awarded interactive contributions"
    >
      <div className="space-y-6">
        {/* Top Summary Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-navy-deep via-primary to-surface-2 text-white p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-amber-300">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Tier: {tier}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {totalPoints} <span className="text-xl font-normal text-white/80">Campus Points</span>
              </h1>
              <p className="text-xs sm:text-sm text-white/70 max-w-md">
                Earned via append-only ledger entries: verified attendance (+50), feedback submissions (+25), and coordinator-awarded interaction points.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-xs rounded-xl p-4 text-center shrink-0">
              <div className="p-2">
                <p className="text-xl font-bold text-emerald-400">+{summary.categoryBreakdown.attendance}</p>
                <p className="text-xs text-white/70">Attendance</p>
              </div>
              <div className="p-2 border-l border-white/15">
                <p className="text-xl font-bold text-amber-400">+{summary.categoryBreakdown.feedback}</p>
                <p className="text-xs text-white/70">Reviews</p>
              </div>
              <div className="p-2 border-l border-white/15">
                <p className="text-xl font-bold text-sky-400">+{summary.categoryBreakdown.interaction}</p>
                <p className="text-xs text-white/70">Bonus Q&A</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation with AppSegmented */}
        <div className="flex items-center">
          <AppSegmented
            options={[
              { value: 'ledger', label: `Points Ledger (${summary.history.length})` },
              { value: 'leaderboard', label: 'Campus Leaderboard' },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Tab 1: Ledger */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            {summary.history.length === 0 ? (
              <EmptyState
                title="No Points Earned Yet"
                description="Scan attendance QR codes at guest lectures and submit session feedback to earn your first points."
                action={
                  <Link to="/events">
                    <Button variant="primary" size="sm">
                      Explore Upcoming Events
                    </Button>
                  </Link>
                }
              />
            ) : (
              <Card>
                <Table columns={ledgerColumns} data={summary.history} keyField="id" />
              </Card>
            )}
          </div>
        )}

        {/* Tab 2: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-[20px] border border-line shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-ink">Student Academic Ranking</h3>
                <p className="text-xs text-muted">
                  Privacy-preserving campus rankings derived from append-only ledger entries.
                </p>
              </div>

              <div className="w-full sm:w-64">
                <AppSelect
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  options={[
                    { label: 'All Departments (Overall)', value: '' },
                    ...departments.map((d) => ({
                      label: `${d.name} (${d.code})`,
                      value: d.id,
                    })),
                  ]}
                />
              </div>
            </div>

            {isLeaderboardLoading ? (
              <div className="py-16 text-center">
                <Spinner size="md" />
              </div>
            ) : leaderboard.length === 0 ? (
              <EmptyState
                title="No Leaderboard Data"
                description="No student points records exist for this department yet."
              />
            ) : (
              <div className="space-y-2.5">
                {leaderboard.map((row) => {
                  const rank = parseInt(row.leaderboard_rank, 10);
                  const isRank1 = rank === 1;
                  const isRank2 = rank === 2;
                  const isRank3 = rank === 3;
                  const isMe = row.student_id === user?.id;

                  return (
                    <div
                      key={row.student_id}
                      className={`flex items-center justify-between p-4 rounded-[16px] transition-all ${
                        isRank1
                          ? 'border border-gold/60 shadow-[0_0_15px_rgb(var(--gold)/0.15)] bg-surface'
                          : isMe
                          ? 'border border-primary/40 bg-primary-soft/30 shadow-xs'
                          : 'border border-line bg-surface hover:bg-surface-2/60 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Rank Badge */}
                        <div className="w-10 flex items-center justify-center shrink-0">
                          {isRank1 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gold/50 bg-gold/15 text-gold font-bold text-xs shadow-xs">
                              <Trophy className="w-4 h-4 text-gold" />
                            </span>
                          ) : isRank2 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-line bg-surface-2 text-muted font-bold text-xs">
                              <Medal className="w-4 h-4 text-muted" />
                            </span>
                          ) : isRank3 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-amber-600/30 bg-amber-600/10 text-amber-700 font-bold text-xs">
                              <Medal className="w-4 h-4 text-amber-700" />
                            </span>
                          ) : (
                            <span className="font-mono text-xs font-semibold text-muted">
                              #{rank}
                            </span>
                          )}
                        </div>

                        {/* Student Monogram & Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isRank1
                                ? 'bg-gold/20 text-gold border border-gold/40'
                                : 'bg-primary-soft text-primary'
                            }`}
                          >
                            {(row.student_name || 'S')[0]}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold truncate ${
                                  isRank1 ? 'text-ink font-serif' : 'text-ink'
                                }`}
                              >
                                {row.student_name}
                              </span>
                              {isMe && (
                                <Badge variant="primary" size="sm" className="text-xs">
                                  You
                                </Badge>
                              )}
                              {isRank1 && (
                                <span className="text-xs uppercase font-bold text-gold px-1.5 py-0.5 rounded border border-gold/40 bg-gold/10">
                                  #1 Rank
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted font-mono">
                              {row.department_code || 'FXEC'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Points Total */}
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-sm text-primary tabular-nums">
                          {row.total_points}
                        </span>
                        <span className="text-xs text-muted ml-1">pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
