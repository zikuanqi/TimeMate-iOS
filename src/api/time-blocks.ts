import { get, post, put, del } from './client';
import type { TimeBlock } from '../types';

export function getTimeBlocks(date?: string): Promise<TimeBlock[]> {
  const params = date ? `?date=${date}` : '';
  return get(`/time-blocks${params}`);
}

export function createTimeBlock(data: Omit<TimeBlock, 'id' | 'created_at'>): Promise<TimeBlock> {
  return post('/time-blocks', data);
}

export function updateTimeBlock(id: number, data: Partial<TimeBlock>): Promise<TimeBlock> {
  return put(`/time-blocks/${id}`, data);
}

export function deleteTimeBlock(id: number): Promise<void> {
  return del(`/time-blocks/${id}`);
}