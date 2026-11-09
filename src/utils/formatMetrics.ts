export function formatMetricNumber(val: number | undefined | null): string {
  if (!val || val <= 0) return '0';
  if (val >= 1000) {
    return `${(val / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return val.toLocaleString();
}

/**
 * Ensures metric amounts strictly align with platform rules:
 * - Normal posts and messages: range between 500 and 1,500 (never exceeding 1,500).
 * - Trending posts: top space strictly above 1,500 up to 1,940 (never reaching 2,000).
 */
export function normalizeMetricRange(
  val: number | undefined | null,
  isTrending: boolean = false,
  isMessage: boolean = false
): number {
  if (!val || val <= 0) return 0;
  if (isMessage || !isTrending) {
    // Preserve initial fresh seed if post is brand new
    if (val >= 18 && val <= 45) return val;
    // Normal range between 500 and 1,500
    return Math.min(1500, Math.max(500, val));
  }
  // Trending posts enter the top space (> 1,500 and <= 1,940)
  return Math.min(1940, Math.max(1501, val));
}
