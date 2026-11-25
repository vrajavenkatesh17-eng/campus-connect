/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://sbemlepidltxcjqqojyq.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZW1sZXBpZGx0eGNqcXFvanlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4MzkyOTQsImV4cCI6MjExMDQxNTI5NH0.XPqDNHnxCbzVeFqXQ4K8RRZgi4du0zFX5Um8_MkCFOI';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder-fxec') &&
    !supabaseAnonKey.includes('placeholder')
);

// Strict singleton Supabase client across HMR / StrictMode so storage keys never collide
const GLOBAL_KEY = '__cc_fxec_supabase_singleton__';

function getSupabaseSingleton() {
  if (typeof globalThis !== 'undefined' && globalThis[GLOBAL_KEY]) {
    return globalThis[GLOBAL_KEY];
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'cc-fxec-auth',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  if (typeof globalThis !== 'undefined') {
    globalThis[GLOBAL_KEY] = client;
  }

  return client;
}

export const supabase = getSupabaseSingleton();
