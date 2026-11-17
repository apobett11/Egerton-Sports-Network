import { supabase } from '../supabase';

// Use standard authenticated client respecting Row-Level Security (RLS)
// Service role key is never bundled into client applications.
export const supabaseBanterAdmin = supabase;

export { supabase };
