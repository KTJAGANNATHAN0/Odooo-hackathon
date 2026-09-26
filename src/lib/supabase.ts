import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite environment variables or localStorage override for instant testing
const getEnv = (key: string): string => {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(`IMS_${key}`);
    if (local) return local;
  }
  const val = (import.meta.env[key] as string) || '';
  if (val) return val;
  if (key === 'VITE_SUPABASE_URL') {
    return (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) || '';
  }
  if (key === 'VITE_SUPABASE_ANON_KEY') {
    return (
      (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string) ||
      (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
      ''
    );
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

/**
 * Validates whether valid Supabase credentials have been configured
 */
export const isSupabaseConfigured = (): boolean => {
  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  return Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    key.length > 20 &&
    !url.includes('placeholder')
  );
};

/**
 * Save credentials dynamically from UI (useful during demo / hackathon presentation)
 */
export const saveSupabaseCredentials = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('IMS_VITE_SUPABASE_URL', url.trim());
    localStorage.setItem('IMS_VITE_SUPABASE_ANON_KEY', anonKey.trim());
    window.location.reload();
  }
};

/**
 * Remove saved Supabase credentials to revert to offline demo mode
 */
export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('IMS_VITE_SUPABASE_URL');
    localStorage.removeItem('IMS_VITE_SUPABASE_ANON_KEY');
    window.location.reload();
  }
};

/**
 * Official Supabase Client instance configured according to latest v2 documentation
 */
export const supabase = createClient(
  supabaseUrl && supabaseUrl.startsWith('https://') ? supabaseUrl : 'https://demo-odoo-ims.supabase.co',
  supabaseAnonKey || 'demo-anon-key-placeholder-3849203849023849023849',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
