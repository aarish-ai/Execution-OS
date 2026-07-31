export interface MeetingSummary {
  id: string;
  title: string;
  summary?: string;
  health_score?: number;
  meeting_date: string;
}

export interface TranscriptChunk {
  id: string;
  speaker?: string;
  content: string;
  chunk_index: number;
}

export interface Decision {
  id: string;
  content: string;
  owner?: string;
  rationale?: string;
  source_quote: string;
  transcript_position: number;
}

export interface TaskItem {
  id: string;
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
}

export interface ContradictionAlert {
  id: string;
  prior_decision_id: string;
  conflicting_quote: string;
  explanation: string;
  dismissed: boolean;
}

export interface MeetingDetail {
  id: string;
  title: string;
  raw_transcript: string;
  summary?: string;
  health_score?: number;
  meeting_date: string;
  chunks: TranscriptChunk[];
  decisions: Decision[];
  tasks: TaskItem[];
  open_questions: OpenQuestion[];
  contradictions: ContradictionAlert[];
}

export interface SearchResult {
  chunk_id: string;
  meeting_id: string;
  meeting_title: string;
  speaker?: string;
  content: string;
  score: number;
  chunk_index: number;
}

export interface AskResponse {
  answer: string;
  sources: {
    meeting_id: string;
    meeting_title: string;
    chunk_index: number;
    speaker?: string;
    content: string;
  }[];
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText}`);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  getMeetings: () => fetcher<MeetingSummary[]>('/meetings/'),
  getMeeting: (id: string) => fetcher<MeetingDetail>(`/meetings/${id}`),
  createMeeting: (title: string, raw_transcript: string) =>
    fetcher<MeetingSummary>('/meetings/', {
      method: 'POST',
      body: JSON.stringify({ title, raw_transcript }),
    }),
  deleteMeeting: (id: string) =>
    fetcher<void>(`/meetings/${id}`, { method: 'DELETE' }),

  getTasks: (owner?: string, status?: string) => {
    const params = new URLSearchParams();
    if (owner) params.append('owner', owner);
    if (status) params.append('status', status);
    return fetcher<TaskItem[]>(`/tasks/?${params.toString()}`);
  },
  getOverdueTasks: () => fetcher<TaskItem[]>('/tasks/overdue'),
  updateTask: (id: string, updates: { status?: string; deadline?: string }) =>
    fetcher<TaskItem>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  getDecisions: (owner?: string) => {
    const params = new URLSearchParams();
    if (owner) params.append('owner', owner);
    return fetcher<Decision[]>(`/decisions/?${params.toString()}`);
  },

  search: (query: string, meeting_id?: string, top_k = 5) =>
    fetcher<SearchResult[]>('/search/', {
      method: 'POST',
      body: JSON.stringify({ query, meeting_id, top_k }),
    }),

  ask: (question: string) =>
    fetcher<AskResponse>('/search/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  getWeeklyBrief: () => fetcher<{ id?: string; content: string }>('/briefs/weekly'),
  generateWeeklyBrief: () =>
    fetcher<{ id: string; content: string }>('/briefs/weekly/generate', {
      method: 'POST',
    }),
};
