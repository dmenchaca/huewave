import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { getRedirectUrl } from '../utils/auth';

const DEMO_SUPABASE_URL = 'https://demo.supabase.co';
const DEMO_ANON_KEY = 'demo-key';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEMO_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEMO_ANON_KEY;

export const isSupabaseConfigured = !!(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY
) && (
  import.meta.env.VITE_SUPABASE_URL !== DEMO_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== DEMO_ANON_KEY
);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    redirectTo: getRedirectUrl()
  }
});