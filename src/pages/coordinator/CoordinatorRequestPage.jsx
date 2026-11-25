import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import { UserCheck, Clock, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

export default function CoordinatorRequestPage() {
  const { user, profile, role, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [existingRequest, setExistingRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [departmentId, setDepartmentId] = useState('');
  const [designation, setDesignation] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (role === 'coordinator') {
      navigate('/coordinator', { replace: true });
      return;
    }

    let isMounted = true;
    async function init() {
      try {
        const [depts, req] = await Promise.all([
          profileService.getDepartments(),
          user?.id ? profileService.getMyCoordinatorRequest(user.id) : null,
        ]);

        if (isMounted) {
          setDepartments(depts || []);
          setExistingRequest(req);
          if (profile?.department_id) setDepartmentId(profile.department_id);
        }
      } catch (err) {
        console.error('Failed to initialize coordinator request:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    init();
    return () => { isMounted = false; };
  }, [user, role, profile, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!departmentId || !designation.trim() || !reason.trim()) {
      showToast('Please fill all required fields.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await profileService.submitCoordinatorRequest({
        department_id: departmentId,
        designation: designation.trim(),
        reason: reason.trim(),
      });

      setExistingRequest(created);
      showToast('Coordinator request submitted for administrator review.', 'success');
    } catch (err) {
      console.error('Submission failed:', err);
      showToast(err.message || 'Failed to submit request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-2">
        <Spinner size="lg" />
        <p className="text-sm text-muted font-medium">Checking authorization status...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
          <UserCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Faculty Coordinator Authorization
        </h1>
        <p className="text-sm text-muted">
          Francis Xavier Engineering College
        </p>
      </div>

      {/* Pending Status Alert */}
      {existingRequest?.status === 'pending' && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Application Under Administrator Review</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Your coordinator authorization request submitted on{' '}
              <span className="font-semibold">
                {new Date(existingRequest.created_at).toLocaleDateString()}
              </span>{' '}
              is currently awaiting approval from the system administrator.
            </p>
            <div className="bg-white p-3 rounded-lg border border-amber-200 text-xs text-ink space-y-1">
              <p><span className="font-semibold">Designation:</span> {existingRequest.designation}</p>
              <p><span className="font-semibold">Department:</span> {existingRequest.departments?.name}</p>
              <p><span className="font-semibold">Reason:</span> {existingRequest.reason}</p>
            </div>
            <p className="text-xs text-muted">
              Per Rule 4 & 5, coordinator privileges cannot be self-assigned and must be granted through an administrator review.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Rejected Status Alert */}
      {existingRequest?.status === 'rejected' && (
        <Card className="border-red-300 bg-red-50/50">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-red-800 font-bold">
              <XCircle className="w-5 h-5 text-red-600" />
              <span>Application Not Approved</span>
            </div>
            <p className="text-xs text-red-900 leading-relaxed">
              {existingRequest.rejection_reason || 'Your previous coordinator request was not approved by administration.'}
            </p>
            <p className="text-xs text-muted font-medium">
              You may submit a revised application below if needed.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Request Form (show if no request or previous was rejected) */}
      {(!existingRequest || existingRequest.status === 'rejected') && (
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Submit Coordinator Credentials</CardTitle>
              <CardDescription>
                Faculty members can request event creation and attendance management permissions.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-surface-2 p-3 rounded-lg border border-line text-xs text-muted flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  All requests are recorded in the <code className="font-mono">coordinator_requests</code> ledger and require administrator confirmation via atomic PostgreSQL function.
                </span>
              </div>

              <Select
                label="Academic Department"
                required
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                placeholder="Select your department"
                options={departments.map((d) => ({
                  value: d.id,
                  label: `${d.code} - ${d.name}`,
                }))}
              />

              <Input
                label="Academic Designation"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Assistant Professor, Associate Professor"
              />

              <Textarea
                label="Purpose / Event In-Charge Details"
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly state your department role or guest lecture series responsibilities..."
                helperText="Provide institutional context to assist administrator review."
              />
            </CardContent>

            <CardFooter className="flex justify-end gap-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
              >
                Submit Authorization Request
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
