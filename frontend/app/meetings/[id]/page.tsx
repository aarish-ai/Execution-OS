'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { api, MeetingDetail } from '@/lib/api';
import { CheckCircle2, HelpCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MeetingDetailPage() {
  const { id } = useParams() as { id: string };
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedChunkIndex, setHighlightedChunkIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getMeeting(id);
        setMeeting(data);
      } catch (err: any) {
        setError('Failed to load meeting detail.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchDetail();
  }, [id]);

  const handleCardClick = (chunkIndex: number) => {
    setHighlightedChunkIndex(chunkIndex);
    const el = document.getElementById(`chunk-${chunkIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setHighlightedChunkIndex(null);
    }, 2000);
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Loading meeting...</div>;
  }

  if (error || !meeting) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-950/20 border border-rose-500/30 rounded-2xl">
        {error || 'Meeting not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/meetings" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{meeting.title}</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            {new Date(meeting.created_at || meeting.meeting_date).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Summary Box */}
      {meeting.summary && (
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <h2 className="text-sm font-semibold text-slate-200 mb-2">Executive Summary</h2>
          <div className="prose prose-invert max-w-none text-slate-300 text-sm">
            <ReactMarkdown>{meeting.summary}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Pane: Transcript */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Transcript</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {meeting.chunks.map((chunk) => {
              const isQuestion = meeting.open_questions.some(q => q.transcript_position === chunk.chunk_index);
              const isHighlighted = highlightedChunkIndex === chunk.chunk_index;

              return (
                <div
                  key={chunk.id}
                  id={`chunk-${chunk.chunk_index}`}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    isHighlighted
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-950/20'
                      : isQuestion
                      ? 'border-indigo-500/30 bg-indigo-950/10'
                      : 'border-slate-800/80 bg-slate-900/40'
                  }`}
                >
                  <p className="text-xs font-semibold text-blue-400 mb-1">
                    {chunk.speaker || 'Speaker'}
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed">{chunk.content}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Intelligence Cards */}
        <div className="space-y-6">
          {/* Decisions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Decisions Made ({meeting.decisions.length})
            </h3>
            {meeting.decisions.map((d) => (
              <div
                key={d.id}
                onClick={() => handleCardClick(d.transcript_position)}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 cursor-pointer transition-colors space-y-2"
              >
                <p className="text-slate-100 text-sm font-medium">{d.content}</p>
                {d.owner && (
                  <p className="text-xs text-slate-400">
                    Owner: <span className="text-slate-200">{d.owner}</span>
                  </p>
                )}
                <p className="text-xs text-slate-500 italic bg-slate-950/60 p-2 rounded-lg">
                  "{d.source_quote}"
                </p>
              </div>
            ))}
          </div>

          {/* Open Questions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              Open Questions ({meeting.open_questions.length})
            </h3>
            {meeting.open_questions.map((q) => (
              <div
                key={q.id}
                onClick={() => handleCardClick(q.transcript_position)}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 cursor-pointer transition-colors space-y-1"
              >
                <p className="text-slate-100 text-sm font-medium">{q.content}</p>
                {q.raised_by && (
                  <p className="text-xs text-slate-400">Raised by: {q.raised_by}</p>
                )}
              </div>
            ))}
          </div>

          {/* Contradictions */}
          {meeting.contradictions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Contradiction Alerts ({meeting.contradictions.length})
              </h3>
              {meeting.contradictions.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 space-y-2"
                >
                  <p className="text-amber-200 text-sm font-medium">{c.explanation}</p>
                  <p className="text-xs text-slate-400 italic">"{c.conflicting_quote}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
