import { createClient } from '@supabase/supabase-js';

// Since we lack the URL domain, we define a fallback or rely on the `.env` placeholder.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
