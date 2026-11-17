import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Textarea from '../common/Textarea';
import { useToast } from '../../context/ToastContext';
import { attendanceService } from '../../services/attendanceService';
import { UserCheck, UserX, AlertCircle } from 'lucide-react';

export default function ManualAttendanceModal({
  isOpen,
  onClose,
  eventId,
  student,
  isCurrentlyAttended,
  onSuccess,
}) {
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Please provide an audit reason for this manual change.', 'error');
      return;
    }

    setIsSubmitting(true);
    const targetStatus = !isCurrentlyAttended;

    try {
      await attendanceService.manualMarkAttendance(
        eventId,
        student.id,
        targetStatus,
        reason.trim()
      );

      showToast(
        targetStatus
          ? `Marked attendance for ${student.name}.`
          : `Removed attendance for ${student.name}.`,
        'success'
      );
      setReason('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Manual attendance error:', err);
      showToast(err.message || 'Failed to update attendance.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!student) return null;

  const willMarkAttended = !isCurrentlyAttended;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setReason('');
        onClose();
      }}
      title={willMarkAttended ? 'Manual Attendance Override' : 'Revoke Attendance'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3.5 space-y-1">
          <div className="flex items-center gap-2">
            {willMarkAttended ? (
              <UserCheck className="w-5 h-5 text-emerald-600" />
            ) : (
              <UserX className="w-5 h-5 text-red-600" />
            )}
            <span className="text-sm font-bold text-neutral-900">{student.name}</span>
          </div>
          <p className="text-xs text-neutral-500">
            {student.register_number || 'No Reg No'} • {student.email}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 flex items-center justify-between">
            <span>Audit Justification (Required)</span>
            <span className="text-[10px] text-neutral-400">Recorded in activity logs</span>
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              willMarkAttended
                ? 'e.g. Student camera malfunctioned during QR scanning; confirmed seated in Hall A row 3.'
                : 'e.g. Marked in error or student left before session concluded.'
            }
            rows={3}
            required
            className="text-xs"
          />
        </div>

        <div className="rounded-md bg-amber-50 border border-amber-200 p-2.5 flex items-start gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            This action will be stamped with your account identity and timestamp in the permanent institutional audit ledger.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setReason('');
              onClose();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={willMarkAttended ? 'primary' : 'danger'}
            size="sm"
            isLoading={isSubmitting}
          >
            {willMarkAttended ? 'Confirm Attendance' : 'Confirm Revocation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
