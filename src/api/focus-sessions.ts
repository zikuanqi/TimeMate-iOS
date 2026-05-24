import { get, post, put } from './client';
import type { FocusSession } from '../types';

export function getFocusSessions(params?: { date?: string; task_id?: number }): Promise<FocusSession[]> {
  const query = new URLSearchParams();
  if (params?.date) query.set('date', params.date);
  if (params?.task_id) query.set('task_id', String(params.task_id));
  const qs = query.toString();
  return get(`/focus-sessions${qs ? '?' + qs : ''}`);
}

export function startFocusSession(data: {
  task_id?: number;
  duration_minutes: number;
}): Promise<FocusSession> {
  return post('/focus-sessions', data);
}

export function endFocusSession(id: number, data: {
  interrupted?: boolean;
  interruption_count?: number;
  notes?: string;
}): Promise<FocusSession> {
  return put(`/focus-sessions/${id}/end`, data);
}

export function getDailyStats(date: string): Promise<{
  total_minutes: number;
  sessions_count: number;
  interruptions: number;
}> {
  return get(`/focus-sessions/stats?date=${date}`);
}