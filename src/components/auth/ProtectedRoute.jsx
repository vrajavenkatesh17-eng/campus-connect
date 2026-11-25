import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/Spinner';
import { ShieldAlert, LogOut } from 'lucide-react';
import Button from '../common/Button';

export default function ProtectedRoute({ children, allowedRoles = [], requireCompleteProfile = true }) {
  const { user, profile, role, isProfileComplete, isLoading, isConfigured, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-2 gap-4">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-muted">Verifying institutional credentials...</p>
      </div>
    );
  }

  if (!isConfigured) {
    return <>{children}</>;
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Deactivated user check (Phase 6: immediate access loss)
  if (profile && profile.is_active === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-2 px-4 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">Institutional Account Deactivated</h1>
        <p className="text-sm text-muted max-w-md mb-6 leading-relaxed">
          Your Campus Connect profile has been deactivated by an administrator. All database queries, attendance actions, and event registrations have been revoked immediately.
        </p>
        <div className="p-3 bg-surface-2 rounded-lg text-xs font-mono text-muted mb-6">
          Account ID: {user.id} • Registered Email: {user.email}
        </div>
        <Button
          variant="primary"
          icon={LogOut}
          onClick={signOut}
          className="gap-2"
        >
          Sign Out of FXEC Portal
        </Button>
      </div>
    );
  }

  // Student mandatory profile completion check (Requirement 8)
  if (
    role === 'student' &&
    requireCompleteProfile &&
    !isProfileComplete &&
    location.pathname !== '/profile/complete'
  ) {
    return <Navigate to="/profile/complete" replace />;
  }

  // Role check -> 403 Forbidden
  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
