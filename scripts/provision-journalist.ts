import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://hizfgvgbsguhduxortrx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpemZndmdic2d1aGR1eG9ydHJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM4NTk3MSwiZXhwIjoyMTAwOTYxOTcxfQ.5s2Khn3wBpjbwoVyW8VdKm7cWtckvhrnyjKWNMYgfG4';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GQXQug1evzVkDsPxdYRobA_c7nCszDs';

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

async function provisionJournalist() {
  const email = 'journalist@gmail.com';
  const password = 'Journalist@2026!';
  const role = 'journalist';
  const fullName = 'Official Journalist';
  const firstName = 'Official';
  const lastName = 'Journalist';

  console.log('='.repeat(70));
  console.log(`[SEEDING]: ${email} with role '${role}'`);
  console.log('='.repeat(70));

  // 1. Create or update user in auth.users
  let userId: string;
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      role
    }
  });

  if (authError) {
    if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
      console.log(`[AUTH INFO]: User ${email} already exists. Locating ID and updating credentials...`);
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
          first_name: firstName,
          last_name: lastName,
          role
        }
      });
      if (updateError) {
        throw new Error(`Failed to update auth user ${email}: ${updateError.message}`);
      }
      console.log(`[AUTH SUCCESS]: Credentials and metadata updated for user ID: ${userId}`);
    } else {
      throw new Error(`[AUTH ERROR]: ${authError.message}`);
    }
  } else {
    userId = authUser.user.id;
    console.log(`[AUTH SUCCESS]: Created new auth user with ID: ${userId}`);
  }

  // 2. Upsert into public.profiles
  console.log(`[PROFILES]: Upserting public.profiles for ID: ${userId}...`);
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email,
      role: 'journalist',
      first_name: firstName,
      last_name: lastName,
      bio: 'Press Newsroom Official Journalist',
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (profileError) {
    throw new Error(`[PROFILE ERROR]: ${profileError.message}`);
  }
  console.log(`[PROFILE SUCCESS]: Upserted public.profiles row:`, profileData);

  // 3. Verification in auth.users
  console.log('\n-----------------------------------------------------------');
  console.log('[VERIFICATION 1]: Checking auth.users table...');
  const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (getUserError || !userData.user) {
    throw new Error(`Verification failed: Unable to fetch auth user ${userId}: ${getUserError?.message}`);
  }
  console.log(`  ✓ auth.users record verified:`);
  console.log(`    - ID: ${userData.user.id}`);
  console.log(`    - Email: ${userData.user.email}`);
  console.log(`    - Email Confirmed At: ${userData.user.email_confirmed_at}`);
  console.log(`    - Role in metadata: ${userData.user.user_metadata?.role}`);
  if (userData.user.user_metadata?.role !== 'journalist') {
    throw new Error(`Mismatch: auth.users role is ${userData.user.user_metadata?.role}, expected 'journalist'`);
  }

  // 4. Verification in public.profiles
  console.log('\n-----------------------------------------------------------');
  console.log('[VERIFICATION 2]: Checking public.profiles table...');
  const { data: verifiedProfile, error: verifyProfError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (verifyProfError || !verifiedProfile) {
    throw new Error(`Verification failed: Unable to fetch profile for ${userId}: ${verifyProfError?.message}`);
  }
  console.log(`  ✓ public.profiles record verified:`);
  console.log(`    - ID: ${verifiedProfile.id}`);
  console.log(`    - Email: ${verifiedProfile.email}`);
  console.log(`    - Role in profiles: ${verifiedProfile.role}`);
  console.log(`    - Name: ${verifiedProfile.first_name} ${verifiedProfile.last_name}`);
  if (verifiedProfile.role !== 'journalist') {
    throw new Error(`Mismatch: public.profiles role is ${verifiedProfile.role}, expected 'journalist'`);
  }

  // 5. Authentication Verification: Live login test with password
  console.log('\n-----------------------------------------------------------');
  console.log('[VERIFICATION 3]: Testing Live Password Authentication...');
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: sessionData, error: signInError } = await authClient.auth.signInWithPassword({
    email,
    password
  });

  if (signInError || !sessionData.session) {
    throw new Error(`Authentication failed: Could not sign in as ${email}: ${signInError?.message}`);
  }

  console.log(`  ✓ Live signInWithPassword SUCCEEDED!`);
  console.log(`    - Session user ID: ${sessionData.session.user.id}`);
  console.log(`    - Session email: ${sessionData.session.user.email}`);
  console.log(`    - User role: ${sessionData.session.user.user_metadata?.role}`);
  console.log(`    - Access token: ${sessionData.session.access_token.slice(0, 30)}... (valid JWT)`);

  // 6. Authenticated RLS Query Check using issued session token
  console.log('\n-----------------------------------------------------------');
  console.log('[VERIFICATION 4]: Authenticated RLS Query using session bearer token...');
  const authenticatedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`
      }
    }
  });

  const { data: authProfileData, error: authProfileError } = await authenticatedClient
    .from('profiles')
    .select('id, email, role, first_name, last_name')
    .eq('id', userId)
    .single();

  if (authProfileError || !authProfileData) {
    throw new Error(`Authenticated fetch failed: ${authProfileError?.message}`);
  }
  console.log(`  ✓ Authenticated query returned profile:`, authProfileData);

  console.log('\n' + '='.repeat(70));
  console.log('🎉 ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('='.repeat(70));
}

provisionJournalist().catch((err) => {
  console.error('\n❌ PROVISIONING / VERIFICATION FAILED:', err);
  process.exit(1);
});
