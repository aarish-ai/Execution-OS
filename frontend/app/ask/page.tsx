'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { api, SearchResult } from '@/lib/api';
import { Search, Sparkles, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AskPage() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.ask(query);
      setAnswer(data.answer);
      setSources(data.sources);
    } catch (err: any) {
      setError('Failed to process Q&A query.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent">
          Ask Anything
        </h1>
        <p className="text-slate-400 text-sm">
          Natural language Q&A across your squad's complete meeting memory.
        </p>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleAsk} className="relative">
        <input
          type="text"
          aria-label="Ask a question across meeting memory"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. What did we decide about database migrations last week?"
          className="w-full pl-6 pr-32 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 text-base placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-xl"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-3 top-3 bottom-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Answer & Sources */}
      {answer && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-blue-500/20 bg-slate-900/60 backdrop-blur-md space-y-4">
            <h2 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Synthesized Answer
            </h2>
            <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          </div>

          {/* Sources */}
          {sources.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Source Transcripts ({sources.length}):
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources.map((src, idx) => (
                  <Link
                    key={idx}
                    href={`/meetings/${src.meeting_id}`}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-colors space-y-2 group block"
                  >
                    <div className="flex items-center justify-between text-xs text-blue-400">
                      <span className="flex items-center gap-1 font-medium">
                        <FileText className="w-3.5 h-3.5" />
                        {src.meeting_title}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-slate-300 text-xs line-clamp-3 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                      "{src.content}"
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
