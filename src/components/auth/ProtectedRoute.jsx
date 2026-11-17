import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/Spinner';

export default function ProtectedRoute({ children, allowedRoles = [], requireCompleteProfile = true }) {
  const { user, role, isProfileComplete, isLoading, isConfigured } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 gap-4">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-neutral-600">Verifying institutional credentials...</p>
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
