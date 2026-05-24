export interface TimeBlock {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  block_type: string;
  color: string;
  notes: string | null;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'done';
  due_date: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  time_block_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface FocusSession {
  id: number;
  task_id: number | null;
  duration_minutes: number;
  actual_minutes: number;
  interrupted: boolean;
  interruption_count: number;
  notes: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface AnalyticsOverview {
  total_focus_minutes: number;
  total_sessions: number;
  completion_rate: number;
  task_completion_rate: number;
  interruption_rate: number;
  avg_session_minutes: number;
}

export interface DailyFocus {
  date: string;
  focus_minutes: number;
  sessions_count: number;
}

export interface TaskDistribution {
  status: string;
  count: number;
}

export interface PeakProductivity {
  hour: number;
  total_minutes: number;
  session_count: number;
}

export interface BlockTypeStats {
  block_type: string;
  total_hours: number;
  block_count: number;
}

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface AIResponse {
  reply: string;
  actions?: {
    type: 'create_task' | 'create_time_block' | 'start_focus';
    payload: Record<string, unknown>;
  }[];
}