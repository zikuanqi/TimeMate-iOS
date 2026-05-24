import { create } from 'zustand';
import * as chatApi from '../api/chat';
import * as aiApi from '../api/ai';
import type { ChatSession, ChatMessage } from '../types';

interface AIChatStore {
  sessions: ChatSession[];
  activeSessionId: number | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;

  fetchSessions: () => Promise<void>;
  createSession: (title: string) => Promise<number>;
  deleteSession: (id: number) => Promise<void>;
  setActiveSession: (id: number) => void;
  fetchMessages: (sessionId: number) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setMessages: (msgs: ChatMessage[]) => void;
}

export const useAIChatStore = create<AIChatStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  loading: false,
  error: null,

  fetchSessions: async () => {
    try {
      const sessions = await chatApi.getSessions();
      set({ sessions });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  createSession: async (title) => {
    const session = await chatApi.createSession(title);
    await get().fetchSessions();
    return session.id;
  },

  deleteSession: async (id) => {
    await chatApi.deleteSession(id);
    if (get().activeSessionId === id) {
      set({ activeSessionId: null, messages: [] });
    }
    await get().fetchSessions();
  },

  setActiveSession: (id) => {
    set({ activeSessionId: id });
    get().fetchMessages(id);
  },

  fetchMessages: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const messages = await chatApi.getMessages(sessionId);
      set({ messages, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  sendMessage: async (content) => {
    const { activeSessionId, messages } = get();
    if (!activeSessionId) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      session_id: activeSessionId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    set({ messages: [...messages, userMsg], loading: true, error: null });

    try {
      const response = await aiApi.sendChatMessage(content, activeSessionId);
      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        session_id: activeSessionId,
        role: 'assistant',
        content: response.reply,
        created_at: new Date().toISOString(),
      };
      set({ messages: [...get().messages, assistantMsg], loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  setMessages: (msgs) => set({ messages: msgs }),
}));