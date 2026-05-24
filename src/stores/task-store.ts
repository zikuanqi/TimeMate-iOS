import { create } from 'zustand';
import type { Task } from '../types';
import * as api from '../api/tasks';

interface TaskStore {
  tasks: Task[];
  filter: { status?: string; priority?: string };
  loading: boolean;
  error: string | null;
  setFilter: (filter: { status?: string; priority?: string }) => void;
  fetchTasks: () => Promise<void>;
  addTask: (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: number, data: Partial<Task>) => Promise<void>;
  removeTask: (id: number) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  filter: {},
  loading: false,
  error: null,

  setFilter: (filter) => {
    set({ filter });
    get().fetchTasks();
  },

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await api.getTasks(get().filter);
      set({ tasks, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  addTask: async (data) => {
    try {
      await api.createTask(data);
      await get().fetchTasks();
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  updateTask: async (id, data) => {
    try {
      await api.updateTask(id, data);
      await get().fetchTasks();
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  removeTask: async (id) => {
    try {
      await api.deleteTask(id);
      await get().fetchTasks();
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
}));