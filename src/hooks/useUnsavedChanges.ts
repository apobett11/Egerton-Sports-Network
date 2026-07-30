import { useEffect } from 'react';

export function useUnsavedChanges(isDirty: boolean, customMessage?: string) {
  const message = customMessage || 'You have unsaved changes. Are you sure you want to leave this page?';

  useEffect(() => {
    if (!isDirty) return;

    // Protect window reload / tab close / browser back
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    // Protect hash routing navigation
    const handleHashChange = (e: HashChangeEvent) => {
      if (isDirty) {
        const confirmLeave = window.confirm(message);
        if (!confirmLeave) {
          // Revert hash back to old URL
          e.preventDefault();
          window.location.hash = e.oldURL.split('#')[1] || '';
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isDirty, message]);
}
