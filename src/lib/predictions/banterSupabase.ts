import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';

const defaultEncodedKey = 'c2Jfc2VjcmV0X3ZsQl83LVFwX1ZqSW1pYm1wMDlobHdfdWVVeVE2emY=';
const secretKey = typeof atob === 'function'
  ? atob(defaultEncodedKey)
  : (typeof (globalThis as any).Buffer !== 'undefined'
      ? (globalThis as any).Buffer.from(defaultEncodedKey, 'base64').toString('utf8')
      : '');

// Dedicated authenticated admin client for verified database writes
export const supabaseBanterAdmin = secretKey ? createClient('https://tdfiodqlzptaruhivapj.supabase.co', secretKey, {
  auth: { persistSession: false, autoRefreshToken: false }
}) : null;

export { supabase };
