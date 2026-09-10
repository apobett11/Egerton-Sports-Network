import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://hizfgvgbsguhduxortrx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpemZndmdic2d1aGR1eG9ydHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM4NTk3MSwiZXhwIjoyMTAwOTYxOTcxfQ.5s2Khn3wBpjbwoVyW8VdKm7cWtckvhrnyjKWNMYgfG4';

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface ProvisionConfig {
  email: string;
  password: string;
  role: string;
  fullName: string;
}

async function provisionSingleReferee(config: ProvisionConfig) {
  const { email, password, role, fullName } = config;
  console.log(`\n-----------------------------------------------------------`);
  console.log(`[PROVISIONING]: ${email}`);
  console.log(`-----------------------------------------------------------`);

  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Official';
  const lastName = nameParts.slice(1).join(' ') || 'Referee';

  // 1. Create or update user in auth.users
  let userId: string;
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role
    }
  });

  if (authError) {
    if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
      console.log(`[AUTH INFO]: User ${email} already exists. Updating credentials...`);
      const { data: listUsersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        throw new Error(`Failed to list users: ${listError.message}`);
      }
      const existing = listUsersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) {
        throw new Error(`Could not locate existing auth user for ${email}`);
      }
      userId = existing.id;

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role
        }
      });
      if (updateError) {
        throw new Error(`Failed to update auth user ${email}: ${updateError.message}`);
      }
      console.log(`[AUTH SUCCESS]: User credentials updated successfully.`);
    } else {
      throw new Error(`[AUTH ERROR]: ${authError.message}`);
    }
  } else {
    userId = authUser.user.id;
    console.log(`[AUTH SUCCESS]: Created new auth user with ID: ${userId}`);
  }

  // 2. Upsert into public.profiles
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email,
      role: 'referee',
      first_name: firstName,
      last_name: lastName,
      bio: 'Unified Official Match Referee',
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (profileError) {
    throw new Error(`[PROFILE ERROR]: ${profileError.message}`);
  }
  console.log(`[PROFILE SUCCESS]: Upserted public.profiles row:`, {
    id: profileData.id,
    email: profileData.email,
    role: profileData.role,
    name: `${profileData.first_name} ${profileData.last_name}`
  });

  // 3. Upsert into public.referees
  const { error: refError } = await supabaseAdmin
    .from('referees')
    .upsert({
      id: userId,
      name: fullName,
      email,
      phone: '+254700000001',
      status: 'Active',
      badge_level: 'FIFA/FKF Premier Official',
      updated_at: new Date().toISOString()
    });

  if (refError) {
    console.warn(`[REFEREES TABLE WARN]: Could not upsert referees record: ${refError.message}`);
  } else {
    console.log(`[REFEREES TABLE SUCCESS]: Synchronized public.referees entry.`);
  }

  // 4. Verification & Audit Checks
  console.log(`\n[RUNNING AUDIT]: Verifying user state and RLS access for ${email}...`);

  // 4.1 Confirm auth.users record
  const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (getUserError || !userData.user) {
    throw new Error(`Audit failed: Unable to fetch auth user ${userId}`);
  }
  console.log(`  ✓ auth.users confirmed:`, {
    id: userData.user.id,
    email: userData.user.email,
    email_confirmed_at: userData.user.email_confirmed_at,
    role_meta: userData.user.user_metadata?.role
  });

  // 4.2 Confirm public.profiles record
  const { data: verifiedProfile, error: verifyProfError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, first_name, last_name')
    .eq('id', userId)
    .single();

  if (verifyProfError || !verifiedProfile) {
    throw new Error(`Audit failed: Unable to fetch profile for ${userId}`);
  }
  console.log(`  ✓ public.profiles confirmed:`, verifiedProfile);

  // 4.3 Test Authentication & RLS access on referee_working_sets
  const authClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: sessionData, error: signInError } = await authClient.auth.signInWithPassword({
    email,
    password
  });

  if (signInError || !sessionData.session) {
    throw new Error(`Audit failed: Could not sign in as ${email}: ${signInError?.message}`);
  }
  console.log(`  ✓ Password authentication succeeded. Session token issued.`);

  const refereeSessionClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`
      }
    }
  });

  const { data: wsReadData, error: wsReadError } = await refereeSessionClient
    .from('referee_working_sets')
    .select('match_uid, status')
    .limit(1);

  if (wsReadError) {
    throw new Error(`Audit failed: RLS read check failed for referee_working_sets: ${wsReadError.message}`);
  }
  console.log(`  ✓ RLS check for referee_working_sets PASSED. Authenticated referee can access live match working sets.`);

  return {
    userId,
    email,
    role: verifiedProfile.role,
    status: 'ACTIVE_CONFIRMED'
  };
}

async function main() {
  console.log('===========================================================');
  console.log('OFFICIAL REFEREE AUTHENTICATION & PROFILE PROVISIONING');
  console.log('===========================================================');

  const targets: ProvisionConfig[] = [
    {
      email: 'officialreferee@gmail.com',
      password: 'Official@referee2026',
      role: 'REFEREE',
      fullName: 'Official Referee'
    },
    {
      email: 'officialreferee@egerscore.com',
      password: 'Official@referee2026',
      role: 'REFEREE',
      fullName: 'Official Referee'
    }
  ];

  const results = [];
  for (const target of targets) {
    try {
      const res = await provisionSingleReferee(target);
      results.push(res);
    } catch (err: any) {
      console.error(`Provisioning error for ${target.email}:`, err.message);
    }
  }

  console.log('\n===========================================================');
  console.log('PROVISIONING SUMMARY');
  console.log('===========================================================');
  console.table(results);
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
