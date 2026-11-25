/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Designed & built by Krish & Ihsan. All Rights Reserved.
 */

import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card, { CardContent } from '../../components/common/Card';
import AppButton from '../../components/app/AppButton';
import Badge from '../../components/common/Badge';
import { PageEnter } from '../../components/motion';
import { ShieldAlert, Home, LogOut } from 'lucide-react';

export default function ForbiddenPage() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();

  // If no user session exists, redirect immediately to /login with validated same-site return path
  if (!user) {
    const rawReturn = location.state?.from?.pathname || location.pathname;
    const safeReturn =
      typeof rawReturn === 'string' && rawReturn.startsWith('/') && !rawReturn.startsWith('//')
        ? rawReturn
        : '/';
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(safeReturn)}`} replace />;
  }

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'coordinator') return '/coordinator';
    return '/student';
  };

  return (
    <PageEnter className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <Card className="border-line shadow-xs">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-[20px] bg-danger/10 text-danger flex items-center justify-center mx-auto border border-danger/20 shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <Badge variant="danger" size="sm" className="uppercase tracking-widest font-bold">
                Error 403
              </Badge>
              <h1 className="text-2xl font-bold text-ink">Access Forbidden</h1>
            </div>

            <p className="text-sm text-muted leading-relaxed">
              You do not have the required institutional authorization to access this portal. All administrative and coordinator portals are strictly guarded by PostgreSQL server-side permissions.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to={getDashboardPath()} className="w-full sm:w-auto">
                <AppButton variant="primary" icon={Home} className="w-full">
                  Go to My Portal
                </AppButton>
              </Link>
              <AppButton variant="secondary" icon={LogOut} onClick={() => signOut()} className="w-full sm:w-auto">
                Sign Out
              </AppButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageEnter>
  );
}
