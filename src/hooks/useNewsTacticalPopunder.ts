import { useCallback } from 'react';
import { registerUserClickAndTriggerPopunder } from '../components/ads/MonetagEngines';

export function useNewsTacticalPopunder() {
  const triggerTacticalPause = useCallback((_eventContext?: string) => {
    // Delegates to unified 1-per-10-clicks rate-limited popunder engine
    registerUserClickAndTriggerPopunder();
  }, []);

  return { triggerTacticalPause };
}
