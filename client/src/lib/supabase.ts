import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Provide better error message in development
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  
  const errorMsg = `Missing Supabase environment variables: ${missing.join(', ')}. ` +
    `Please set these in your GitHub Secrets (Settings > Secrets and variables > Actions) or in your .env.local file.`;
  
  console.error('❌', errorMsg);
  console.error('Current env values:', {
    VITE_SUPABASE_URL: supabaseUrl ? '✅ Set' : '❌ Missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '✅ Set' : '❌ Missing'
  });
  
  throw new Error(errorMsg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
