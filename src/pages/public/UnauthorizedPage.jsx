/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card, { CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const { role } = useAuth();

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'coordinator') return '/coordinator';
    return '/student';
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <Card className="border-line shadow-xs">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-[20px] bg-danger/10 text-danger flex items-center justify-center mx-auto border border-danger/20 shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <Badge variant="danger" size="sm" className="uppercase tracking-widest font-bold">
                Restricted
              </Badge>
              <h1 className="text-2xl font-bold text-ink">Access Restricted</h1>
            </div>

            <p className="text-sm text-muted leading-relaxed">
              You do not have the required permissions to access this portal or resource. Every screen is strictly protected by database Row Level Security.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to={getDashboardPath()} className="w-full sm:w-auto">
                <Button variant="primary" icon={Home} className="w-full">
                  Go to My Portal
                </Button>
              </Link>
              <Link to="/" className="w-full sm:w-auto">
                <Button variant="secondary" icon={ArrowLeft} className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
