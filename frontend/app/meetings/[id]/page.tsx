'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api, MeetingDetail, TaskItem } from '@/lib/api';
import { ArrowLeft, CheckCircle, AlertTriangle, ShieldAlert, Sparkles, User, Calendar, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

export default function MeetingRoomPage() {
  const params = useParams();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'decisions' | 'tasks' | 'questions'>('decisions');
  const [showSummary, setShowSummary] = useState(true);
  const [hoveredAlert, setHoveredAlert] = useState<string | null>(null);

  const chunkRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    loadMeetingDetail();
  }, [meetingId]);

  async function loadMeetingDetail() {
    try {
      const data = await api.getMeeting(meetingId);
      setMeeting(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const scrollToChunk = (chunkIndex: number) => {
    const el = chunkRefs.current[chunkIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-blue-500');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-blue-500');
      }, 2000);
    }
  };

  const handleTaskStatusToggle = async (task: TaskItem) => {
    const nextStatus = task.status === 'done' ? 'open' : 'done';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      loadMeetingDetail();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 text-sm">
        Loading Meeting Room...
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-12 text-slate-400">
        Meeting not found.
      </div>
    );
  }

  const healthScore = meeting.health_score ?? 0.5;
  let healthBadge = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  if (healthScore >= 0.7) healthBadge = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  if (healthScore < 0.4) healthBadge = 'bg-red-500/20 text-red-400 border-red-500/40';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/meetings"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{meeting.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${healthBadge}`}>
                {(healthScore * 100).toFixed(0)}% Health Score
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                {new Date(meeting.meeting_date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                {meeting.chunks.length} Transcript Chunks
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowSummary(!showSummary)}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          {showSummary ? 'Hide Summary' : 'Show Summary'}
          {showSummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Collapsible Executive Summary Card */}
      {showSummary && meeting.summary && (
        <div className="glass-panel rounded-2xl p-4 border border-blue-500/20 text-xs text-slate-300 leading-relaxed shrink-0">
          <span className="font-bold text-blue-400 uppercase tracking-wider block mb-1">
            Executive Outcome Summary
          </span>
          {meeting.summary}
        </div>
      )}

      {/* Split-pane Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* LEFT PANE — Transcript (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Meeting Transcript
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Decision</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Task</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Question</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Alert</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-sans text-xs">
            {meeting.chunks.map((chunk) => {
              const isDecision = meeting.decisions.some(d => d.transcript_position === chunk.chunk_index);
              const taskMatch = meeting.tasks.find(t => t.transcript_position === chunk.chunk_index);
              const isQuestion = meeting.open_questions.some(q => q.content.includes(chunk.content.slice(0, 20)));
              const alertMatch = meeting.contradictions.find(c => c.conflicting_quote.includes(chunk.content.slice(0, 20)));

              let highlightClass = 'hover:bg-slate-800/40';
              if (alertMatch) highlightClass = 'highlight-contradiction';
              else if (isDecision) highlightClass = 'highlight-decision';
              else if (taskMatch) highlightClass = 'highlight-task';
              else if (isQuestion) highlightClass = 'highlight-question';

              return (
                <div
                  key={chunk.id}
                  ref={(el) => { chunkRefs.current[chunk.chunk_index] = el; }}
                  className={`p-3 rounded-xl transition-all relative group ${highlightClass}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">
                      {chunk.speaker || 'Speaker'}
                    </span>
                    <div className="flex items-center gap-2">
                      {taskMatch && (
                        <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-semibold text-[10px]">
                          Owner: {taskMatch.owner}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        #{chunk.chunk_index}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-normal">
                    {chunk.content}
                  </p>

                  {/* Tooltip for contradiction */}
                  {alertMatch && (
                    <div className="mt-2 p-2 rounded-lg bg-red-950/80 border border-red-500/40 text-[11px] text-red-200">
                      <div className="font-semibold flex items-center gap-1 text-red-400">
                        <AlertTriangle className="w-3 h-3" /> Contradiction Flagged
                      </div>
                      <p className="mt-0.5">{alertMatch.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE — Extraction Cards (5 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col min-h-0">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl mb-4 border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('decisions')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'decisions'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Decisions ({meeting.decisions.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'tasks'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tasks ({meeting.tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'questions'
                  ? 'bg-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Questions ({meeting.open_questions.length})
            </button>
          </div>

          {/* Cards Content Scroll */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {/* DECISIONS TAB */}
            {activeTab === 'decisions' && (
              <div className="space-y-3">
                {meeting.decisions.map((d) => (
                  <div key={d.id} className="p-4 rounded-xl glass-card border border-blue-500/20 hover:border-blue-500/40 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-white leading-snug">{d.content}</p>
                      {d.owner && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-semibold shrink-0">
                          {d.owner}
                        </span>
                      )}
                    </div>
                    {d.rationale && (
                      <p className="text-[11px] text-slate-400 mt-2 italic">
                        Rationale: {d.rationale}
                      </p>
                    )}
                    <button
                      onClick={() => scrollToChunk(d.transcript_position)}
                      className="mt-3 text-[11px] font-semibold text-blue-400 hover:underline flex items-center gap-1"
                    >
                      View Source Chunk #{d.transcript_position} →
                    </button>
                  </div>
                ))}
                {meeting.decisions.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-6">No decisions extracted.</p>
                )}
              </div>
            )}

            {/* TASKS TAB */}
            {activeTab === 'tasks' && (
              <div className="space-y-3">
                {meeting.tasks.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl glass-card border border-orange-500/20 hover:border-orange-500/40 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-xs font-bold text-orange-400 uppercase">{t.owner}</span>
                      </div>
                      <button
                        onClick={() => handleTaskStatusToggle(t)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                          t.status === 'done'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {t.status.toUpperCase()}
                      </button>
                    </div>

                    <p className="text-xs text-slate-200 mt-2 font-medium">{t.description}</p>
                    {t.deadline && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Deadline: <span className="text-slate-200 font-mono">{t.deadline}</span>
                      </p>
                    )}

                    <button
                      onClick={() => scrollToChunk(t.transcript_position)}
                      className="mt-3 text-[11px] font-semibold text-orange-400 hover:underline flex items-center gap-1"
                    >
                      View Source Chunk #{t.transcript_position} →
                    </button>
                  </div>
                ))}
                {meeting.tasks.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-6">No tasks assigned.</p>
                )}
              </div>
            )}

            {/* QUESTIONS TAB */}
            {activeTab === 'questions' && (
              <div className="space-y-3">
                {meeting.open_questions.map((q) => (
                  <div key={q.id} className="p-4 rounded-xl glass-card border border-yellow-500/20 hover:border-yellow-500/40 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-white leading-snug">{q.content}</p>
                      {q.raised_by && (
                        <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-[10px] font-semibold shrink-0">
                          {q.raised_by}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        Status: {q.resolved ? 'Resolved' : 'Open'}
                      </span>
                    </div>
                  </div>
                ))}
                {meeting.open_questions.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-6">No open questions raised.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
