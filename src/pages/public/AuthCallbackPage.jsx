import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { profileService } from '../../services/profileService';
import Spinner from '../../components/common/Spinner';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!session?.user) {
          navigate('/login', { replace: true });
          return;
        }

        const email = session.user.email?.toLowerCase().trim() || '';
        const intent = sessionStorage.getItem('fxec_auth_portal_intent') || 'student';

        // Check profile
        const profile = await profileService.getProfile(session.user.id);
        const role = profile?.role || 'student';
        const isComplete = profile?.is_profile_complete ?? false;

        // Domain validation check
        const isFxec = email.endsWith('@francisxavier.ac.in');
        const isAdmin = role === 'admin';

        if (!isFxec && !isAdmin) {
          await supabase.auth.signOut();
          if (isMounted) {
            setErrorMsg('Access Denied: Only @francisxavier.ac.in accounts or authorized administrators are permitted.');
          }
          return;
        }

        // Student with incomplete profile
        if (role === 'student' && !isComplete) {
          navigate('/profile/complete', { replace: true });
          return;
        }

        // Coordinator intent but student role -> route to coordinator request screen
        if (intent === 'coordinator' && role === 'student') {
          navigate('/coordinator/request', { replace: true });
          return;
        }

        // Route to respective role portal
        if (role === 'admin') navigate('/admin', { replace: true });
        else if (role === 'coordinator') navigate('/coordinator', { replace: true });
        else navigate('/student', { replace: true });

      } catch (err) {
        console.error('Auth callback error:', err);
        if (isMounted) setErrorMsg(err.message || 'Authentication failed.');
      }
    }

    handleAuth();
    return () => { isMounted = false; };
  }, [navigate]);

  if (errorMsg) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
          <p className="font-semibold text-red-800 text-sm">{errorMsg}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="text-xs font-semibold text-burgundy underline"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-neutral-600">Completing institutional sign in...</p>
    </div>
  );
}
