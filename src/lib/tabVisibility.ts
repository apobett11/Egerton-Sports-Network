export function isTabVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState === 'visible';
}
