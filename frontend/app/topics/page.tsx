'use client';

import { useState, useEffect } from 'react';
import { api, TopicDetail } from '@/lib/api';
import { Hash, Calendar, CheckCircle2, Search } from 'lucide-react';

export default function TopicThreadsPage() {
  const [topics, setTopics] = useState<TopicDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadTopics() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getTopics();
        setTopics(data);
      } catch (err: any) {
        setError('Failed to fetch topic threads.');
      } finally {
        setLoading(false);
      }
    }
    loadTopics();
  }, []);

  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Topic Threads</h1>
          <p className="text-slate-400 text-sm">
            Cross-meeting topic arcs and decision evolution over time.
          </p>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            aria-label="Search topic threads"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          Loading topic threads...
        </div>
      ) : filteredTopics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-slate-100">{topic.name}</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-medium">
                  {topic.occurrence_count} Meetings
                </span>
              </div>

              {/* Meetings List */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Discussed In:
                </p>
                <div className="space-y-1.5">
                  {topic.meetings.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs"
                    >
                      <span className="text-slate-300 font-medium">{m.title}</span>
                      {m.date && (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(m.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Decisions */}
              {topic.decisions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Associated Decisions:
                  </p>
                  {topic.decisions.map((d, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{d.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
          No topic threads found.
        </div>
      )}
    </div>
  );
}
