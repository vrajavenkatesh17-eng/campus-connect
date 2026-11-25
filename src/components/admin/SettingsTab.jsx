/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Phase 6: Institutional Platform Settings Component
 * Configures per-event points cap, certificate feedback requirement, and department allowlist.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import AppSwitch from '../app/AppSwitch';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import {
  Sliders,
  Award,
  FileCheck2,
  Building2,
  Save,
  Plus,
  X,
  ShieldCheck,
  RefreshCw,
  Mail,
} from 'lucide-react';

const DEFAULT_DEPARTMENTS = ['CSE', 'IT', 'AI&DS', 'CSBS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'MCA'];

export default function SettingsTab() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings State
  const [pointsCap, setPointsCap] = useState(100);
  const [certRequiresFeedback, setCertRequiresFeedback] = useState(true);
  const [allowedEmailDomain, setAllowedEmailDomain] = useState('@francisxavier.ac.in');
  const [departmentsList, setDepartmentsList] = useState(DEFAULT_DEPARTMENTS);
  const [newDeptInput, setNewDeptInput] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const settings = await adminService.getAppSettings();
      if (settings.points_per_event_cap !== undefined) {
        setPointsCap(Number(settings.points_per_event_cap));
      }
      if (settings.certificate_requires_feedback !== undefined) {
        setCertRequiresFeedback(Boolean(settings.certificate_requires_feedback));
      }
      if (settings.allowed_email_domain !== undefined) {
        setAllowedEmailDomain(String(settings.allowed_email_domain));
      }
      if (settings.departments_list && Array.isArray(settings.departments_list)) {
        setDepartmentsList(settings.departments_list);
      }
    } catch (err) {
      console.error('Failed to load platform settings:', err);
      showToast(err.message || 'Failed to load platform settings.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleAddDepartment = (e) => {
    e.preventDefault();
    const cleanDept = newDeptInput.trim().toUpperCase();
    if (!cleanDept) return;
    if (departmentsList.includes(cleanDept)) {
      showToast(`Department "${cleanDept}" is already in the active list.`, 'warning');
      return;
    }
    setDepartmentsList([...departmentsList, cleanDept]);
    setNewDeptInput('');
  };

  const handleRemoveDepartment = (deptCode) => {
    if (departmentsList.length <= 1) {
      showToast('At least one department must remain active.', 'warning');
      return;
    }
    setDepartmentsList(departmentsList.filter((d) => d !== deptCode));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (pointsCap <= 0) {
      showToast('Points cap must be greater than zero.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      await adminService.updateSettings({
        pointsCap,
        certRequiresFeedback,
        departmentsList,
        allowedEmailDomain,
      });
      showToast('Institutional platform settings updated successfully!', 'success');
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast(err.message || 'Failed to save settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-medium text-muted">Loading platform settings from PostgreSQL app_settings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveSettings} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <h3 className="text-lg font-bold text-ink flex items-center gap-2">
            <span>Institutional Platform Settings</span>
            <Badge variant="outline" size="sm" className="gap-1 text-xs bg-surface-2">
              <ShieldCheck className="w-3 h-3 text-primary" /> app_settings
            </Badge>
          </h3>
          <p className="text-xs text-muted">
            System-wide business rules stored in PostgreSQL app_settings and enforced by server-side RPC functions
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          icon={Save}
          isLoading={isSaving}
          className="text-xs gap-1.5 self-start sm:self-auto"
        >
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Points Cap Setting */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-3 border-b border-line flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-ink">Per-Event Points Cap</CardTitle>
              <CardDescription className="text-xs">
                Maximum interaction points a faculty coordinator can award to a single student per event
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Points Ceiling (per Student per Session)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="500"
                  step="5"
                  value={pointsCap}
                  onChange={(e) => setPointsCap(Number(e.target.value))}
                  className="w-32 px-3 py-2 text-sm font-bold font-mono border border-line rounded-lg focus:outline-hidden focus:border-burgundy"
                  required
                />
                <span className="text-xs text-muted">points</span>
              </div>
              <p className="text-xs text-muted mt-2">
                Enforced on the PostgreSQL server in the <code className="text-primary">award_points()</code> RPC function.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Certificate Eligibility Feedback Requirement */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-3 border-b border-line flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-ink">Certificate Feedback Gate</CardTitle>
              <CardDescription className="text-xs">
                Require student feedback submission before issuing official participation certificate
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-4 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-line bg-surface-2/50">
              <div>
                <p className="text-xs font-semibold text-ink">Mandatory Feedback Submission</p>
                <p className="text-xs text-muted">
                  {certRequiresFeedback
                    ? 'Students MUST submit an anonymous rating before claiming their certificate.'
                    : 'Students can claim certificate immediately after verified attendance.'}
                </p>
              </div>
              <AppSwitch
                checked={certRequiresFeedback}
                onChange={setCertRequiresFeedback}
                aria-label="Mandatory Feedback Submission"
              />
            </div>
            <p className="text-xs text-muted">
              Enforced server-side in the <code className="text-primary">issue_certificate()</code> RPC function.
            </p>
          </CardContent>
        </Card>

        {/* 3. Allowed Email Domain */}
        <Card className="p-5 md:col-span-2">
          <CardHeader className="p-0 pb-3 border-b border-line flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-ink">Institutional Email Domain Allowlist</CardTitle>
              <CardDescription className="text-xs">
                Restricts student and coordinator self-registration to verified college Google accounts
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Authorized Domain Suffix
              </label>
              <div className="flex items-center gap-2 max-w-sm">
                <input
                  type="text"
                  value={allowedEmailDomain}
                  onChange={(e) => setAllowedEmailDomain(e.target.value.trim())}
                  placeholder="@francisxavier.ac.in"
                  className="flex-1 px-3 py-2 text-sm font-mono border border-line rounded-lg focus:outline-hidden focus:border-burgundy bg-surface"
                  required
                />
              </div>
              <p className="text-xs text-muted mt-2">
                Accounts ending with this domain are automatically validated during OAuth sign-in.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. College Departments Allowlist */}
      <Card className="p-5">
        <CardHeader className="p-0 pb-3 border-b border-line flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface-2 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-ink">
              Institutional Department Configuration ({departmentsList.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Active engineering and management branches recognized across student registration, profiles, and analytics
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-4 space-y-4">
          {/* Active Tags */}
          <div className="flex flex-wrap gap-2">
            {departmentsList.map((dept) => (
              <span
                key={dept}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-surface-2 text-ink border border-line"
              >
                <span>{dept}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDepartment(dept)}
                  className="p-0.5 text-muted hover:text-red-600 transition-colors"
                  title={`Remove ${dept}`}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </span>
            ))}
          </div>

          {/* Add Department Input */}
          <div className="flex items-center gap-2 max-w-sm pt-2">
            <input
              type="text"
              placeholder="e.g. CYBER or ROBOTICS"
              value={newDeptInput}
              onChange={(e) => setNewDeptInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs font-mono uppercase border border-line rounded-lg focus:outline-hidden focus:border-burgundy"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleAddDepartment}
              className="text-xs"
            >
              Add Branch
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
