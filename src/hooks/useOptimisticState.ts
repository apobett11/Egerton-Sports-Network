import { useState, useCallback, useRef } from 'react';

export function useOptimisticState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const previousStateRef = useRef<T>(initialState);

  const applyOptimistic = useCallback((optimisticValue: T | ((prev: T) => T)) => {
    setState((prev) => {
      previousStateRef.current = prev;
      return typeof optimisticValue === 'function'
        ? (optimisticValue as (p: T) => T)(prev)
        : optimisticValue;
    });
  }, []);

  const rollback = useCallback(() => {
    setState(previousStateRef.current);
  }, []);

  const confirm = useCallback((finalState?: T) => {
    if (finalState !== undefined) {
      setState(finalState);
      previousStateRef.current = finalState;
    } else {
      previousStateRef.current = state;
    }
  }, [state]);

  return {
    state,
    setState,
    applyOptimistic,
    rollback,
    confirm,
  };
}
