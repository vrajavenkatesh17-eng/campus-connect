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
const AdminAnalyticsBento = React.lazy(() => import('../../components/admin/bento/AdminAnalyticsBento'));
import BentoSkeleton from '../../components/admin/bento/BentoSkeleton';
import FeedbackReportsTab from '../../components/admin/FeedbackReportsTab';
import AuditLogsTab from '../../components/admin/AuditLogsTab';
import SettingsTab from '../../components/admin/SettingsTab';
import AllowlistPanel from '../../components/admin/AllowlistPanel';
import AdminGalleryUploadPanel from '../../components/admin/AdminGalleryUploadPanel';
import RoleWelcomeDesk from '../../components/common/RoleWelcomeDesk';
import AppSegmented from '../../components/app/AppSegmented';
import MomentsSection from '../../components/sections/MomentsSection';
import { useQueryClient } from '@tanstack/react-query';
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
  UserX,
  Image as ImageIcon,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // Synchronize active tab with current URL route
  const getTabFromPath = useCallback(() => {
    if (location.pathname.startsWith('/admin/analytics')) return 'analytics';
    if (location.pathname.startsWith('/admin/users')) return 'users';
    if (location.pathname.startsWith('/admin/requests')) return 'users'; // unified in User Management
    if (location.pathname.startsWith('/admin/events')) return 'events';
    if (location.pathname.startsWith('/admin/venues')) return 'venues';
    if (location.pathname.startsWith('/admin/gallery')) return 'gallery';
    if (location.pathname.startsWith('/admin/feedback')) return 'feedback';
    if (location.pathname.startsWith('/admin/logs')) return 'logs';
    if (location.pathname.startsWith('/admin/settings')) return 'settings';
    return 'analytics'; // default
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [userSubTab, setUserSubTab] = useState(
    location.pathname.startsWith('/admin/requests') ? 'requests' : 'all'
  );

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [getTabFromPath]);
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

  // State for Public Gallery Review
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState('pending');
  const [reviewingPhoto, setReviewingPhoto] = useState(null);
  const [photoRejectReason, setPhotoRejectReason] = useState('');
  const [isDecidingPhoto, setIsDecidingPhoto] = useState(false);

  // Computed schedule overlap warnings across active proposed and approved sessions
  const venueOverlapWarnings = useMemo(() => {
    const warnings = [];
    const activeEvents = (allEvents || []).filter(
      (e) => e.status === 'approved' || e.status === 'pending'
    );
    for (let i = 0; i < activeEvents.length; i++) {
      for (let j = i + 1; j < activeEvents.length; j++) {
        const e1 = activeEvents[i];
        const e2 = activeEvents[j];
        if (e1.venue_id && e2.venue_id && e1.venue_id === e2.venue_id) {
          const s1 = new Date(e1.start_time).getTime();
          const end1 = new Date(e1.end_time).getTime();
          const s2 = new Date(e2.start_time).getTime();
          const end2 = new Date(e2.end_time).getTime();
          if (s1 < end2 && end1 > s2) {
            const venueObj = venues.find((v) => v.id === e1.venue_id);
            warnings.push({
              id: `${e1.id}-${e2.id}`,
              venueName: venueObj?.name || 'Assigned Venue',
              event1: e1.title,
              event2: e2.title,
              time: `${new Date(s1).toLocaleDateString()} overlaps`,
            });
          }
        }
      }
    }
    return warnings;
  }, [allEvents, venues]);

  const loadGalleryPhotos = useCallback(async () => {
    setIsGalleryLoading(true);
    try {
      const photos = await adminService.getGalleryPhotos(galleryFilter);
      setGalleryPhotos(photos || []);
    } catch (err) {
      console.warn('Error loading gallery photos:', err);
    } finally {
      setIsGalleryLoading(false);
    }
  }, [galleryFilter]);

  useEffect(() => {
    if (activeTab === 'gallery') {
      loadGalleryPhotos();
    }
  }, [activeTab, loadGalleryPhotos]);

  const handleApprovePhoto = async (photo) => {
    setIsDecidingPhoto(true);
    try {
      await adminService.reviewGalleryPhoto(photo.id, { status: 'approved' });
      showToast('Photo approved! It is now live in the public moments carousel.', 'success');
      queryClient.invalidateQueries({ queryKey: ['public-gallery'] });
      queryClient.invalidateQueries({ queryKey: ['public-gallery-full'] });
      loadGalleryPhotos();
    } catch (err) {
      console.error('Failed to approve photo:', err);
      showToast(err.message || 'Failed to approve photo.', 'error');
    } finally {
      setIsDecidingPhoto(false);
    }
  };

  const handleRejectPhoto = async (e) => {
    e.preventDefault();
    if (!reviewingPhoto) return;
    setIsDecidingPhoto(true);
    try {
      await adminService.reviewGalleryPhoto(reviewingPhoto.id, { status: 'rejected', reason: photoRejectReason });
      showToast('Photo rejected.', 'info');
      setReviewingPhoto(null);
      setPhotoRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['public-gallery'] });
      queryClient.invalidateQueries({ queryKey: ['public-gallery-full'] });
      loadGalleryPhotos();
    } catch (err) {
      console.error('Failed to reject photo:', err);
      showToast(err.message || 'Failed to reject photo.', 'error');
    } finally {
      setIsDecidingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photo) => {
    setIsDecidingPhoto(true);
    try {
      await adminService.deleteGalleryPhoto(photo.id);
      showToast('Photo removed from gallery.', 'info');
      queryClient.invalidateQueries({ queryKey: ['public-gallery'] });
      queryClient.invalidateQueries({ queryKey: ['public-gallery-full'] });
      loadGalleryPhotos();
    } catch (err) {
      console.error('Failed to delete photo:', err);
      showToast(err.message || 'Failed to delete photo.', 'error');
    } finally {
      setIsDecidingPhoto(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [usersData, requestsData, pendingData, allEventsData, venuesData, photosData] = await Promise.all([
        profileService.getAllProfiles(),
        profileService.getAllCoordinatorRequests(),
        eventService.getPendingEvents(),
        eventService.getAllEventsAdmin(),
        eventService.getVenues().catch(() => []),
        adminService.getGalleryPhotos('pending').catch(() => []),
      ]);
      setProfiles(usersData || []);
      setCoordinatorRequests(requestsData || []);
      setPendingEvents(pendingData || []);
      setAllEvents(allEventsData || []);
      setVenues(venuesData || []);
      setGalleryPhotos(photosData || []);
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
    else if (tab === 'gallery') navigate('/admin/gallery');
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
    if (!true /* confirmed */) return;
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
          <div className="w-8 h-8 rounded-full bg-primary-soft border border-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {row.name ? row.name[0] : 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-ink truncate">{row.name}</p>
            <p className="text-xs text-muted truncate">{row.email}</p>
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
        <span className="text-xs text-ink">
          {row.departments ? `${row.departments.code} - ${row.departments.name}` : 'Not Specified'}
        </span>
      ),
    },
    {
      header: 'Year / Reg No.',
      key: 'register_number',
      render: (row) => (
        <div className="text-xs text-muted">
          <p className="font-mono">{row.register_number || '—'}</p>
          <p className="text-muted">{row.year ? `Year ${row.year}` : ''}</p>
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
          className="text-xs font-semibold"
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

  const adminHeaderMeta = useMemo(() => {
    switch (activeTab) {
      case 'users':
      case 'coordinator_requests':
        return {
          title: 'User Management',
          subtitle: 'Manage student, faculty coordinator, and administrator accounts',
        };
      case 'events':
        return {
          title: 'Event Proposals',
          subtitle: 'Review, approve, or reject coordinator event proposals',
        };
      case 'venues':
        return {
          title: 'Venues & Capacity',
          subtitle: 'Manage campus auditoriums, physical capacities, and schedule conflict guards',
        };
      case 'gallery':
        return {
          title: 'Public Gallery',
          subtitle: 'Upload official moments or moderate coordinator submissions for /gallery',
        };
      case 'feedback':
        return {
          title: 'Feedback Reports',
          subtitle: 'Anonymous event evaluation scores and student feedback',
        };
      case 'logs':
        return {
          title: 'Activity Logs',
          subtitle: 'Append-only institutional security and audit trail',
        };
      case 'settings':
        return {
          title: 'Platform Settings',
          subtitle: 'Institutional points caps, feedback gates, email domain, and departments',
        };
      default:
        return { title: undefined, subtitle: undefined };
    }
  }, [activeTab]);

  return (
    <DashboardLayout
      title={adminHeaderMeta.title}
      subtitle={adminHeaderMeta.subtitle}
      actions={
        activeTab !== 'analytics' ? (
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={handleRefresh}
            isLoading={isRefreshing}
          >
            Refresh Data
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-8">
        {/* Tab 1 & 2: Unified User Management with AppSegmented */}
        {(activeTab === 'users' || activeTab === 'coordinator_requests') && (
          <div className="space-y-6">
            <div className="flex items-center">
              <AppSegmented
                options={[
                  { value: 'all', label: `All Users (${profiles.length})` },
                  {
                    value: 'requests',
                    label: `Pending Coordinator Requests (${
                      coordinatorRequests.filter((r) => r.status === 'pending').length
                    })`,
                  },
                ]}
                value={userSubTab}
                onChange={setUserSubTab}
              />
            </div>

            {userSubTab === 'all' ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-ink">Registered Institutional Accounts</h3>
                      <p className="text-xs text-muted">
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
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-ink">Faculty Coordinator Requests</h3>
                    <p className="text-xs text-muted">Review faculty elevation requests to propose guest lectures and manage attendance</p>
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
                      <Card key={req.id} className="p-5 border-line">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-ink">{req.profiles?.name}</span>
                              <span className="text-xs text-muted">({req.profiles?.email})</span>
                              <Badge
                                variant={
                                  req.status === 'approved'
                                    ? 'success'
                                    : req.status === 'rejected'
                                    ? 'danger'
                                    : 'warning'
                                }
                                size="sm"
                                className="uppercase text-xs"
                              >
                                {req.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-ink">
                              <span className="font-semibold">Department:</span> {req.departments?.name || req.departments?.code || 'Assigned Dept'} •{' '}
                              <span className="font-semibold">Designation:</span> {req.designation || 'Faculty Member'}
                            </p>
                            <p className="text-xs text-muted bg-surface-2 p-2.5 rounded-lg border border-line mt-2">
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
          </div>
        )}

        {/* Tab 3: All Events Management (Proposals & Sessions) */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Sub-Filters for Events */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-line">
              <AppSegmented
                options={[
                  { label: `All Events (${allEvents.length})`, value: 'all' },
                  { label: `Pending (${pendingEventsCount})`, value: 'pending' },
                  { label: `Approved (${approvedEventsCount})`, value: 'approved' },
                  { label: `Completed (${completedEventsCount})`, value: 'completed' },
                  { label: 'Rejected', value: 'rejected' },
                ]}
                value={eventStatusFilter}
                onChange={setEventStatusFilter}
              />

              <span className="text-xs text-muted">
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
                  <Card key={evt.id} className="p-5 border-line">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-ink">{evt.title}</h3>
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
                          <span className="text-xs text-muted">
                            Coordinator: <span className="font-semibold text-ink">{evt.coordinator?.name}</span> ({evt.coordinator?.email})
                          </span>
                        </div>

                        <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted pt-1">
                          <p className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted" />
                            {new Date(evt.start_time).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-muted" />
                            {evt.venues?.name || evt.custom_venue || 'FXEC Campus'}
                          </p>
                          <p className="flex items-center gap-1 font-semibold text-ink">
                            <Users className="w-3.5 h-3.5 text-muted" />
                            {evt.registered_count || 0} / {evt.seat_capacity} registered
                          </p>
                        </div>

                        {evt.speakers && (
                          <div className="p-2.5 rounded-lg bg-surface-2 border border-line text-xs text-ink flex items-center gap-3">
                            <span className="font-semibold text-primary">Speaker:</span>
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
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {(location.pathname === '/admin' || location.pathname === '/admin/') && (
              <RoleWelcomeDesk />
            )}
            <React.Suspense fallback={<BentoSkeleton />}>
              <AdminAnalyticsBento
                coordinatorRequestsCount={
                  coordinatorRequests.filter((r) => r.status === 'pending').length
                }
              />
            </React.Suspense>
            <MomentsSection />
          </div>
        )}

        {/* Tab 5: Public Gallery Moments Review */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
              <div>
                <h3 className="text-base font-bold text-ink">Public Gallery Moments Review</h3>
                <p className="text-xs text-muted">
                  Upload official photos (auto-approved) or review coordinator uploads for the public moments carousel &amp; /gallery.
                </p>
              </div>
              <AppSegmented
                options={[
                  { value: 'pending', label: 'Pending Review' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'all', label: 'All Photos' },
                ]}
                value={galleryFilter}
                onChange={setGalleryFilter}
              />
            </div>

            <AdminGalleryUploadPanel
              events={allEvents}
              currentUserId={currentUser?.id}
              onUploadComplete={loadGalleryPhotos}
            />

            {isGalleryLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Spinner size="lg" />
                <p className="text-xs text-muted">Loading event photos...</p>
              </div>
            ) : galleryPhotos.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="No Photos Found"
                description={`No event photos found matching filter "${galleryFilter}".`}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {galleryPhotos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden border-line flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="relative aspect-video w-full bg-surface-2 overflow-hidden border-b border-line">
                        <img
                          src={photo.storage_path}
                          alt={photo.caption || photo.events?.title || 'Event Moment'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant={
                              photo.status === 'approved'
                                ? 'success'
                                : photo.status === 'rejected'
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                            className="uppercase font-semibold text-xs shadow-xs"
                          >
                            {photo.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <h4 className="text-sm font-bold text-ink line-clamp-1">
                          {photo.events?.title || 'Event Highlight'}
                        </h4>
                        {photo.caption && (
                          <p className="text-xs text-muted italic line-clamp-2">
                            &quot;{photo.caption}&quot;
                          </p>
                        )}
                        <div className="text-xs text-muted pt-1 flex items-center justify-between">
                          <span>By: {photo.profiles?.name || 'Coordinator'}</span>
                          <span>{new Date(photo.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center gap-2">
                      {photo.status !== 'approved' && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={CheckCircle2}
                          onClick={() => handleApprovePhoto(photo)}
                          disabled={isDecidingPhoto}
                          className="flex-1 text-xs"
                        >
                          Approve
                        </Button>
                      )}
                      {photo.status !== 'rejected' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={XCircle}
                          onClick={() => {
                            setReviewingPhoto(photo);
                            setPhotoRejectReason('');
                          }}
                          disabled={isDecidingPhoto}
                          className="flex-1 text-xs text-danger"
                        >
                          Reject
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDeletePhoto(photo)}
                        disabled={isDecidingPhoto}
                        className="text-xs text-muted hover:text-danger"
                        aria-label="Delete photo"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Anonymous Student Feedback Reports */}
        {activeTab === 'feedback' && <FeedbackReportsTab />}

        {/* Tab 7: Institutional Activity & Audit Logs */}
        {activeTab === 'logs' && <AuditLogsTab />}

        {/* Tab 8: Institutional Platform Settings */}
        {activeTab === 'settings' && <SettingsTab />}

        {/* Tab 5: Venues & Capacity Management */}
        {activeTab === 'venues' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-ink">
                  Campus Auditoriums & Seminar Halls ({venues.length})
                </h3>
                <p className="text-xs text-muted">
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

            {/* Overlap Warnings Banner */}
            {venueOverlapWarnings.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Venue Schedule Overlap Warnings ({venueOverlapWarnings.length})</span>
                </div>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  {venueOverlapWarnings.map((w) => (
                    <li key={w.id}>
                      <span className="font-semibold">{w.venueName}:</span> &quot;{w.event1}&quot; conflicts with &quot;{w.event2}&quot; ({w.time})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Conflict Guard Notice */}
            <div className="p-4 rounded-[16px] bg-surface-2/70 border border-line text-xs text-ink space-y-1">
              <div className="flex items-center gap-2 font-bold text-ink">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>PostgreSQL Conflict &amp; Capacity Guard Active (trg_check_venue_conflict)</span>
              </div>
              <p className="text-muted leading-relaxed">
                The database automatically rejects overlapping approved events in the same venue, and ensures proposed event seat capacities cannot exceed venue physical capacity.
              </p>
            </div>

            {/* Venue Table */}
            <Table
              columns={[
                {
                  header: 'Venue',
                  key: 'name',
                  render: (venue) => (
                    <div>
                      <div className="font-bold text-ink">{venue.name}</div>
                      <div className="text-xs text-muted">{venue.building || 'Main Campus'}</div>
                    </div>
                  ),
                },
                {
                  header: 'Physical Capacity',
                  key: 'capacity',
                  render: (venue) => (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{venue.capacity}</span>
                      <span className="text-xs text-muted">seats max</span>
                    </div>
                  ),
                },
                {
                  header: 'Security Guard',
                  key: 'guard',
                  render: () => (
                    <Badge variant="success" size="sm" className="gap-1 text-xs">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Protected</span>
                    </Badge>
                  ),
                },
                {
                  header: 'Actions',
                  key: 'actions',
                  className: 'text-right',
                  render: (venue) => (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteVenue(venue)}
                      >
                        Delete Venue
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={venues}
              emptyTitle="No Venues Configured"
              emptyDescription="No campus auditoriums or halls configured yet."
            />
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

        {/* Photo Rejection Modal */}
        {reviewingPhoto && (
          <Modal
            isOpen={!!reviewingPhoto}
            onClose={() => setReviewingPhoto(null)}
            title="Reject Event Photo"
            description={`Provide a reason for rejecting this photo for "${reviewingPhoto.events?.title || 'Event'}".`}
          >
            <form onSubmit={handleRejectPhoto} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Rejection Reason (Optional feedback)
                </label>
                <Textarea
                  value={photoRejectReason}
                  onChange={(e) => setPhotoRejectReason(e.target.value)}
                  placeholder="e.g. Low resolution, unaligned aspect ratio, or contains non-event content."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewingPhoto(null)}
                  disabled={isDecidingPhoto}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={isDecidingPhoto}
                  icon={XCircle}
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </Modal>
        )}

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
                <label className="block text-xs font-semibold text-ink mb-1">
                  Venue Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Mechanical Seminar Hall"
                  className="w-full px-3 py-2 text-xs border border-line rounded-lg focus:outline-hidden focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Campus Building / Block
                </label>
                <input
                  type="text"
                  value={venueBuilding}
                  onChange={(e) => setVenueBuilding(e.target.value)}
                  placeholder="e.g. Mechanical Engineering Block - 2nd Floor"
                  className="w-full px-3 py-2 text-xs border border-line rounded-lg focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Maximum Seating Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={venueCapacity}
                  onChange={(e) => setVenueCapacity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-line rounded-lg focus:outline-hidden focus:border-primary font-mono"
                  required
                />
                <p className="text-xs text-muted mt-1">
                  Events cannot accept seat capacities higher than this venue limit.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
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
