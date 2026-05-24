import { get } from './client';
import type { AnalyticsOverview, DailyFocus, TaskDistribution, PeakProductivity, BlockTypeStats } from '../types';

export function getOverview(): Promise<AnalyticsOverview> {
  return get('/analytics/overview');
}

export function getDailyFocus(days?: number): Promise<DailyFocus[]> {
  return get(`/analytics/daily-focus${days ? '?days=' + days : ''}`);
}

export function getTaskDistribution(): Promise<TaskDistribution[]> {
  return get('/analytics/task-distribution');
}

export function getPeakProductivity(): Promise<PeakProductivity[]> {
  return get('/analytics/peak-productivity');
}

export function getBlockTypeStats(): Promise<BlockTypeStats[]> {
  return get('/analytics/block-types');
}