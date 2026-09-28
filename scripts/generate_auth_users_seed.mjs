import * as fs from 'fs';
import * as path from 'path';

const profiles = JSON.parse(fs.readFileSync('database_backup/data/profiles.json', 'utf-8'));

let sql = `-- ========================================================\n`;
sql += `-- EGERSCORE AUTH.USERS SEED SCRIPT\n`;
sql += `-- Populates auth.users matching public.profiles to prevent foreign key errors\n`;
sql += `-- Default password for seeded accounts: 'Password123!' (unless known specific seed)\n`;
sql += `-- ========================================================\n\n`;

sql += `DO $$\n`;
sql += `DECLARE\n`;
sql += `  v_default_pw TEXT;\n`;
sql += `BEGIN\n`;
sql += `  -- Generate bcrypt hash for 'Password123!'\n`;
sql += `  v_default_pw := extensions.crypt('Password123!', extensions.gen_salt('bf'));\n\n`;

for (const p of profiles) {
  const email = (p.email || `user_${p.id.slice(0, 8)}@egerton.ac.ke`).toLowerCase();
  const firstName = (p.first_name || '').replace(/'/g, "''");
  const lastName = (p.last_name || '').replace(/'/g, "''");
  const role = p.role || 'player';

  sql += `  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '${p.id}') THEN\n`;
  sql += `    INSERT INTO auth.users (\n`;
  sql += `      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,\n`;
  sql += `      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token\n`;
  sql += `    ) VALUES (\n`;
  sql += `      '00000000-0000-0000-0000-000000000000',\n`;
  sql += `      '${p.id}',\n`;
  sql += `      'authenticated',\n`;
  sql += `      'authenticated',\n`;
  sql += `      '${email}',\n`;
  sql += `      v_default_pw,\n`;
  sql += `      NOW(),\n`;
  sql += `      jsonb_build_object('provider', 'email', 'providers', json_build_array('email')),\n`;
  sql += `      jsonb_build_object('role', '${role}', 'first_name', '${firstName}', 'last_name', '${lastName}', 'email_verified', true),\n`;
  sql += `      '${p.created_at || new Date().toISOString()}',\n`;
  sql += `      '${p.updated_at || new Date().toISOString()}',\n`;
  sql += `      '', ''\n`;
  sql += `    );\n`;
  sql += `  END IF;\n\n`;
}

sql += `END $$;\n`;

fs.writeFileSync('database_backup/auth_users_seed.sql', sql, 'utf-8');
console.log('auth_users_seed.sql generated successfully for', profiles.length, 'users.');
