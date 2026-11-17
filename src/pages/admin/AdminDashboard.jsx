import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { eventService } from '../../services/eventService';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import EmptyState from '../../components/common/EmptyState';
import AnalyticsTab from '../../components/admin/AnalyticsTab';
import FeedbackReportsTab from '../../components/admin/FeedbackReportsTab';
import AuditLogsTab from '../../components/admin/AuditLogsTab';
import SettingsTab from '../../components/admin/SettingsTab';
import AllowlistPanel from '../../components/admin/AllowlistPanel';
import {
  Users,
  Shield,
  GraduationCap,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  BarChart3,
  Download,
  Eye,
  QrCode,
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  Award,
  Sparkles,
  MessageSquare,
  History,
  Sliders,
  UserX
} from 'lucide-react';

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Synchronize active tab with current URL route
  const getTabFromPath = useCallback(() => {
    if (location.pathname.startsWith('/admin/analytics')) return 'analytics';
    if (location.pathname.startsWith('/admin/users')) return 'users';
    if (location.pathname.startsWith('/admin/requests')) return 'coordinator_requests';
    if (location.pathname.startsWith('/admin/events')) return 'events';
    if (location.pathname.startsWith('/admin/venues')) return 'venues';
    if (location.pathname.startsWith('/admin/feedback')) return 'feedback';
    if (location.pathname.startsWith('/admin/logs')) return 'logs';
    if (location.pathname.startsWith('/admin/settings')) return 'settings';
    return 'analytics'; // default
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [eventStatusFilter, setEventStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected' | 'completed'

  const [profiles, setProfiles] = useState([]);
  const [coordinatorRequests, setCoordinatorRequests] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State for Venue Management
  const [isAddVenueModalOpen, setIsAddVenueModalOpen] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [venueBuilding, setVenueBuilding] = useState('');
  const [venueCapacity, setVenueCapacity] = useState('120');
  const [isSubmittingVenue, setIsSubmittingVenue] = useState(false);

  // Modal State for Direct Role Management
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Modal State for Coordinator Request Rejection
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isDeciding, setIsDeciding] = useState(false);

  // Modal State for Event Rejection
  const [rejectingEvent, setRejectingEvent] = useState(null);
  const [eventRejectionReason, setEventRejectionReason] = useState('');
  const [isDecidingEvent, setIsDecidingEvent] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [usersData, requestsData, pendingData, allEventsData, venuesData] = await Promise.all([
        profileService.getAllProfiles(),
        profileService.getAllCoordinatorRequests(),
        eventService.getPendingEvents(),
        eventService.getAllEventsAdmin(),
        eventService.getVenues().catch(() => []),
      ]);
      setProfiles(usersData || []);
      setCoordinatorRequests(requestsData || []);
      setPendingEvents(pendingData || []);
      setAllEvents(allEventsData || []);
      setVenues(venuesData || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      showToast(err.message || 'Failed to fetch admin data.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync tab state when URL path changes
  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [getTabFromPath]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'analytics') navigate('/admin/analytics');
    else if (tab === 'users') navigate('/admin/users');
    else if (tab === 'coordinator_requests') navigate('/admin/requests');
    else if (tab === 'events') navigate('/admin/events');
    else if (tab === 'venues') navigate('/admin/venues');
    else if (tab === 'feedback') navigate('/admin/feedback');
    else if (tab === 'logs') navigate('/admin/logs');
    else if (tab === 'settings') navigate('/admin/settings');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // Toggle user activation status (Deactivate / Reactivate)
  const handleToggleUserStatus = async (userId, targetStatus) => {
    try {
      await adminService.toggleUserStatus(userId, targetStatus);
      showToast(
        `User account successfully ${targetStatus ? 'reactivated' : 'deactivated'}!`,
        'success'
      );
      fetchData();
    } catch (err) {
      console.error('Error toggling user status:', err);
      showToast(err.message || 'Failed to update user status.', 'error');
    }
  };

  // Direct Role Update
  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleModalOpen(true);
  };

  const handleRoleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newRole) return;
    if (newRole === selectedUser.role) {
      setIsRoleModalOpen(false);
      return;
    }

    setIsUpdatingRole(true);
    try {
      await profileService.updateUserRole(selectedUser.id, newRole);
      showToast(
        `Role updated to ${newRole.toUpperCase()} for ${selectedUser.name}!`,
        'success'
      );
      setIsRoleModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Role update error:', err);
      showToast(err.message || 'Failed to update user role.', 'error');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Event Review Handlers
  const handleApproveEvent = async (event) => {
    setIsDecidingEvent(true);
    try {
      await eventService.adminDecideEvent(event.id, 'approved');
      showToast(`Event "${event.title}" has been approved!`, 'success');
      fetchData();
    } catch (err) {
      console.error('Event approval failed:', err);
      showToast(err.message || 'Failed to approve event.', 'error');
    } finally {
      setIsDecidingEvent(false);
    }
  };

  const handleRejectEvent = async (e) => {
    e.preventDefault();
    if (!rejectingEvent) return;
    if (!eventRejectionReason.trim()) {
      showToast('Rejection reason is required.', 'warning');
      return;
    }

    setIsDecidingEvent(true);
    try {
      await eventService.adminDecideEvent(
        rejectingEvent.id,
        'rejected',
        eventRejectionReason.trim()
      );
      showToast(`Event proposal rejected.`, 'info');
      setRejectingEvent(null);
      setEventRejectionReason('');
      fetchData();
    } catch (err) {
      console.error('Event rejection failed:', err);
      showToast(err.message || 'Failed to reject event.', 'error');
    } finally {
      setIsDecidingEvent(false);
    }
  };

  // Coordinator Authorization Handlers
  const handleApproveCoordinator = async (req) => {
    setIsDeciding(true);
    try {
      await profileService.decideCoordinatorRequest(req.id, 'approved');
      showToast(
        `Coordinator authorization granted for ${req.profiles?.name || 'faculty member'}!`,
        'success'
      );
      fetchData();
    } catch (err) {
      console.error('Coordinator approval error:', err);
      showToast(err.message || 'Failed to approve coordinator request.', 'error');
    } finally {
      setIsDeciding(false);
    }
  };

  // Venue Management Handlers
  const handleAddVenue = async (e) => {
    e.preventDefault();
    if (!venueName.trim() || !venueCapacity) {
      showToast('Please provide venue name and capacity.', 'warning');
      return;
    }
    const capNum = parseInt(venueCapacity, 10);
    if (isNaN(capNum) || capNum <= 0) {
      showToast('Capacity must be a positive integer.', 'warning');
      return;
    }

    setIsSubmittingVenue(true);
    try {
      await eventService.createVenue({
        name: venueName.trim(),
        building: venueBuilding.trim() || 'Main Campus',
        capacity: capNum,
      });
      showToast(`Venue "${venueName.trim()}" created successfully!`, 'success');
      setIsAddVenueModalOpen(false);
      setVenueName('');
      setVenueBuilding('');
      setVenueCapacity('120');
      fetchData();
    } catch (err) {
      console.error('Failed to create venue:', err);
      showToast(err.message || 'Failed to create venue.', 'error');
    } finally {
      setIsSubmittingVenue(false);
    }
  };

  const handleDeleteVenue = async (venue) => {
    if (!window.confirm(`Are you sure you want to delete venue "${venue.name}"?`)) return;
    try {
      await eventService.deleteVenue(venue.id);
      showToast(`Venue "${venue.name}" deleted.`, 'info');
      fetchData();
    } catch (err) {
      console.error('Failed to delete venue:', err);
      showToast(err.message || 'Cannot delete venue in use.', 'error');
    }
  };

  const handleRejectCoordinator = async (e) => {
    e.preventDefault();
    if (!rejectingRequest) return;

    setIsDeciding(true);
    try {
      await profileService.decideCoordinatorRequest(
        rejectingRequest.id,
        'rejected',
        rejectionReason.trim() || 'Criteria not met.'
      );
      showToast('Coordinator request rejected.', 'info');
      setRejectingRequest(null);
      setRejectionReason('');
      fetchData();
    } catch (err) {
      console.error('Rejection failed:', err);
      showToast(err.message || 'Failed to reject request.', 'error');
    } finally {
      setIsDeciding(false);
    }
  };

  // Real Counts & Analytics
  const totalUsers = profiles.length;
  const adminCount = profiles.filter((p) => p.role === 'admin').length;
  const coordinatorCount = profiles.filter((p) => p.role === 'coordinator').length;
  const studentCount = profiles.filter((p) => p.role === 'student').length;
  const pendingRequestsCount = coordinatorRequests.filter((r) => r.status === 'pending').length;

  const totalEvents = allEvents.length;
  const approvedEventsCount = allEvents.filter((e) => e.status === 'approved').length;
  const completedEventsCount = allEvents.filter(
    (e) => e.status === 'completed' || (e.end_time && new Date(e.end_time) <= new Date())
  ).length;
  const pendingEventsCount = pendingEvents.length;
  const totalRegistrationsAll = allEvents.reduce((acc, e) => acc + (e.registered_count || 0), 0);
  const totalSeatsOffered = allEvents.reduce((acc, e) => acc + (e.seat_capacity || 0), 0);
  const overallOccupancyRate = totalSeatsOffered > 0 ? Math.round((totalRegistrationsAll / totalSeatsOffered) * 100) : 0;

  // Filtered Events for Events Tab
  const filteredEvents = useMemo(() => {
    if (eventStatusFilter === 'all') return allEvents;
    if (eventStatusFilter === 'pending') return allEvents.filter((e) => e.status === 'pending');
    if (eventStatusFilter === 'approved') return allEvents.filter((e) => e.status === 'approved');
    if (eventStatusFilter === 'rejected') return allEvents.filter((e) => e.status === 'rejected');
    if (eventStatusFilter === 'completed') {
      return allEvents.filter(
        (e) => e.status === 'completed' || (e.end_time && new Date(e.end_time) <= new Date())
      );
    }
    return allEvents;
  }, [allEvents, eventStatusFilter]);

  // Institutional Department Distribution Analytics
  const departmentStats = useMemo(() => {
    const deptMap = new Map();
    const fxecDepts = ['CSE', 'IT', 'AIDS', 'CSBS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'MCA'];
    fxecDepts.forEach((code) => {
      deptMap.set(code, { code, students: 0, coordinators: 0, eventsHosted: 0 });
    });

    profiles.forEach((p) => {
      const code = p.departments?.code;
      if (code && deptMap.has(code)) {
        const item = deptMap.get(code);
        if (p.role === 'student') item.students += 1;
        if (p.role === 'coordinator') item.coordinators += 1;
      }
    });

    allEvents.forEach((e) => {
      e.event_departments?.forEach((ed) => {
        const code = ed.department?.code;
        if (code && deptMap.has(code)) {
          deptMap.get(code).eventsHosted += 1;
        }
      });
    });

    return Array.from(deptMap.values());
  }, [profiles, allEvents]);

  // Export Analytics CSV
  const handleExportAnalyticsCSV = () => {
    const headers = ['Department Code', 'Enrolled Students', 'Faculty Coordinators', 'Targeted Sessions'];
    const rows = departmentStats.map((d) => [
      d.code,
      d.students,
      d.coordinators,
      d.eventsHosted,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `fxec_campus_connect_analytics_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Institutional analytics report exported successfully.', 'success');
  };

  const usersTableColumns = [
    {
      header: 'User',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-burgundy-50 border border-burgundy-200 text-burgundy flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {row.name ? row.name[0] : 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-neutral-900 truncate">{row.name}</p>
            <p className="text-xs text-neutral-500 truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      key: 'role',
      render: (row) => (
        <Badge variant={row.role} size="sm" className="uppercase tracking-wider">
          {row.role}
        </Badge>
      ),
    },
    {
      header: 'Department',
      key: 'departments',
      render: (row) => (
        <span className="text-xs text-neutral-700">
          {row.departments ? `${row.departments.code} - ${row.departments.name}` : 'Not Specified'}
        </span>
      ),
    },
    {
      header: 'Year / Reg No.',
      key: 'register_number',
      render: (row) => (
        <div className="text-xs text-neutral-600">
          <p className="font-mono">{row.register_number || '—'}</p>
          <p className="text-neutral-400">{row.year ? `Year ${row.year}` : ''}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'is_active',
      render: (row) => (
        <Badge
          variant={row.is_active !== false ? 'success' : 'danger'}
          size="sm"
          className="text-[10px] font-semibold"
        >
          {row.is_active !== false ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => {
        const isSelf = row.id === currentUser?.id;
        const isActive = row.is_active !== false;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleOpenRoleModal(row)}
            >
              Role
            </Button>
            <Button
              variant={isActive ? 'ghost' : 'secondary'}
              size="xs"
              className={isActive ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'}
              disabled={isSelf}
              title={isSelf ? 'Cannot deactivate your own administrator account' : undefined}
              onClick={() => handleToggleUserStatus(row.id, !isActive)}
            >
              {isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout
      title="Administrator Control Center"
      subtitle="Francis Xavier Engineering College Institutional Management"
      actions={
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={handleRefresh}
          isLoading={isRefreshing}
        >
          Refresh Data
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-neutral-500 uppercase">Total Users</p>
                <p className="text-xl font-bold text-neutral-900">{totalUsers}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-neutral-500 uppercase">Admins</p>
                <p className="text-xl font-bold text-purple-900">{adminCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-neutral-500 uppercase">Coordinators</p>
                <p className="text-xl font-bold text-indigo-900">{coordinatorCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-neutral-500 uppercase">Students</p>
                <p className="text-xl font-bold text-emerald-900">{studentCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={pendingRequestsCount > 0 ? 'border-amber-300 bg-amber-50/40' : ''}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-neutral-500 uppercase">Pending Requests</p>
                <p className="text-xl font-bold text-amber-900">{pendingRequestsCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Controls Synchronized with Routes */}
        <div className="flex border-b border-neutral-200 gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange('analytics')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-burgundy text-burgundy'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics & Reports</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('users')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-burgundy text-burgundy'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management ({totalUsers})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('coordinator_requests')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'coordinator_requests'
                ? 'border-burgundy text-burgundy'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Coordinator Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-200 text-amber-900 font-bold">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('events')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'events'
                ? 'border-burgundy text-burgundy'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Event Proposals ({allEvents.length})</span>
            {pendingEventsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-burgundy-100 text-burgundy font-bold">
                {pendingEventsCount} pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('venues')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'venues'
                ? 'border-burgundy text-burgundy'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Venues ({venues.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('feedback')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'feedback'
                ? 'border-burgundy text-burgundy'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Feedback Reports</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('logs')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-burgundy text-burgundy'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Activity Logs</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('settings')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-burgundy text-burgundy'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Platform Settings</span>
          </button>
        </div>

        {/* Tab 1: Users & Roles Management */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Registered Institutional Accounts</h3>
                  <p className="text-xs text-neutral-500">
                    View user roles and manage account activation status (deactivated accounts lose database access immediately)
                  </p>
                </div>
              </div>
              <Table
                columns={usersTableColumns}
                data={profiles}
                isLoading={isLoading}
                emptyTitle="No registered accounts"
                emptyDescription="No users have registered into Francis Xavier Campus Connect yet."
              />
            </div>

            {/* Pre-Authorized Allowlists Panel */}
            <AllowlistPanel />
          </div>
        )}

        {/* Tab 2: Coordinator Requests */}
        {activeTab === 'coordinator_requests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Faculty Coordinator Requests</h3>
                <p className="text-xs text-neutral-500">Review faculty elevation requests to propose guest lectures and manage attendance</p>
              </div>
            </div>

            {coordinatorRequests.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="No Coordinator Requests"
                description="There are currently no coordinator authorization requests in the queue."
              />
            ) : (
              <div className="space-y-3">
                {coordinatorRequests.map((req) => (
                  <Card key={req.id} className="p-5 border-neutral-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-neutral-900">{req.profiles?.name}</span>
                          <span className="text-xs text-neutral-500">({req.profiles?.email})</span>
                          <Badge
                            variant={
                              req.status === 'approved'
                                ? 'success'
                                : req.status === 'rejected'
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                            className="uppercase"
                          >
                            {req.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-700">
                          <span className="font-semibold">Department:</span> {req.departments?.name || req.departments?.code || 'Assigned Dept'} •{' '}
                          <span className="font-semibold">Designation:</span> {req.designation || 'Faculty Member'}
                        </p>
                        <p className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 mt-2">
                          &quot;{req.reason}&quot;
                        </p>
                        {req.rejection_reason && (
                          <p className="text-xs text-red-600 font-medium">
                            Rejection Note: {req.rejection_reason}
                          </p>
                        )}
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={CheckCircle2}
                            onClick={() => handleApproveCoordinator(req)}
                            disabled={isDeciding}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={XCircle}
                            onClick={() => {
                              setRejectingRequest(req);
                              setRejectionReason('');
                            }}
                            disabled={isDeciding}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: All Events Management (Proposals & Sessions) */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Sub-Filters for Events */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-neutral-200">
              <div className="flex flex-wrap gap-2">
                {[
                  { label: `All Events (${allEvents.length})`, value: 'all' },
                  { label: `Pending Review (${pendingEventsCount})`, value: 'pending' },
                  { label: `Approved (${approvedEventsCount})`, value: 'approved' },
                  { label: `Completed (${completedEventsCount})`, value: 'completed' },
                  { label: 'Rejected', value: 'rejected' },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setEventStatusFilter(item.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      eventStatusFilter === item.value
                        ? 'bg-burgundy text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-neutral-500">
                Showing {filteredEvents.length} events
              </span>
            </div>

            {filteredEvents.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No Events Found"
                description={`There are currently no events matching status filter "${eventStatusFilter}".`}
              />
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((evt) => (
                  <Card key={evt.id} className="p-5 border-neutral-200">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-neutral-900">{evt.title}</h3>
                          <Badge
                            variant={
                              evt.status === 'approved'
                                ? 'success'
                                : evt.status === 'pending'
                                ? 'warning'
                                : 'danger'
                            }
                            size="sm"
                            className="uppercase"
                          >
                            {evt.status}
                          </Badge>
                          <span className="text-xs text-neutral-500">
                            Coordinator: <span className="font-semibold text-neutral-800">{evt.coordinator?.name}</span> ({evt.coordinator?.email})
                          </span>
                        </div>

                        <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-neutral-600 pt-1">
                          <p className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                            {new Date(evt.start_time).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                            {evt.venues?.name || evt.custom_venue || 'FXEC Campus'}
                          </p>
                          <p className="flex items-center gap-1 font-semibold text-neutral-800">
                            <Users className="w-3.5 h-3.5 text-neutral-400" />
                            {evt.registered_count || 0} / {evt.seat_capacity} registered
                          </p>
                        </div>

                        {evt.speakers && (
                          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 flex items-center gap-3">
                            <span className="font-semibold text-burgundy">Speaker:</span>
                            <span>{evt.speakers.name} ({evt.speakers.designation}, {evt.speakers.company})</span>
                          </div>
                        )}

                        {evt.rejection_reason && (
                          <p className="text-xs text-red-600 font-medium pt-1">
                            Rejection Note: {evt.rejection_reason}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {evt.status === 'pending' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={CheckCircle2}
                              onClick={() => handleApproveEvent(evt)}
                              disabled={isDecidingEvent}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={XCircle}
                              onClick={() => {
                                setRejectingEvent(evt);
                                setEventRejectionReason('');
                              }}
                              disabled={isDecidingEvent}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {evt.status === 'approved' && (
                          <Link to={`/events/${evt.id}/attendance`}>
                            <Button variant="primary" size="sm" icon={QrCode} className="text-xs shadow-xs">
                              Live Attendance & Feedback
                            </Button>
                          </Link>
                        )}

                        <Link to={`/events/${evt.id}`}>
                          <Button variant="outline" size="sm" icon={Eye} className="text-xs">
                            View Event
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Analytics & Institutional Reports */}
        {activeTab === 'analytics' && <AnalyticsTab />}

        {/* Tab 6: Anonymous Student Feedback Reports */}
        {activeTab === 'feedback' && <FeedbackReportsTab />}

        {/* Tab 7: Institutional Activity & Audit Logs */}
        {activeTab === 'logs' && <AuditLogsTab />}

        {/* Tab 8: Institutional Platform Settings */}
        {activeTab === 'settings' && <SettingsTab />}

        {/* Tab 5: Venues & Capacity Management (Phase 5) */}
        {activeTab === 'venues' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Campus Auditoriums & Seminar Halls ({venues.length})
                </h3>
                <p className="text-xs text-neutral-500">
                  Venues are protected by automated PostgreSQL exclusion triggers preventing schedule overlap.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={MapPin}
                onClick={() => setIsAddVenueModalOpen(true)}
              >
                Add New Venue
              </Button>
            </div>

            {/* Conflict Guard Notice */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-indigo-950">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>PostgreSQL Conflict & Capacity Guard Active (trg_check_venue_conflict)</span>
              </div>
              <p className="text-indigo-800 leading-relaxed">
                The database automatically rejects overlapping approved sessions in the same venue, and ensures proposed event seat capacities cannot exceed venue physical capacity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {venues.map((venue) => (
                <Card key={venue.id} className="p-5 flex flex-col justify-between hover:border-burgundy/40 transition-colors bg-white">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-burgundy/10 text-burgundy flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <Badge variant="success" size="sm" className="gap-1 text-[10px]">
                        <ShieldCheck className="w-3 h-3" /> Protected
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">{venue.name}</h4>
                      <p className="text-xs text-neutral-500">{venue.building || 'Main Campus'}</p>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-medium">Physical Capacity:</span>
                      <span className="font-bold text-burgundy font-mono">{venue.capacity} seats</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-neutral-100 flex justify-end">
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteVenue(venue)}
                    >
                      Delete Venue
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Change Role Modal */}
        <Modal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          title="Direct User Role Override"
          description={`Update authorization role for ${selectedUser?.name} (${selectedUser?.email})`}
        >
          <form onSubmit={handleRoleUpdate} className="space-y-4">
            <Select
              label="Assigned System Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              options={[
                { value: 'student', label: 'Student' },
                { value: 'coordinator', label: 'Coordinator (Faculty)' },
                { value: 'admin', label: 'Administrator' },
              ]}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsRoleModalOpen(false)}
                disabled={isUpdatingRole}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUpdatingRole}
              >
                Confirm Role
              </Button>
            </div>
          </form>
        </Modal>

        {/* Reject Coordinator Request Modal */}
        <Modal
          isOpen={Boolean(rejectingRequest)}
          onClose={() => setRejectingRequest(null)}
          title="Reject Coordinator Authorization"
          description={`Provide a reason for rejecting ${rejectingRequest?.profiles?.name}`}
        >
          <form onSubmit={handleRejectCoordinator} className="space-y-4">
            <Textarea
              label="Reason for Rejection"
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Please coordinate with Department HOD before re-applying."
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setRejectingRequest(null)}
                disabled={isDeciding}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                isLoading={isDeciding}
              >
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>

        {/* Reject Event Proposal Modal */}
        <Modal
          isOpen={Boolean(rejectingEvent)}
          onClose={() => setRejectingEvent(null)}
          title="Reject Event Proposal"
          description={`Provide a mandatory reason for rejecting "${rejectingEvent?.title}"`}
        >
          <form onSubmit={handleRejectEvent} className="space-y-4">
            <Textarea
              label="Reason for Rejection"
              required
              rows={3}
              value={eventRejectionReason}
              onChange={(e) => setEventRejectionReason(e.target.value)}
              placeholder="e.g. Conflict with university exams on the requested date. Please reschedule."
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setRejectingEvent(null)}
                disabled={isDecidingEvent}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                isLoading={isDecidingEvent}
              >
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>

        {/* Add Venue Modal (Phase 5) */}
        {isAddVenueModalOpen && (
          <Modal
            isOpen={isAddVenueModalOpen}
            onClose={() => setIsAddVenueModalOpen(false)}
            title="Add Campus Venue"
            description="Configure physical capacity and location for event booking conflict checks."
          >
            <form onSubmit={handleAddVenue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Venue Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Mechanical Seminar Hall"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:border-burgundy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Campus Building / Block
                </label>
                <input
                  type="text"
                  value={venueBuilding}
                  onChange={(e) => setVenueBuilding(e.target.value)}
                  placeholder="e.g. Mechanical Engineering Block - 2nd Floor"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:border-burgundy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Maximum Seating Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={venueCapacity}
                  onChange={(e) => setVenueCapacity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:border-burgundy font-mono"
                  required
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Events cannot accept seat capacities higher than this venue limit.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddVenueModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingVenue}
                >
                  Create Venue
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
