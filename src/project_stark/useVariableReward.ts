import { useState, useCallback } from 'react';
import type { NewsItem } from '../types';

export type RewardType = 'STANDARD' | 'HIGH_DOPAMINE_GOSSIP';

export interface VariableRewardResult {
  isRefreshing: boolean;
  rewardType: RewardType | null;
  pullCount: number;
  dopamineHits: number;
  newsItems: NewsItem[];
  triggerRefresh: () => Promise<RewardType>;
  resetRewardState: () => void;
}

const HIGH_DOPAMINE_GOSSIP_ITEMS: NewsItem[] = [
  {
    id: `gossip-${Date.now()}-1`,
    title: '🔥 BOMBSHELL: Faculty of Science Captain Spotted in Secret Talks at Njoro Market!',
    excerpt: 'Exclusive rumors suggest a record 5,000 KES transfer deal is being arranged ahead of the weekend derby. Chemistry Dept scouts reportedly involved.',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600',
    publishedAt: 'Just now',
    author: 'Campus Insider',
    authorRole: 'Chief Gossip Analyst',
    verified: true,
    category: 'transfer',
  },
  {
    id: `gossip-${Date.now()}-2`,
    title: '⚡ DISCIPLINE DISPUTE: Engineering Striker Bench Banned After Missing Tuesday Drill!',
    excerpt: 'Coach Kwemoi reportedly issued a strict ultimatum following rumors of late-night study hall celebrations.',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=600',
    publishedAt: 'Just now',
    author: 'Anonymous Scout',
    authorRole: 'Verified Journalist',
    verified: true,
    category: 'transfer',
  },
  {
    id: `gossip-${Date.now()}-3`,
    title: '🚨 TACTICAL SHIFT: Medical School Switching to Aggressive 3-4-3 for Egerton Cup!',
    excerpt: 'Leaked training footage shows relentless press tactics designed to neutralize Science FC speedsters.',
    imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=600',
    publishedAt: 'Just now',
    author: 'Tactical Whispers',
    authorRole: 'Senior Analyst',
    verified: true,
    category: 'general',
  },
];

/**
 * Project Stark: useVariableReward
 * Inject artificial latency (400ms - 800ms) on pull-to-refresh actions for the News feed,
 * randomly serving standard news or high-dopamine "Transfer Gossip" to mimic slot-machine mechanics.
 */
export function useVariableReward(initialNewsItems: NewsItem[] = []): VariableRewardResult {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [rewardType, setRewardType] = useState<RewardType | null>(null);
  const [pullCount, setPullCount] = useState<number>(0);
  const [dopamineHits, setDopamineHits] = useState<number>(0);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(initialNewsItems);

  const triggerRefresh = useCallback(async (): Promise<RewardType> => {
    setIsRefreshing(true);
    setRewardType(null);

    // Variable latency injection (400ms - 800ms) to create psychological anticipation
    const artificialLatency = Math.floor(Math.random() * 400) + 400;
    await new Promise((resolve) => setTimeout(resolve, artificialLatency));

    // Variable ratio reinforcement schedule (~40% chance of high-dopamine gossip hit)
    const isHighDopamine = Math.random() < 0.4;
    const currentReward: RewardType = isHighDopamine ? 'HIGH_DOPAMINE_GOSSIP' : 'STANDARD';

    setPullCount((prev) => prev + 1);

    if (isHighDopamine) {
      setDopamineHits((prev) => prev + 1);
      const randomIndex = Math.floor(Math.random() * HIGH_DOPAMINE_GOSSIP_ITEMS.length);
      const newGossip = {
        ...HIGH_DOPAMINE_GOSSIP_ITEMS[randomIndex],
        id: `gossip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      };

      setNewsItems((prev) => [newGossip, ...prev.filter((item) => item.id !== newGossip.id)]);
    }

    setRewardType(currentReward);
    setIsRefreshing(false);
    return currentReward;
  }, []);

  const resetRewardState = useCallback(() => {
    setRewardType(null);
    setIsRefreshing(false);
  }, []);

  return {
    isRefreshing,
    rewardType,
    pullCount,
    dopamineHits,
    newsItems,
    triggerRefresh,
    resetRewardState,
  };
}

export default useVariableReward;
