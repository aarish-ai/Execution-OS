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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/meetings" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{meeting.title}</h1>
            <div className="flex items-center gap-3 text-slate-400 text-xs mt-1">
              <span>{new Date(meeting.created_at || meeting.meeting_date).toLocaleDateString()}</span>
              {meeting.health_score !== null && meeting.health_score !== undefined && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                  <span className={`font-medium ${meeting.health_score >= 8 ? 'text-emerald-400' : meeting.health_score >= 5 ? 'text-amber-400' : 'text-rose-400'}`}>
                    Health Score: {meeting.health_score}/10
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={async () => {
            try {
              const res = await api.getMeetingBrief(meeting.id);
              alert(res.brief);
            } catch (err) {
              alert('Failed to fetch pre-meeting brief.');
            }
          }}
          className="px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          View Pre-Meeting Brief
        </button>
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
              const isContradiction = meeting.contradictions.some(c => c.conflicting_quote && chunk.content.includes(c.conflicting_quote));
              const isHighlighted = highlightedChunkIndex === chunk.chunk_index;

              return (
                <div
                  key={chunk.id}
                  id={`chunk-${chunk.chunk_index}`}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    isHighlighted
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-950/20'
                      : isContradiction
                      ? 'border-rose-500/50 bg-rose-950/20'
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
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="space-y-1">
                  <p className="text-slate-100 text-sm font-medium">{d.content}</p>
                  {d.owner && (
                    <p className="text-xs text-slate-400">
                      Owner: <span className="text-slate-200">{d.owner}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 italic bg-slate-950/60 p-2 rounded-lg flex-1 mr-4 line-clamp-2" title={d.source_quote}>
                    "{d.source_quote}"
                  </p>
                  <button
                    onClick={() => handleCardClick(d.transcript_position)}
                    className="shrink-0 text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    View Source Chunk
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              Action Items ({meeting.tasks.length})
            </h3>
            {meeting.tasks.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-100 text-sm font-medium">{t.description}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Owner: <span className="text-slate-200">{t.owner}</span>
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const newStatus = t.status === 'done' ? 'open' : 'done';
                      await api.updateTaskStatus(t.id, newStatus);
                      setMeeting({
                        ...meeting,
                        tasks: meeting.tasks.map(task => task.id === t.id ? { ...task, status: newStatus } : task)
                      });
                    }}
                    className={`shrink-0 px-2.5 py-1 text-xs font-medium rounded-lg border ${
                      t.status === 'done'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    } transition-colors`}
                  >
                    {t.status.toUpperCase()}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 italic bg-slate-950/60 p-2 rounded-lg flex-1 mr-4 line-clamp-2" title={t.source_quote}>
                    "{t.source_quote}"
                  </p>
                  <button
                    onClick={() => handleCardClick(t.transcript_position)}
                    className="shrink-0 text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    View Source Chunk
                  </button>
                </div>
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
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-100 text-sm font-medium">{q.content}</p>
                    {q.raised_by && (
                      <p className="text-xs text-slate-400 mt-1">Raised by: {q.raised_by}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleCardClick(q.transcript_position)}
                    className="shrink-0 text-xs text-blue-400 hover:text-blue-300 underline ml-4"
                  >
                    View Source Chunk
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Contradictions */}
          {meeting.contradictions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Contradiction Alerts ({meeting.contradictions.length})
              </h3>
              {meeting.contradictions.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-2"
                >
                  <p className="text-rose-200 text-sm font-medium">{c.explanation}</p>
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
