/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Phase 6: Institutional Pre-Authorized Allowlist Management
 * Allows admins to manage the admin and coordinator allowlists.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Select from '../common/Select';
import Spinner from '../common/Spinner';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import {
  Shield,
  UserCheck,
  Plus,
  Trash2,
  Mail,
  Building,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function AllowlistPanel() {
  const { showToast } = useToast();
  const [allowlists, setAllowlists] = useState({ admins: [], coordinators: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [roleType, setRoleType] = useState('coordinator'); // 'admin' | 'coordinator'
  const [email, setEmail] = useState('');
  const [deptCode, setDeptCode] = useState('CSE');
  const [notes, setNotes] = useState('');

  const fetchAllowlists = useCallback(async () => {
    try {
      const data = await adminService.getAllowlists();
      setAllowlists(data);
    } catch (err) {
      console.error('Failed to load allowlists:', err);
      showToast(err.message || 'Failed to load allowlists.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAllowlists();
  }, [fetchAllowlists]);

  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      showToast('Please provide a valid institutional email address.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.manageAllowlist({
        type: roleType,
        action: 'add',
        email: email.trim().toLowerCase(),
        notes: notes.trim() || `Pre-authorized ${roleType}`,
        deptCode: roleType === 'coordinator' ? deptCode : null,
      });

      showToast(`Email ${email.trim()} added to ${roleType} allowlist!`, 'success');
      setEmail('');
      setNotes('');
      fetchAllowlists();
    } catch (err) {
      console.error('Error adding to allowlist:', err);
      showToast(err.message || 'Failed to authorize email.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveEmail = async (type, targetEmail) => {
    if (!true /* confirmed */) {
      return;
    }

    try {
      await adminService.manageAllowlist({
        type,
        action: 'remove',
        email: targetEmail,
      });
      showToast(`Removed ${targetEmail} from ${type} allowlist.`, 'info');
      fetchAllowlists();
    } catch (err) {
      console.error('Error removing from allowlist:', err);
      showToast(err.message || 'Failed to remove email.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center gap-2">
        <Spinner size="md" />
        <p className="text-xs text-muted">Loading institutional allowlists...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pre-Authorization Form */}
      <Card className="p-5 border-line">
        <CardHeader className="p-0 pb-3 border-b border-line">
          <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <span>Pre-Authorize Institutional Email Address</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Users who register with pre-authorized emails are instantly assigned the approved role upon sign-in
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <form onSubmit={handleAddEmail} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Role Type</label>
              <Select
                value={roleType}
                onChange={(e) => setRoleType(e.target ? e.target.value : e)}
                className="w-full text-xs"
              >
                <option value="coordinator">Faculty Coordinator</option>
                <option value="admin">Institutional Administrator</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1">
                Institutional Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="faculty@francisxavier.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs border border-line rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-primary"
              />
            </div>

            {roleType === 'coordinator' && (
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Department</label>
                <Select
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target ? e.target.value : e)}
                  className="w-full text-xs font-mono"
                >
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="AI&DS">AI&DS</option>
                  <option value="CSBS">CSBS</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="MBA">MBA</option>
                  <option value="MCA">MCA</option>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Notes / Designation</label>
              <input
                type="text"
                placeholder="e.g. HOD CSE or Dean"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs border border-line rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                className="w-full text-xs"
              >
                Authorize
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Grid of Two Tables: Admins & Coordinators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Allowlist */}
        <Card className="p-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Admin Allowlist ({allowlists.admins.length})
              </h4>
            </div>
            <Badge variant="danger" size="sm" className="text-xs">Highest Authority</Badge>
          </div>

          <div className="pt-3 overflow-x-auto">
            {allowlists.admins.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">No admins registered in allowlist table.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-xs text-muted border-b border-line uppercase">
                  <tr>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Notes</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {allowlists.admins.map((adm) => (
                    <tr key={adm.email} className="hover:bg-surface-2/50">
                      <td className="py-2.5 font-semibold text-ink font-mono text-xs">
                        {adm.email}
                      </td>
                      <td className="py-2.5 text-muted text-xs truncate max-w-[120px]">
                        {adm.notes || '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveEmail('admin', adm.email)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Coordinator Allowlist */}
        <Card className="p-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Coordinator Allowlist ({allowlists.coordinators.length})
              </h4>
            </div>
            <Badge variant="info" size="sm" className="text-xs">Faculty Role</Badge>
          </div>

          <div className="pt-3 overflow-x-auto">
            {allowlists.coordinators.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">No coordinators in allowlist table.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-xs text-muted border-b border-line uppercase">
                  <tr>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Dept</th>
                    <th className="pb-2">Notes</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {allowlists.coordinators.map((coord) => (
                    <tr key={coord.email} className="hover:bg-surface-2/50">
                      <td className="py-2.5 font-semibold text-ink font-mono text-xs">
                        {coord.email}
                      </td>
                      <td className="py-2.5">
                        <Badge variant="outline" size="sm" className="text-xs font-mono">
                          {coord.department_code || '—'}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-muted text-xs truncate max-w-[120px]">
                        {coord.notes || '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveEmail('coordinator', coord.email)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
