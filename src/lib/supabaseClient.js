import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite env or user localStorage configuration
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('sasyathra_supabase_url') : null;
const storedAnonKey = typeof window !== 'undefined' ? localStorage.getItem('sasyathra_supabase_anon_key') : null;

export const supabaseUrl = storedUrl || envUrl || '';
export const supabaseAnonKey = storedAnonKey || envAnonKey || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseAnonKey.includes('your-anon-public-key')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

export function saveSupabaseCredentials(url, key) {
  if (url && key) {
    localStorage.setItem('sasyathra_supabase_url', url.trim());
    localStorage.setItem('sasyathra_supabase_anon_key', key.trim());
  } else {
    localStorage.removeItem('sasyathra_supabase_url');
    localStorage.removeItem('sasyathra_supabase_anon_key');
  }
  window.location.reload();
}
