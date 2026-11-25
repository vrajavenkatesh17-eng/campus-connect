/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { profileService } from '../../services/profileService';
import {
  extractOAuthErrorFromUrl,
  mapOAuthErrorToFriendlyMessage,
  cleanOAuthErrorFromUrl,
} from '../../utils/oauthError';
import Spinner from '../../components/common/Spinner';
import AppButton from '../../components/app/AppButton';

function getSafeReturnPath(rawPath) {
  if (
    typeof rawPath === 'string' &&
    rawPath.startsWith('/') &&
    !rawPath.startsWith('//') &&
    !rawPath.startsWith('/auth/callback')
  ) {
    return rawPath;
  }
  return null;
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let subscription = null;

    async function routeForSession(session) {
      if (!isMounted || !session?.user) return;

      const email = session.user.email?.toLowerCase().trim() || '';
      const intent = sessionStorage.getItem('fxec_auth_portal_intent') || 'student';

      const profile = await profileService.getProfile(session.user.id);
      const role = profile?.role || 'student';
      const isComplete = profile?.is_profile_complete ?? false;

      // Domain check (without calling signOut or re-initializing client here)
      const isFxec = email.endsWith('@francisxavier.ac.in');
      const isPrivileged = role === 'admin' || role === 'coordinator';

      if (!isFxec && !isPrivileged) {
        if (isMounted) {
          setErrorMsg(
            'Access Denied: Only @francisxavier.ac.in accounts or authorized administrators are permitted.'
          );
        }
        return;
      }

      if (role === 'student' && !isComplete) {
        navigate('/profile/complete', { replace: true });
        return;
      }

      if (intent === 'coordinator' && role === 'student') {
        navigate('/coordinator/request', { replace: true });
        return;
      }

      const storedReturn = getSafeReturnPath(sessionStorage.getItem('fxec_auth_return_url'));
      if (storedReturn) {
        sessionStorage.removeItem('fxec_auth_return_url');
        navigate(storedReturn, { replace: true });
        return;
      }

      if (role === 'admin') navigate('/admin', { replace: true });
      else if (role === 'coordinator') navigate('/coordinator', { replace: true });
      else navigate('/student', { replace: true });
    }

    async function waitForSessionAndRedirect() {
      // 1. Check if the OAuth redirect itself carried an error
      const urlErr = extractOAuthErrorFromUrl();
      if (urlErr) {
        cleanOAuthErrorFromUrl();
        if (isMounted) {
          setErrorMsg(mapOAuthErrorToFriendlyMessage(urlErr));
        }
        return;
      }

      try {
        // 2. Check existing session first
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          await routeForSession(session);
          return;
        }

        // 3. Wait for Supabase detectSessionInUrl / PKCE exchange via auth state listener
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
            await routeForSession(newSession);
          }
        });
        subscription = authListener?.subscription || null;

        // Timeout fallback if no session arrives
        setTimeout(() => {
          if (isMounted) {
            navigate('/login', { replace: true });
          }
        }, 5500);
      } catch (err) {
        console.error('Auth callback error:', err);
        if (isMounted) {
          setErrorMsg('Sign-in could not be completed. Please try again.');
        }
      }
    }

    waitForSessionAndRedirect();

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, [navigate]);

  if (errorMsg) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full p-6 bg-danger/10 border border-danger/30 rounded-[20px] text-center space-y-4 shadow-xs">
          <p className="font-semibold text-danger text-sm leading-relaxed">{errorMsg}</p>
          <AppButton
            variant="primary"
            size="sm"
            onClick={() => navigate('/login', { replace: true })}
          >
            Try again
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-muted">Completing institutional sign in...</p>
    </div>
  );
}
