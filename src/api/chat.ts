import { get, post, del } from './client';
import type { ChatSession, ChatMessage } from '../types';

export function getSessions(): Promise<ChatSession[]> {
  return get('/chat/sessions');
}

export function createSession(title: string): Promise<ChatSession> {
  return post('/chat/sessions', { title });
}

export function deleteSession(id: number): Promise<void> {
  return del(`/chat/sessions/${id}`);
}

export function getMessages(sessionId: number): Promise<ChatMessage[]> {
  return get(`/chat/sessions/${sessionId}/messages`);
}

export function sendMessage(sessionId: number, content: string): Promise<ChatMessage> {
  return post(`/chat/sessions/${sessionId}/messages`, { content });
}