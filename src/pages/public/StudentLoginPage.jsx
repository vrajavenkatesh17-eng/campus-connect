/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { GraduationCap, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function StudentLoginPage() {
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && role) {
      if (role === 'student') navigate('/student', { replace: true });
      else if (role === 'coordinator') navigate('/coordinator', { replace: true });
      else if (role === 'admin') navigate('/admin', { replace: true });
    }
  }, [user, role, navigate]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await authService.signInWithGoogle('student');
    } catch (err) {
      console.error('Sign in error:', err);
      showToast(err.message || 'Failed to initiate Google sign in.', 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-[20px] bg-primary text-on-primary flex items-center justify-center mx-auto shadow-sm">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="inline-block">
            <Badge variant="student" size="sm" className="uppercase tracking-wider font-semibold">
              Student Portal
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Student Sign In
          </h1>
          <p className="text-sm text-muted">
            Francis Xavier Engineering College
          </p>
        </div>

        <Card className="border-line shadow-xs">
          <CardHeader>
            <CardTitle>Institutional Student Access</CardTitle>
            <CardDescription>
              Log in to register for upcoming guest lectures, scan attendance, and earn recognition.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-[12px] bg-primary-soft border border-primary/20 p-3.5 space-y-1.5 text-xs text-ink">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
                <span>Domain Verification Policy</span>
              </div>
              <p className="text-muted leading-relaxed">
                You must sign in using your official Francis Xavier student Google account ending with <span className="font-bold text-ink">@francisxavier.ac.in</span>.
              </p>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-line rounded-[12px] text-sm font-semibold text-ink bg-surface hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isLoading ? 'Connecting to Google...' : 'Continue with Student Google ID'}</span>
            </Button>

            <div className="pt-4 border-t border-line flex flex-col gap-2 text-xs text-muted text-center">
              <div>
                Are you a faculty event organizer?{' '}
                <Link to="/login/coordinator" className="text-primary font-semibold hover:underline">
                  Coordinator Portal &rarr;
                </Link>
              </div>
              <div>
                System Administrator?{' '}
                <Link to="/login/admin" className="text-primary font-semibold hover:underline">
                  Admin Portal &rarr;
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Portal Directory</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
