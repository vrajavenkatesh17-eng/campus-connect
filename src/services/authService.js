import { supabase, isSupabaseConfigured } from './supabase';

export const authService = {
  /**
   * Initiates Google OAuth with hosted domain hint for student and coordinator portals.
   * @param {'student' | 'coordinator' | 'admin'} portalType
   */
  async signInWithGoogle(portalType = 'student') {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
    }

    // Store portal intent in sessionStorage for post-auth routing
    sessionStorage.setItem('fxec_auth_portal_intent', portalType);

    const queryParams = {
      prompt: 'select_account',
    };

    // Include hosted domain hint for student and coordinator portals
    if (portalType === 'student' || portalType === 'coordinator') {
      queryParams.hd = 'francisxavier.ac.in';
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams,
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Signs out the current user
   */
  async signOut() {
    if (!isSupabaseConfigured) return;
    sessionStorage.removeItem('fxec_auth_portal_intent');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Retrieves the active session
   */
  async getSession() {
    if (!isSupabaseConfigured) return null;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  /**
   * Subscribes to auth state changes
   */
  onAuthStateChange(callback) {
    if (!isSupabaseConfigured) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Client-side domain enforcement safeguard (Rule 3)
   * Signs out unauthorized users if an invalid domain somehow bypassed initial checks.
   * Permits official @francisxavier.ac.in accounts as well as authorized faculty coordinators and administrators.
   */
  async enforceClientDomainVerification(user, role) {
    if (!user || !user.email) return true;

    const email = user.email.toLowerCase().trim();
    const isFxecDomain = email.endsWith('@francisxavier.ac.in');
    const isPrivilegedRole = role === 'admin' || role === 'coordinator';

    if (!isFxecDomain && !isPrivilegedRole) {
      // Force sign out
      await this.signOut();
      throw new Error(
        'Access Denied: Only @francisxavier.ac.in accounts or authorized faculty and administrators are permitted.'
      );
    }
    return true;
  },
};
