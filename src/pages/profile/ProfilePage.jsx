/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * S-J: Profile Digital ID Card powered by ReflectiveCard from React Bits.
 * Layout: Card left (sticky on desktop, max-h 80dvh, fixed aspect ratio 320/480,
 * cool steel in dark mode, silver-blue in light mode; WebGL fallback).
 * Form right: 4 clean sections (Personal, Academic, Account, Preferences).
 * Live debounced preview (150ms) and sticky mobile save bar.
 */

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import AppSelect from '../../components/app/AppSelect';
import AppSegmented from '../../components/app/AppSegmented';
import AppSwitch from '../../components/app/AppSwitch';
import {
  User,
  Shield,
  Phone,
  Hash,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Bug,
  Lock,
} from 'lucide-react';

// Lazy-load ReflectiveCard for code splitting
const ReflectiveCard = React.lazy(() => import('../../components/ui/ReflectiveCard'));

// Custom debouncing hook for live card preview responsiveness (150ms)
function useDebounce(value, delay = 150) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Convert academic year to Roman numeral (1 -> I, 2 -> II, 3 -> III, 4 -> IV, 5 -> V)
function toRomanYear(yr) {
  const map = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V' };
  return map[String(yr)] || yr || '';
}

// Detect WebGL support safely
function checkWebGLSupport() {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

// Skeleton fallback while ReflectiveCard bundle & WebGL shaders load
function ReflectiveCardSkeleton() {
  return (
    <div
      className="w-[320px] max-w-full aspect-[320/480] max-h-[80dvh] rounded-[24px] bg-surface-2 border border-line animate-pulse flex flex-col justify-between p-6 shadow-xl"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="h-6 w-20 bg-muted/20 rounded-full" />
        <div className="h-5 w-16 bg-muted/20 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="h-7 w-3/4 bg-muted/20 rounded-md" />
        <div className="h-4 w-1/2 bg-muted/20 rounded-md" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-line/40">
        <div className="space-y-1.5">
          <div className="h-3 w-16 bg-muted/20 rounded" />
          <div className="h-4 w-28 bg-muted/20 rounded" />
        </div>
        <div className="w-9 h-9 rounded-lg bg-muted/20" />
      </div>
    </div>
  );
}

// Flat card fallback when WebGL is unavailable or fails
function FlatCardFallback({ name, role, idLabel, idValue, isComplete, isDark }) {
  return (
    <div
      className={`w-[320px] max-w-full aspect-[320/480] max-h-[80dvh] rounded-[24px] p-6 flex flex-col justify-between border shadow-xl relative overflow-hidden select-none ${
        isDark
          ? 'bg-surface-2 border-primary/40 text-neutral-100 shadow-xl'
          : 'bg-surface border-line text-ink shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted">FXEC ID</span>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            isComplete
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          }`}
        >
          {isComplete ? 'Verified' : 'Draft'}
        </span>
      </div>

      <div className="space-y-1.5 my-auto">
        <h3 className="text-xl font-bold font-serif line-clamp-2 leading-snug">
          {name || 'Student Name'}
        </h3>
        <p className="text-xs text-muted font-medium line-clamp-1">{role}</p>
      </div>

      <div className="pt-4 border-t border-line/60 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase text-muted tracking-wider block font-medium">
            {idLabel}
          </span>
          <span className="text-sm font-mono font-bold tracking-tight">{idValue}</span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center text-muted border border-line/50">
          <Shield className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile, role, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [year, setYear] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDepts, setIsLoadingDepts] = useState(true);

  // Notifications preference
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      return localStorage.getItem('cc_event_reminders') !== 'false';
    } catch {
      return true;
    }
  });

  // WebGL support check
  const [hasWebGL, setHasWebGL] = useState(true);
  useEffect(() => {
    setHasWebGL(checkWebGLSupport());
  }, []);

  // Security verification test state
  const [testResult, setTestResult] = useState(null);
  const [isTestingTamper, setIsTestingTamper] = useState(false);

  // Fetch official college departments
  useEffect(() => {
    let isMounted = true;
    profileService
      .getDepartments()
      .then((data) => {
        if (isMounted) {
          setDepartments(data || []);
          setIsLoadingDepts(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load departments:', err);
        if (isMounted) setIsLoadingDepts(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state with authenticated user's profile
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setDepartmentId(profile.department_id || '');
      setYear(profile.year ? profile.year.toString() : '');
      setRegisterNumber(profile.register_number || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  // Debounced input values for 150ms live preview
  const debouncedName = useDebounce(name, 150);
  const debouncedDeptId = useDebounce(departmentId, 150);
  const debouncedYear = useDebounce(year, 150);
  const debouncedRegisterNumber = useDebounce(registerNumber, 150);

  // Determine if the profile has unsaved edits
  const hasUnsavedChanges = useMemo(() => {
    if (!profile) return false;
    return (
      name !== (profile.name || '') ||
      departmentId !== (profile.department_id || '') ||
      year !== (profile.year ? String(profile.year) : '') ||
      registerNumber !== (profile.register_number || '') ||
      phone !== (profile.phone || '')
    );
  }, [name, departmentId, year, registerNumber, phone, profile]);

  // Determine if the profile has all required fields completed
  const isProfileComplete = useMemo(() => {
    const trimmedName = debouncedName?.trim();
    if (!trimmedName) return false;

    if (role === 'student') {
      return Boolean(
        trimmedName &&
        debouncedDeptId &&
        debouncedYear &&
        debouncedRegisterNumber?.trim()
      );
    }
    if (role === 'coordinator') {
      return Boolean(trimmedName && debouncedDeptId);
    }
    // Admin only requires name
    return Boolean(trimmedName);
  }, [debouncedName, debouncedDeptId, debouncedYear, debouncedRegisterNumber, role]);

  // Resolve department code for display
  const currentDeptCode = useMemo(() => {
    const matched = departments.find((d) => d.id === debouncedDeptId);
    return matched?.code || profile?.departments?.code || '';
  }, [departments, debouncedDeptId, profile]);

  // Computed role display string
  const cardRoleString = useMemo(() => {
    if (role === 'student') {
      const parts = ['Student'];
      if (currentDeptCode) parts.push(currentDeptCode);
      if (debouncedYear) parts.push(`Year ${toRomanYear(debouncedYear)}`);
      return parts.join(' · ');
    }
    if (role === 'coordinator') {
      return currentDeptCode ? `Faculty Coordinator · ${currentDeptCode}` : 'Faculty Coordinator';
    }
    return 'Administrator';
  }, [role, currentDeptCode, debouncedYear]);

  // Computed ID label and value
  const cardIdLabel = useMemo(() => {
    if (role === 'student') return 'Register number';
    if (role === 'coordinator') return 'Department';
    return 'System Role';
  }, [role]);

  const cardIdValue = useMemo(() => {
    if (role === 'student') {
      return debouncedRegisterNumber?.trim() || 'Pending Registration';
    }
    if (role === 'coordinator') {
      return currentDeptCode || 'Department Assigned';
    }
    return 'Administrator';
  }, [role, debouncedRegisterNumber, currentDeptCode]);

  // Handle toggle notifications
  const handleToggleNotifications = (val) => {
    setNotificationsEnabled(val);
    try {
      localStorage.setItem('cc_event_reminders', String(val));
    } catch {
      // storage unavailable
    }
    showToast(`Event reminders ${val ? 'enabled' : 'muted'}.`, 'info');
  };

  // Handle form submission and save profile
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await profileService.updateOwnProfile(
        user.id,
        {
          name,
          department_id: departmentId || null,
          year: year ? parseInt(year, 10) : null,
          register_number: registerNumber || null,
          phone: phone || null,
        },
        role
      );

      await refreshProfile();
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error('Profile update error:', err);
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Security test: Role immutability verification
  const handleTestRoleTampering = async () => {
    if (!user?.id) return;
    setIsTestingTamper(true);
    setTestResult(null);

    try {
      const { data, error } = await profileService.attemptRoleTampering(user.id, 'admin');

      if (error) {
        setTestResult({
          status: 'BLOCKED',
          message: error.message || 'Database rejected direct role update.',
          details: error.details || error.hint || 'Server-side trigger/RLS enforced.',
        });
        showToast('Server blocked unauthorized role update (Expected Behavior)', 'info');
      } else {
        setTestResult({
          status: 'VULNERABLE',
          message: 'Warning: Role update succeeded. Check trigger deployment.',
        });
        showToast('Security Alert: Update allowed!', 'error');
      }
    } catch (err) {
      setTestResult({
        status: 'BLOCKED',
        message: err.message,
      });
    } finally {
      setIsTestingTamper(false);
    }
  };

  // Webcam error handler
  const handleWebcamError = useCallback(() => {
    // Silent fallback
  }, []);

  return (
    <DashboardLayout
      title="My Profile"
      subtitle="Manage your personal credentials, institutional department, and card pass"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-16 sm:pb-0">
        {/* Left Column: Digital ID Pass (Sticky on desktop, top of page on mobile) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center">
          <div className="sticky top-24 w-full flex flex-col items-center max-h-[80dvh]">
            <div className="w-full max-w-[320px] mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                Digital ID Pass
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  isProfileComplete ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                }`}
              >
                {isProfileComplete ? 'Active Pass' : 'Draft Setup'}
              </span>
            </div>

            {/* Fixed aspect ratio card container that never crops vertically */}
            <div className="relative w-full flex justify-center max-h-[80dvh] aspect-[320/480] max-w-[320px]">
              <Suspense fallback={<ReflectiveCardSkeleton />}>
                {hasWebGL ? (
                  <div
                    className={`w-full h-full transition-all duration-300 ${
                      !isProfileComplete
                        ? 'opacity-40 select-none pointer-events-none filter blur-[1px]'
                        : 'opacity-100'
                    }`}
                  >
                    <ReflectiveCard
                      name={debouncedName || 'Student Name'}
                      role={cardRoleString}
                      badge={isProfileComplete ? 'Verified' : 'Pending'}
                      status={isProfileComplete ? 'Active' : 'Inactive'}
                      statusColor={isProfileComplete ? 'rgb(var(--success))' : 'rgb(var(--muted))'}
                      idLabel={cardIdLabel}
                      idValue={cardIdValue}
                      theme={resolvedTheme || 'light'}
                      width={320}
                      height={480}
                      radius={24}
                      tint={
                        resolvedTheme === 'dark'
                          ? 'rgb(114, 47, 55) /* var(--primary) */'
                          : 'rgb(220, 224, 229) /* var(--surface-2) */'
                      }
                      metalness={1}
                      roughness={0.3}
                      blurStrength={6}
                      shine={1}
                      glare={0.5}
                      enableTilt={true}
                      tiltStrength={10}
                      intro={true}
                      webcam={false}
                      onWebcamError={handleWebcamError}
                    />
                  </div>
                ) : (
                  <FlatCardFallback
                    name={debouncedName}
                    role={cardRoleString}
                    idLabel={cardIdLabel}
                    idValue={cardIdValue}
                    isComplete={isProfileComplete}
                    isDark={resolvedTheme === 'dark'}
                  />
                )}
              </Suspense>

              {/* Incomplete Profile Overlay */}
              {!isProfileComplete && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-surface/80 backdrop-blur-[2px] rounded-[24px] border border-line/80 shadow-md pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center text-primary mb-3 shadow-xs">
                    <Lock className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-ink mb-1">Profile Incomplete</p>
                  <p className="text-xs text-muted max-w-[210px] leading-relaxed">
                    Complete your details on the right to activate your official ID pass.
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted text-center mt-3 max-w-[280px] leading-relaxed">
              Institutional digital identity pass for campus events, gate entry, and attendance scanning.
            </p>
          </div>
        </div>

        {/* Right Column: Profile Form in 4 Distinct Sections */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Personal Details */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4 border-b border-line">
                <CardTitle className="text-base font-bold text-ink">1. Personal Details</CardTitle>
                <CardDescription className="text-xs">
                  Your primary display name and official contact phone number
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-4 space-y-4">
                <Input
                  label="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your official full name"
                  icon={User}
                />
                <Input
                  label="Contact Phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  icon={Phone}
                />
              </CardContent>
            </Card>

            {/* 2. Academic Details */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4 border-b border-line">
                <CardTitle className="text-base font-bold text-ink">2. Academic Details</CardTitle>
                <CardDescription className="text-xs">
                  Institutional engineering branch, year of study, and register number
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-4 space-y-4">
                {isLoadingDepts ? (
                  <div className="flex items-center gap-2 text-xs text-muted py-2">
                    <Spinner size="sm" />
                    <span>Loading official college departments from database...</span>
                  </div>
                ) : (
                  <AppSelect
                    label="Department"
                    required
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    placeholder="Select your college department"
                    options={departments.map((d) => ({
                      value: d.id,
                      label: `${d.code} - ${d.name}`,
                    }))}
                  />
                )}

                {role === 'student' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AppSelect
                      label="Year of Study"
                      required
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="Select year"
                      options={[
                        { value: '1', label: '1st Year' },
                        { value: '2', label: '2nd Year' },
                        { value: '3', label: '3rd Year' },
                        { value: '4', label: '4th Year' },
                        { value: '5', label: '5th Year' },
                      ]}
                    />

                    <Input
                      label="College Register Number"
                      value={registerNumber}
                      onChange={(e) => setRegisterNumber(e.target.value)}
                      placeholder="e.g. 21IT045"
                      icon={Hash}
                      helperText="Required for certificates and official records."
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Account Details */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4 border-b border-line flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-ink">3. Account Details</CardTitle>
                  <CardDescription className="text-xs">
                    Institutional Google authentication and assigned role
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted font-medium">Assigned Role:</span>
                  <Badge variant={role || 'neutral'} size="lg" className="uppercase tracking-wider font-bold">
                    {role || 'Student'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-4 space-y-4">
                <Input
                  label="College Email Address"
                  value={user?.email || ''}
                  disabled
                  helperText="Email domain is linked to your institutional account and cannot be modified."
                  icon={Mail}
                />
              </CardContent>
            </Card>

            {/* 4. Preferences */}
            <Card className="p-6">
              <CardHeader className="p-0 pb-4 border-b border-line">
                <CardTitle className="text-base font-bold text-ink">4. Preferences</CardTitle>
                <CardDescription className="text-xs">
                  User interface appearance and notification alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-4 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-2">
                    Interface Theme
                  </label>
                  <AppSegmented
                    options={[
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                      { value: 'system', label: 'System' },
                    ]}
                    value={theme}
                    onChange={setTheme}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-line bg-surface-2/40">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-ink">Event Reminders & Updates</p>
                    <p className="text-xs text-muted">
                      Receive event notifications, schedule changes, and attendance alerts
                    </p>
                  </div>
                  <AppSwitch
                    checked={notificationsEnabled}
                    onChange={handleToggleNotifications}
                    aria-label="Event Reminders & Updates"
                  />
                </div>
              </CardContent>

              <CardFooter className="p-0 pt-4 mt-4 border-t border-line flex justify-between items-center">
                <span className="text-xs text-muted">
                  All updates are validated by Postgres Row Level Security.
                </span>
                <Button type="submit" variant="primary" isLoading={isLoading}>
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Security Verification Panel */}
          <Card className="border-line">
            <CardHeader className="bg-surface-2/70">
              <div className="flex items-center gap-2 text-ink font-semibold">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle>Role Immutability Verification (Security Rule 4)</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Test the database server-side trigger <code className="bg-surface-2 px-1 rounded text-xs font-mono text-ink">trg_prevent_role_tampering</code> by attempting a direct client-side privilege escalation to &quot;admin&quot;.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted leading-relaxed">
                In Campus Connect, client applications can never alter the <code className="font-mono font-semibold text-ink">role</code> column. Role elevation can only be executed by authorized administrators through a <code className="font-mono font-semibold text-ink">SECURITY DEFINER</code> RPC transaction.
              </p>

              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Bug}
                  onClick={handleTestRoleTampering}
                  isLoading={isTestingTamper}
                >
                  Simulate Direct Client Hack (Attempt Role: &quot;admin&quot;)
                </Button>
              </div>

              {testResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                    testResult.status === 'BLOCKED'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {testResult.status === 'BLOCKED' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Security Passed: Blocked by Database Trigger</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span>Security Failed!</span>
                      </>
                    )}
                  </div>
                  <p className="font-mono text-xs bg-surface p-2 rounded border border-current/20 break-all">
                    {testResult.message}
                  </p>
                  {testResult.details && (
                    <p className="text-xs opacity-80">{testResult.details}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Save Bar on Mobile (<768px) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-surface/95 backdrop-blur-md border-t border-line z-40 flex items-center justify-between shadow-lg">
        <span className="text-xs text-muted font-medium">
          {hasUnsavedChanges ? 'Unsaved profile edits' : 'Profile up to date'}
        </span>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          isLoading={isLoading}
          className="text-xs shadow-xs"
        >
          Save Changes
        </Button>
      </div>
    </DashboardLayout>
  );
}
