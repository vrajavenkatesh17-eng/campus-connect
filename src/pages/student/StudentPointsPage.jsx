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
import Select from '../../components/common/Select';
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
        <span className="text-xs text-neutral-600">
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
          <p className="text-xs font-semibold text-neutral-900">{row.reason}</p>
          {row.event?.title && (
            <p className="text-[11px] text-neutral-500 line-clamp-1">{row.event.title}</p>
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
            <span className="inline-flex items-center gap-1 font-bold text-amber-500 text-sm">
              <Trophy className="w-4 h-4 fill-amber-400 text-amber-500" /> #1
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
        return <span className="font-mono text-xs font-medium text-neutral-500">#{rank}</span>;
      },
    },
    {
      header: 'Student Name',
      key: 'name',
      render: (row) => {
        const isMe = row.student_id === user?.id;
        return (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isMe ? 'text-burgundy' : 'text-neutral-900'}`}>
              {row.student_name}
            </span>
            {isMe && (
              <Badge variant="primary" size="sm" className="text-[10px]">
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
        <span className="font-mono text-xs font-semibold text-neutral-600">
          {row.department_code || 'FXEC'}
        </span>
      ),
    },
    {
      header: 'Total Points',
      key: 'points',
      render: (row) => (
        <span className="font-mono font-black text-xs text-burgundy">
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
          <p className="text-sm text-neutral-500">Loading your points ledger & milestones...</p>
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
        <div className="rounded-2xl bg-gradient-to-r from-burgundy via-burgundy-dark to-neutral-900 text-white p-6 sm:p-8 shadow-md">
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
                <p className="text-[11px] text-white/70">Attendance</p>
              </div>
              <div className="p-2 border-l border-white/15">
                <p className="text-xl font-bold text-amber-400">+{summary.categoryBreakdown.feedback}</p>
                <p className="text-[11px] text-white/70">Reviews</p>
              </div>
              <div className="p-2 border-l border-white/15">
                <p className="text-xl font-bold text-sky-400">+{summary.categoryBreakdown.interaction}</p>
                <p className="text-[11px] text-white/70">Bonus Q&A</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'border-burgundy text-burgundy'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Flame className="w-4 h-4" />
            My Points Ledger ({summary.history.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'border-burgundy text-burgundy'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Campus Leaderboard
          </button>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Student Ranking</h3>
                <p className="text-xs text-neutral-500">
                  Privacy-preserving institutional rankings. Only name, department, and total points are displayed.
                </p>
              </div>

              <div className="w-full sm:w-64">
                <Select
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
              <Card>
                <Table columns={leaderboardColumns} data={leaderboard} keyField="student_id" />
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
