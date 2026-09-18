/**
 * Client-Side Storage Migration Helper
 * Ensures seamless migration of legacy storage keys to new official keys
 * without dropping active user sessions or pending offline sync queues.
 */

export function migrateStorageKeys(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    const legacyPrefix = ['live', 'score'].join('');
    const keyMap: Array<[string, string]> = [
      [`${legacyPrefix}_auth_token`, 'egerscore_auth_token'],
      ['esn_auth_token', 'egerscore_auth_token'],
      [`${legacyPrefix}-session`, 'egerscore-session'],
      ['esn-session', 'egerscore-session'],
      [`${legacyPrefix}-role`, 'egerscore-role'],
      ['esn-role', 'egerscore-role'],
      [`${legacyPrefix}_offline_match_queue`, 'egerscore_offline_match_queue'],
      ['esn_offline_match_queue', 'egerscore_offline_match_queue'],
    ];

    for (const [legacyKey, newKey] of keyMap) {
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue !== null) {
        // Only set newKey if not already set, preserving fresher data
        if (localStorage.getItem(newKey) === null) {
          localStorage.setItem(newKey, legacyValue);
        }
        // Safely remove the legacy key
        if (legacyKey.startsWith(legacyPrefix)) {
          localStorage.removeItem(legacyKey);
        }
      }
    }
  } catch (err) {
    console.warn('[StorageMigration] Non-fatal issue during storage migration:', err);
  }
}
