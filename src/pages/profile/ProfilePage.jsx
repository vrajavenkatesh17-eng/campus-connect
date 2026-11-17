import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import { User, Shield, Phone, Hash, Building2, CheckCircle2, AlertTriangle, Bug } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, role, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [year, setYear] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDepts, setIsLoadingDepts] = useState(true);

  // Security verification test state
  const [testResult, setTestResult] = useState(null);
  const [isTestingTamper, setIsTestingTamper] = useState(false);

  useEffect(() => {
    let isMounted = true;
    profileService.getDepartments()
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

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setDepartmentId(profile.department_id || '');
      setYear(profile.year ? profile.year.toString() : '');
      setRegisterNumber(profile.register_number || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await profileService.updateOwnProfile(user.id, {
        name,
        department_id: departmentId || null,
        year: year ? parseInt(year, 10) : null,
        register_number: registerNumber || null,
        phone: phone || null,
      }, role);

      await refreshProfile();
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error('Profile update error:', err);
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

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
        // If data unexpectedly succeeded (should not happen due to trigger)
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

  return (
    <DashboardLayout
      title="My Profile"
      subtitle="Manage your personal information and institutional department details"
    >
      <div className="space-y-8 max-w-3xl">
        {/* Profile Card */}
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal & Academic Details</CardTitle>
                  <CardDescription>
                    Official information associated with Francis Xavier Engineering College
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 font-medium">Assigned Role:</span>
                  <Badge variant={role || 'neutral'} size="lg" className="uppercase tracking-wider font-bold">
                    {role || 'Student'}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Email (Read Only) */}
              <Input
                label="College Email Address"
                value={user?.email || ''}
                disabled
                helperText="Email domain is linked to your institutional account and cannot be modified."
              />

              {/* Name */}
              <Input
                label="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your official full name"
                icon={User}
              />

              {/* Department */}
              {isLoadingDepts ? (
                <div className="flex items-center gap-2 text-sm text-neutral-500 py-2">
                  <Spinner size="sm" />
                  <span>Loading official college departments from database...</span>
                </div>
              ) : (
                <Select
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

              {/* Student Year & Register Number */}
              {role === 'student' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
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

              {/* Phone */}
              <Input
                label="Contact Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                icon={Phone}
              />
            </CardContent>

            <CardFooter className="flex justify-between items-center">
              <span className="text-xs text-neutral-500">
                All updates are validated by Postgres Row Level Security.
              </span>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Security Verification Panel */}
        <Card className="border-neutral-200">
          <CardHeader className="bg-neutral-50/70">
            <div className="flex items-center gap-2 text-neutral-900 font-semibold">
              <Shield className="w-5 h-5 text-burgundy" />
              <CardTitle>Role Immutability Verification (Security Rule 4)</CardTitle>
            </div>
            <CardDescription>
              Test the database server-side trigger <code className="bg-neutral-200 px-1 rounded text-xs font-mono">trg_prevent_role_tampering</code> by attempting a direct client-side privilege escalation to &quot;admin&quot;.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-neutral-600 leading-relaxed">
              In Campus Connect, client applications can never alter the <code className="font-mono font-semibold">role</code> column. Role elevation can only be executed by authorized administrators through a <code className="font-mono font-semibold">SECURITY DEFINER</code> RPC transaction.
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
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {testResult.status === 'BLOCKED' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Security Passed: Blocked by Database Trigger</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Security Failed!</span>
                    </>
                  )}
                </div>
                <p className="font-mono text-[11px] bg-white/70 p-2 rounded border border-current/20 break-all">
                  {testResult.message}
                </p>
                {testResult.details && (
                  <p className="text-[11px] opacity-80">{testResult.details}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
