import { supabase } from '../lib/supabase';

export interface Agent0LogRecord {
  id?: string;
  execution_id: string;
  season_id: string;
  event_type?: string | null;
  stage: string;
  algorithm?: string | null;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'PENDING' | 'STOPPED';
  message?: string | null;
  envelope?: Record<string, unknown> | null;
  database_payload?: Record<string, unknown> | null;
  verification_logs?: string[] | null;
  error_details?: Record<string, unknown> | null;
  created_at?: string;
}

export const Agent0LogService = {
  /**
   * Records a single Agent 0 action, algorithm envelope, or database write payload
   * directly to the public.agent0_logs table in Supabase.
   */
  async recordLog(entry: Agent0LogRecord): Promise<void> {
    try {
      const payload = {
        execution_id: entry.execution_id,
        season_id: entry.season_id,
        event_type: entry.event_type ?? null,
        stage: entry.stage,
        algorithm: entry.algorithm ?? null,
        status: entry.status,
        message: entry.message ?? null,
        envelope: entry.envelope ?? null,
        database_payload: entry.database_payload ?? null,
        verification_logs: entry.verification_logs ?? null,
        error_details: entry.error_details ?? null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('agent0_logs').insert([payload]);
      if (error) {
        console.warn('Note on Agent 0 log recording:', error.message);
      }
    } catch (err: any) {
      console.warn('Agent 0 log recording caught exception:', err.message);
    }
  },

  /**
   * Fetch Agent 0 logs with optional filtering
   */
  async getLogs(filters?: {
    executionId?: string;
    seasonId?: string;
    stage?: string;
    algorithm?: string;
    status?: string;
    limit?: number;
  }): Promise<Agent0LogRecord[]> {
    try {
      let query = supabase
        .from('agent0_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.executionId) {
        query = query.eq('execution_id', filters.executionId);
      }
      if (filters?.seasonId) {
        query = query.eq('season_id', filters.seasonId);
      }
      if (filters?.stage && filters.stage !== 'ALL') {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.algorithm && filters.algorithm !== 'ALL') {
        query = query.eq('algorithm', filters.algorithm);
      }
      if (filters?.status && filters.status !== 'ALL') {
        query = query.eq('status', filters.status);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(200);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Failed to fetch Agent 0 logs:', error.message);
        return [];
      }
      return (data || []) as Agent0LogRecord[];
    } catch (err) {
      console.error('Error in getLogs:', err);
      return [];
    }
  },

  /**
   * Clear all Agent 0 logs
   */
  async clearLogs(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent0_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      return !error;
    } catch (err) {
      console.error('Error clearing Agent 0 logs:', err);
      return false;
    }
  },

  /**
   * Realtime subscription for Agent 0 logs
   */
  subscribe(onNewLog: (log: Agent0LogRecord) => void) {
    const channel = supabase
      .channel('agent0_realtime_stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent0_logs' },
        (payload) => {
          if (payload.new) {
            onNewLog(payload.new as Agent0LogRecord);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
