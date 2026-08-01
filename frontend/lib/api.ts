export interface MeetingSummary {
  id: string;
  title: string;
  summary?: string;
  health_score?: number;
  meeting_date: string;
  created_at: string;
  contradictions_count: number;
}

export interface TranscriptChunk {
  id: string;
  speaker?: string;
  content: string;
  chunk_index: number;
}

export interface Decision {
  id: string;
  meeting_id: string;
  topic_id?: string;
  content: string;
  owner?: string;
  rationale?: string;
  source_quote: string;
  transcript_position: number;
  created_at?: string;
}

export interface Task {
  id: string;
  meeting_id: string;
  owner: string;
  description: string;
  deadline?: string;
  status: 'open' | 'in_progress' | 'done' | 'overdue';
  source_quote: string;
  transcript_position: number;
}

export interface OpenQuestion {
  id: string;
  content: string;
  raised_by?: string;
  resolved: boolean;
  carried_forward_from?: string;
  transcript_position: number;
}

export interface ContradictionAlert {
  id: string;
  meeting_id: string;
  prior_decision_id: string;
  conflicting_quote: string;
  explanation: string;
  dismissed: boolean;
}

export interface MeetingDetail extends MeetingSummary {
  raw_transcript: string;
  updated_at: string;
  chunks: TranscriptChunk[];
  decisions: Decision[];
  tasks: Task[];
  open_questions: OpenQuestion[];
  contradictions: ContradictionAlert[];
}

export interface SearchResult {
  chunk_id: string;
  meeting_id: string;
  meeting_title: string;
  speaker?: string;
  content: string;
  chunk_index: number;
  score: number;
}

export interface DriftAlert {
  id: string;
  topic_name: string;
  topic_id?: string;
  meeting_count: number;
  resolved: boolean;
  last_seen: string;
  created_at: string;
}

export interface TopicDetail {
  id: string;
  name: string;
  occurrence_count: number;
  meetings: Array<{ id: string; title: string; date?: string }>;
  decisions: Array<{ id: string; content: string; owner?: string; created_at?: string }>;
  created_at: string;
}

const BASE_URL = '/api/v1';

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`API error (${res.status}): ${errorBody || res.statusText}`);
  }

  return res.json();
}

export const api = {
  createMeeting: (title: string, raw_transcript: string) =>
    fetcher<MeetingSummary>('/meetings', {
      method: 'POST',
      body: JSON.stringify({ title, raw_transcript }),
    }),

  getMeetings: () => fetcher<MeetingSummary[]>('/meetings'),

  getMeeting: (id: string) => fetcher<MeetingDetail>(`/meetings/${id}`),

  deleteMeeting: (id: string) =>
    fetcher<void>(`/meetings/${id}`, { method: 'DELETE' }),

  getMeetingBrief: (id: string) =>
    fetcher<{ brief: string }>(`/meetings/${id}/brief`),

  getMeetingHealth: (id: string) =>
    fetcher<{
      meeting_id: string;
      health_score: number;
      decisions_count: number;
      tasks_count: number;
      questions_count: number;
    }>(`/meetings/${id}/health`),

  getTasks: (owner?: string, status?: string) => {
    const params = new URLSearchParams();
    if (owner) params.append('owner', owner);
    if (status) params.append('status', status);
    const q = params.toString();
    return fetcher<Task[]>(`/tasks/${q ? `?${q}` : ''}`);
  },

  updateTaskStatus: (id: string, status: Task['status']) =>
    fetcher<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getDecisions: (owner?: string) => {
    const q = owner ? `?owner=${encodeURIComponent(owner)}` : '';
    return fetcher<Decision[]>(`/decisions/${q}`);
  },

  search: (query: string, top_k: number = 5) =>
    fetcher<SearchResult[]>(`/search/?query=${encodeURIComponent(query)}&top_k=${top_k}`),

  ask: (query: string) =>
    fetcher<{ answer: string; sources: SearchResult[] }>('/search/ask', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  getWeeklyBrief: () =>
    fetcher<{ id: string; content: string; week_start: string; week_end: string; created_at: string }>(
      '/briefs/weekly/latest'
    ),

  generateWeeklyBrief: () =>
    fetcher<{ id: string; content: string; week_start: string; week_end: string; created_at: string }>(
      '/briefs/weekly/generate',
      { method: 'POST' }
    ),

  getContradictions: (include_dismissed = false) =>
    fetcher<ContradictionAlert[]>(`/contradictions/?include_dismissed=${include_dismissed}`),

  dismissContradiction: (id: string) =>
    fetcher<{ status: string; id: string; dismissed: boolean }>(`/contradictions/${id}/dismiss`, {
      method: 'PATCH',
    }),

  getOpenQuestions: (unresolved_only = true) =>
    fetcher<OpenQuestion[]>(`/questions/?unresolved_only=${unresolved_only}`),

  resolveOpenQuestion: (id: string) =>
    fetcher<{ status: string; id: string; resolved: boolean }>(`/questions/${id}/resolve`, {
      method: 'PATCH',
    }),

  getDriftAlerts: (unresolved_only = true) =>
    fetcher<DriftAlert[]>(`/drift-alerts/?unresolved_only=${unresolved_only}`),

  resolveDriftAlert: (id: string) =>
    fetcher<{ status: string; id: string; resolved: boolean }>(`/drift-alerts/${id}/resolve`, {
      method: 'PATCH',
    }),

  getTopics: () => fetcher<TopicDetail[]>('/topics'),

  generateProgressSummary: (start_date?: string, end_date?: string) =>
    fetcher<{ summary: string; meetings_analyzed: number; decisions_count: number; tasks_count: number }>(
      '/progress/',
      {
        method: 'POST',
        body: JSON.stringify({ start_date, end_date }),
      }
    ),
};
