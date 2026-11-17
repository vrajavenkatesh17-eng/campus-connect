/**
 * ==============================================================================
 * CAMPUS CONNECT - GUEST LECTURE & EVENT MANAGEMENT SYSTEM
 * ------------------------------------------------------------------------------
 * Patented & Engineered by: Krishna Raja V (Krish)
 * Author Contact: v.rajavenkatesh17@gmail.com
 * Institution: Francis Xavier Engineering College (FXEC)
 * Intellectual Property Protection: KRISH-FXEC-PATENT-2026-CC-AUTH
 * All Rights Reserved. Unauthorized copying or redistribution is prohibited.
 * ==============================================================================
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sbemlepidltxcjqqojyq.supabase.co/rest/v1/';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZW1sZXBpZGx0eGNqcXFvanlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4MzkyOTQsImV4cCI6MjExMDQxNTI5NH0.XPqDNHnxCbzVeFqXQ4K8RRZgi4du0zFX5Um8_MkCFOI';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder-fxec') &&
  !supabaseAnonKey.includes('placeholder')
);

// Fallback to avoid crash during initial development/setup before credentials are added
export const supabase = createClient(
  supabaseUrl || 'https://sbemlepidltxcjqqojyq.supabase.co/rest/v1/',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZW1sZXBpZGx0eGNqcXFvanlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4MzkyOTQsImV4cCI6MjExMDQxNTI5NH0.XPqDNHnxCbzVeFqXQ4K8RRZgi4du0zFX5Um8_MkCFOI',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
