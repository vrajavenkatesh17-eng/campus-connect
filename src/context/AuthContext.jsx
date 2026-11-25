import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const data = await profileService.getProfile(userId);
      setProfile(data);
      if (data?.full_name) {
        try {
          const firstName = data.full_name.trim().split(' ')[0];
          if (firstName) localStorage.setItem('fxec_user_first_name', firstName);
        } catch (e) {}
      }
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      return await fetchProfile(user.id);
    }
    return null;
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Check active session on initial load
    authService.getSession().then(async (session) => {
      if (!isMounted) return;

      if (session?.user) {
        setUser(session.user);
        const userProfile = await fetchProfile(session.user.id);

        // Client-side domain check (Rule 3)
        try {
          await authService.enforceClientDomainVerification(session.user, userProfile?.role);
        } catch (domainErr) {
          if (isMounted) {
            setUser(null);
            setProfile(null);
            setAuthError(domainErr.message);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    }).catch((err) => {
      console.error('Session retrieval failed:', err);
      if (isMounted) setIsLoading(false);
    });

    // Subscribe to auth state updates
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        setUser(session.user);
        const userProfile = await fetchProfile(session.user.id);

        try {
          await authService.enforceClientDomainVerification(session.user, userProfile?.role);
        } catch (domainErr) {
          if (isMounted) {
            setUser(null);
            setProfile(null);
            setAuthError(domainErr.message);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);
      setProfile(null);
      setAuthError(null);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const role = profile?.role || null;
  const isProfileComplete = profile?.is_profile_complete ?? false;

  const value = {
    user,
    profile,
    role,
    isProfileComplete,
    isLoading,
    authError,
    setAuthError,
    isConfigured: isSupabaseConfigured,
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
