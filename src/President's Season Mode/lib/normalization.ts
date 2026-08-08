import type { TeamNormalizationResult } from '../types/seasonMode';

/**
 * Normalizes team names into canonical professional display format and comparison keys.
 * 
 * Process:
 * 1. Trim leading/trailing whitespace.
 * 2. Collapse internal whitespace.
 * 3. Remove duplicate or trailing FC / F.C. / Fc suffixes.
 * 4. Apply title casing to base words while preserving brand acronyms.
 * 5. Append exactly one "FC" suffix.
 * 6. Generate canonical comparison key (lowercase, alphanumeric + fc) for duplicate checks.
 */
export function normalizeTeamName(rawInput: string): TeamNormalizationResult {
  const changes: string[] = [];
  const trimmed = rawInput.trim().replace(/\s+/g, ' ');

  if (trimmed !== rawInput) {
    changes.push('Trimmed extra whitespace');
  }

  // Strip all trailing variations of FC / F.C. / Fc / Football Club
  let baseName = trimmed;
  const fcPattern = /\b(fc|f\.c\.|football club)\b$/gi;

  let hadFc = false;
  while (fcPattern.test(baseName)) {
    hadFc = true;
    baseName = baseName.replace(fcPattern, '').trim();
  }

  // Also handle cases like "eaglesfc" where "fc" is attached without space at the end
  if (!hadFc && baseName.length > 3 && baseName.toLowerCase().endsWith('fc')) {
    hadFc = true;
    baseName = baseName.slice(0, -2).trim();
    changes.push('Separated attached "fc" suffix');
  }

  if (hadFc) {
    changes.push('Removed existing FC suffix for re-standardization');
  }

  // Format base words: Title Case for normal words, uppercase for short acronyms (e.g. FOA, FOS)
  const words = baseName.split(' ').map((word) => {
    if (!word) return '';
    // If word is already all caps and 2-4 chars (like FOA, FOS, NJR), preserve acronym
    if (word === word.toUpperCase() && word.length >= 2 && word.length <= 4) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  const formattedBase = words.join(' ');
  const canonicalDisplayName = `${formattedBase} FC`;

  // Canonical comparison key for duplicate detection: lowercase base + "fc" without spaces
  const normalizedComparisonKey = `${formattedBase.toLowerCase().replace(/[^a-z0-9]/g, '')}fc`;

  return {
    raw_input: rawInput,
    canonical_display_name: canonicalDisplayName,
    normalized_comparison_key: normalizedComparisonKey,
    has_fc_suffix: true,
    changes_made: changes,
  };
}

/**
 * Checks if a candidate team name conflicts with any existing team in the registered pool.
 */
export function checkDuplicateTeamName(
  candidateRawName: string,
  existingTeamNames: string[]
): { isDuplicate: boolean; conflictingName?: string; normalizedKey: string } {
  const candidateNorm = normalizeTeamName(candidateRawName);

  for (const existing of existingTeamNames) {
    const existingNorm = normalizeTeamName(existing);
    if (existingNorm.normalized_comparison_key === candidateNorm.normalized_comparison_key) {
      return {
        isDuplicate: true,
        conflictingName: existingNorm.canonical_display_name,
        normalizedKey: candidateNorm.normalized_comparison_key,
      };
    }
  }

  return {
    isDuplicate: false,
    normalizedKey: candidateNorm.normalized_comparison_key,
  };
}
