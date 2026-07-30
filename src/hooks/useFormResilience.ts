import { useCallback, useRef } from 'react';

export function useFormResilience() {
  const formRef = useRef<HTMLFormElement | null>(null);

  const focusAndScrollToFirstError = useCallback((errors: Record<string, string | undefined>) => {
    const firstKey = Object.keys(errors).find((k) => !!errors[k]);
    if (!firstKey) return;

    if (typeof document !== 'undefined') {
      const element =
        document.getElementById(`input-${firstKey}`) ||
        document.querySelector(`[name="${firstKey}"]`) ||
        document.querySelector(`[aria-invalid="true"]`);

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (element as HTMLElement).focus?.();
      }
    }
  }, []);

  return {
    formRef,
    focusAndScrollToFirstError,
  };
}
