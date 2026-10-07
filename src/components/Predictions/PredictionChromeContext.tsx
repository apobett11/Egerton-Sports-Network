import React, { createContext, useContext, useMemo, useState } from 'react';
import type { BanterFilterType } from '../../types/predictions';

export const BANTER_SORTS: { id: BanterFilterType; label: string }[] = [
  { id: 'trending', label: 'Trending' },
  { id: 'coach', label: 'Coach updates' },
  { id: 'latest', label: 'Latest' },
  { id: 'all', label: 'All' },
];

export interface PredictionChromeState {
  banterFilter: BanterFilterType;
  setBanterFilter: (filter: BanterFilterType) => void;
  clubFilterOn: boolean;
  hasFavouriteClub: boolean;
  onToggleClubBanter: () => void;
  onOpenAllSlips: () => void;
  matchContextName: string | null;
  onClearMatchContext: () => void;
}

const EMPTY_CHROME: PredictionChromeState = {
  banterFilter: 'trending',
  setBanterFilter: () => undefined,
  clubFilterOn: false,
  hasFavouriteClub: false,
  onToggleClubBanter: () => undefined,
  onOpenAllSlips: () => undefined,
  matchContextName: null,
  onClearMatchContext: () => undefined,
};

interface PredictionChromeContextValue {
  view: 'banter' | 'scores' | 'analytics';
  setView: (view: 'banter' | 'scores' | 'analytics') => void;
  chrome: PredictionChromeState;
  setChrome: (next: PredictionChromeState) => void;
}

const PredictionChromeContext = createContext<PredictionChromeContextValue | null>(null);

export function PredictionChromeProvider({
  view,
  setView,
  children,
}: {
  view: 'banter' | 'scores' | 'analytics';
  setView: (view: 'banter' | 'scores' | 'analytics') => void;
  children: React.ReactNode;
}) {
  const [chrome, setChrome] = useState<PredictionChromeState>(EMPTY_CHROME);
  const value = useMemo(
    () => ({ view, setView, chrome, setChrome }),
    [view, setView, chrome],
  );
  return (
    <PredictionChromeContext.Provider value={value}>
      {children}
    </PredictionChromeContext.Provider>
  );
}

export function usePredictionChrome() {
  return useContext(PredictionChromeContext);
}
