import { create } from 'zustand';
import * as api from '../api/focus-sessions';
import type { FocusSession } from '../types';

interface TimerStore {
  isRunning: boolean;
  duration: number;
  remaining: number;
  sessionId: number | null;
  taskId: number | null;
  interruptions: number;
  sessions: FocusSession[];
  loading: boolean;
  error: string | null;

  setDuration: (d: number) => void;
  setTaskId: (id: number | null) => void;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  end: () => Promise<void>;
  interrupt: () => void;
  tick: () => void;
  fetchSessions: (date?: string) => Promise<void>;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  isRunning: false,
  duration: 25,
  remaining: 25 * 60,
  sessionId: null,
  taskId: null,
  interruptions: 0,
  sessions: [],
  loading: false,
  error: null,

  setDuration: (d) => set({ duration: d, remaining: d * 60 }),
  setTaskId: (id) => set({ taskId: id }),

  start: async () => {
    const { duration, taskId } = get();
    set({ loading: true, error: null });
    try {
      const session = await api.startFocusSession({
        duration_minutes: duration,
        task_id: taskId ?? undefined,
      });
      set({
        sessionId: session.id,
        remaining: duration * 60,
        isRunning: true,
        loading: false,
      });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  pause: () => set({ isRunning: false }),

  resume: () => set({ isRunning: true }),

  end: async () => {
    const { sessionId, interruptions } = get();
    if (!sessionId) return;
    set({ loading: true, error: null });
    try {
      await api.endFocusSession(sessionId, {
        interrupted: interruptions > 0,
        interruption_count: interruptions,
      });
      set({
        isRunning: false,
        sessionId: null,
        interruptions: 0,
        loading: false,
      });
      get().fetchSessions();
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  interrupt: () => {
    set((s) => ({ interruptions: s.interruptions + 1 }));
  },

  tick: () => {
    const { remaining, isRunning } = get();
    if (!isRunning) return;
    if (remaining <= 0) {
      get().end();
      return;
    }
    set({ remaining: remaining - 1 });
  },

  fetchSessions: async (date) => {
    set({ loading: true, error: null });
    try {
      const sessions = await api.getFocusSessions({ date });
      set({ sessions, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },
}));