export interface Journalist {
  id: string;
  name: string;
  role: string;
  faculty: string;
  articlesCount: number;
  totalEngagement: number;
  anonymousTipsVolume: number;
  isDisputed: boolean;
  disputedReason?: string;
  lastArticleTitle: string;
}

export interface SupabaseSlowQuery {
  id: string;
  query: string;
  durationMs: number;
  tableName: string;
  recommendedIndex: string;
  isOptimized: boolean;
}

export interface DauDataPoint {
  day: string;
  dau: number;
  sessionMins: number;
  predictions: number;
  dopamineHits: number;
}

export interface PsychSystemDataPoint {
  name: string;
  value: number;
  color: string;
}
