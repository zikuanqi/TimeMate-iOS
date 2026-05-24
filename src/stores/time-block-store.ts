import { create } from 'zustand';
import type { TimeBlock } from '../types';
import * as api from '../api/time-blocks';

interface TimeBlockStore {
  blocks: TimeBlock[];
  selectedDate: string;
  loading: boolean;
  error: string | null;
  setSelectedDate: (date: string) => void;
  fetchBlocks: (date?: string) => Promise<void>;
  addBlock: (data: Omit<TimeBlock, 'id' | 'created_at'>) => Promise<void>;
  updateBlock: (id: number, data: Partial<TimeBlock>) => Promise<void>;
  removeBlock: (id: number) => Promise<void>;
}

export const useTimeBlockStore = create<TimeBlockStore>((set, get) => ({
  blocks: [],
  selectedDate: new Date().toISOString().slice(0, 10),
  loading: false,
  error: null,

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().fetchBlocks(date);
  },

  fetchBlocks: async (date) => {
    set({ loading: true, error: null });
    try {
      const blocks = await api.getTimeBlocks(date);
      set({ blocks, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  addBlock: async (data) => {
    try {
      await api.createTimeBlock(data);
      await get().fetchBlocks(get().selectedDate);
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  updateBlock: async (id, data) => {
    try {
      await api.updateTimeBlock(id, data);
      await get().fetchBlocks(get().selectedDate);
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  removeBlock: async (id) => {
    try {
      await api.deleteTimeBlock(id);
      await get().fetchBlocks(get().selectedDate);
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
}));