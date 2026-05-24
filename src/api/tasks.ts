import { get, post, put, del } from './client';
import type { Task } from '../types';

export function getTasks(params?: { status?: string; priority?: string }): Promise<Task[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.priority) query.set('priority', params.priority);
  const qs = query.toString();
  return get(`/tasks${qs ? '?' + qs : ''}`);
}

export function createTask(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  return post('/tasks', data);
}

export function updateTask(id: number, data: Partial<Task>): Promise<Task> {
  return put(`/tasks/${id}`, data);
}

export function deleteTask(id: number): Promise<void> {
  return del(`/tasks/${id}`);
}