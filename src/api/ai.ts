import { post } from './client';
import type { AIResponse } from '../types';

export function sendChatMessage(
  message: string,
  sessionId?: number
): Promise<AIResponse> {
  return post('/ai/chat', { message, session_id: sessionId });
}

export function parseIntent(text: string): Promise<{
  intent: string;
  entities: Record<string, unknown>;
}> {
  return post('/ai/parse-intent', { text });
}