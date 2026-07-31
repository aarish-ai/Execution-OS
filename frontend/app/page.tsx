'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, MeetingSummary, TaskItem } from '@/lib/api';
import { CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Calendar, ArrowRight, ShieldAlert } from 'lucide-react';

export default function CommandCenter() {
  const [weeklyBrief, setWeeklyBrief] = useState<string>('');
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [openTasks, setOpenTasks] = useState<TaskItem[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [mRes, tRes, oRes, bRes] = await Promise.all([
          api.getMeetings().catch(() => []),
          api.getTasks(undefined, 'open').catch(() => []),
          api.getOverdueTasks().catch(() => []),
          api.getWeeklyBrief().catch(() => ({ content: '# Weekly Execution Brief\nNo brief generated yet.' })),
        ]);
        setMeetings(mRes);
        setOpenTasks(tRes);
        setOverdueTasks(oRes);
        setWeeklyBrief(bRes.content);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRegenerateBrief = async () => {
    setLoadingBrief(true);
    try {
      const res = await api.generateWeeklyBrief();
      setWeeklyBrief(res.content);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBrief(false);
    }
  };

  const totalContradictions = meetings.reduce((acc, m) => acc + (m.health_score && m.health_score < 0.4 ? 1 : 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Command Center</h1>
          <p className="text-slate-400 text-sm mt-1">Daily overview & team execution health</p>
        </div>
        <Link
          href="/meetings"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
        >
          New Transcript +
        </Link>
      </div>

      {/* Weekly Brief Pinned Top Card */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-blue-500/20 shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              PINNED BRIEF
            </span>
            <h2 className="text-lg font-bold text-white">Weekly Execution Brief</h2>
          </div>
          <button
            onClick={handleRegenerateBrief}
            disabled={loadingBrief}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingBrief ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
        <div className="prose prose-invert max-w-none text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-sans">
          {weeklyBrief}
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/accountability" className="glass-card rounded-2xl p-6 hover:border-blue-500/40 transition-all group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Tasks This Week</span>
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors">
            {openTasks.length}
          </div>
          <p className="text-xs text-slate-400 mt-2">Active assigned commitments</p>
        </Link>

        <Link href="/accountability" className="glass-card rounded-2xl p-6 border-red-500/30 hover:border-red-500/60 transition-all group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Overdue Items</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-black text-red-400 group-hover:scale-105 transition-transform">
            {overdueTasks.length}
          </div>
          <p className="text-xs text-slate-400 mt-2">Passed deadline without completion</p>
        </Link>

        <div className="glass-card rounded-2xl p-6 border-indigo-500/30">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Contradiction Alerts</span>
            <ShieldAlert className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-white">{totalContradictions}</span>
            {totalContradictions > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                Action Req
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">Conflict with prior decisions</p>
        </div>
      </div>

      {/* Grid: Next Meeting Prep & Drift */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Meeting Prep */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Next Meeting Prep</h3>
          </div>
          <div className="space-y-3">
            {openTasks.slice(0, 3).map((t) => (
              <div key={t.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-400 uppercase">{t.owner}</span>
                  <p className="text-xs text-slate-200 mt-0.5">{t.description}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Open Task</span>
              </div>
            ))}
            {openTasks.length === 0 && (
              <p className="text-xs text-slate-400 italic">No pending prep items from previous meeting.</p>
            )}
          </div>
        </div>

        {/* Drift Alerts */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Drift Alerts</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <span className="font-semibold">API Architecture:</span> Discussed across 3 meetings with no logged decision.
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <span className="font-semibold">Mobile App V1:</span> Revisited repeatedly in past sessions.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Meetings Table */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Recent Meetings</h3>
          <Link href="/meetings" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Health Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {meetings.map((m) => {
                const score = m.health_score ?? 0.5;
                let badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
                if (score >= 0.7) badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
                if (score < 0.4) badgeColor = 'bg-red-500/20 text-red-400 border-red-500/40';

                return (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{m.title}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {new Date(m.meeting_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
                        {(score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/meetings/${m.id}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 rounded-lg transition-all"
                      >
                        Open Room →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {meetings.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 text-xs italic">
                    No meetings recorded yet. Paste a transcript to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
