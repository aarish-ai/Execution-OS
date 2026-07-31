'use client';

import React, { useState } from 'react';
import { api, AskResponse } from '@/lib/api';
import { Search, Sparkles, BookOpen, ChevronDown, ChevronUp, Bot, User } from 'lucide-react';

interface QATurn {
  question: string;
  response: AskResponse;
}

export default function AskAnythingPage() {
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<QATurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<{ [key: number]: boolean }>({});

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    const currentQ = question;
    setQuestion('');

    try {
      const res = await api.ask(currentQ);
      setTurns((prev) => [{ question: currentQ, response: res }, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = (idx: number) => {
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-blue-400" />
          Ask Anything
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Perplexity for your organization — query all meetings with source citations.
        </p>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleAsk} className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            required
            placeholder='e.g. "Why did we decide on Postgres over Redis?" or "What has Omar committed to?"'
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-5 py-4 pl-12 bg-slate-900 border border-blue-500/30 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-xl"
          />
          <Search className="w-5 h-5 text-blue-400 absolute left-4" />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Searching Memory...' : 'Ask →'}
          </button>
        </div>
      </form>

      {/* Q&A History */}
      <div className="space-y-6">
        {turns.map((turn, tIdx) => (
          <div key={tIdx} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            {/* User Question */}
            <div className="flex items-start gap-3 border-b border-slate-800/80 pb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">{turn.question}</h3>
            </div>

            {/* Answer */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {turn.response.answer}
              </div>
            </div>

            {/* Sources Accordion */}
            {turn.response.sources.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => toggleSource(tIdx)}
                  className="text-xs font-semibold text-slate-400 hover:text-blue-400 flex items-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Sources & Citations ({turn.response.sources.length})
                  {expandedSources[tIdx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {expandedSources[tIdx] && (
                  <div className="mt-3 space-y-2 pl-4 border-l-2 border-slate-800">
                    {turn.response.sources.map((src, sIdx) => (
                      <div key={sIdx} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px]">
                        <div className="font-semibold text-blue-400">
                          {src.meeting_title} — Speaker: {src.speaker || 'Unknown'} (Chunk #{src.chunk_index})
                        </div>
                        <p className="text-slate-400 mt-1 font-mono italic text-[10px]">
                          "{src.content}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {turns.length === 0 && !loading && (
          <div className="text-center py-12 glass-panel rounded-2xl border-dashed border-2 border-slate-800">
            <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Ask any question across your team's meeting history.</p>
            <p className="text-xs text-slate-500 mt-1">Get verified answers backed by source citations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
