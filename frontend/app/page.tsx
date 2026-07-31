'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { api, MeetingSummary, Task, DriftAlert } from '@/lib/api';
import {
  FileText,
  CheckSquare,
  AlertTriangle,
  Flame,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import Link from 'next/link';

export default function CommandCenter() {
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [driftAlerts, setDriftAlerts] = useState<DriftAlert[]>([]);
  const [weeklyBrief, setWeeklyBrief] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [meetingsRes, tasksRes, driftRes, briefRes] = await Promise.allSettled([
          api.getMeetings(),
          api.getTasks(),
          api.getDriftAlerts(),
          api.getWeeklyBrief(),
        ]);

        if (meetingsRes.status === 'fulfilled') setMeetings(meetingsRes.value);
        if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value);
        if (driftRes.status === 'fulfilled') setDriftAlerts(driftRes.value);
        if (briefRes.status === 'fulfilled') setWeeklyBrief(briefRes.value.content);
      } catch (err: any) {
        setError('Failed to load Command Center data. Please check connection.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const handleGenerateBrief = async () => {
    try {
      setGeneratingBrief(true);
      const res = await api.generateWeeklyBrief();
      setWeeklyBrief(res.content);
    } catch (err) {
      setError('Failed to generate weekly brief.');
    } finally {
      setGeneratingBrief(false);
    }
  };

  const handleCopyBrief = () => {
    if (weeklyBrief) {
      navigator.clipboard.writeText(weeklyBrief);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalContradictions = meetings.reduce(
    (acc, m) => acc + (m.contradictions_count || 0),
    0
  );

  const openTasks = tasks.filter((t) => t.status === 'open' || t.status === 'in_progress');
  const overdueTasks = tasks.filter((t) => t.status === 'overdue');

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/40 border border-slate-800 p-8 backdrop-blur-xl">
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent">
            Executive Command Center
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Live team execution intelligence, contradiction flags, and automated commitment tracking.
          </p>
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
            <span>Total Meetings</span>
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-slate-100">{meetings.length}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
            <span>Active Contradictions</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-slate-100">{totalContradictions}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
            <span>Open Tasks</span>
            <CheckSquare className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-slate-100">{openTasks.length}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
            <span>Overdue Tasks</span>
            <Flame className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-3xl font-bold text-rose-400">{overdueTasks.length}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Execution Brief */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Weekly Execution Brief
              </h2>
              <div className="flex items-center gap-2">
                {weeklyBrief && (
                  <button
                    onClick={handleCopyBrief}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Markdown'}
                  </button>
                )}
                <button
                  onClick={handleGenerateBrief}
                  disabled={generatingBrief}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generatingBrief ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
            </div>

            {loading ? (
              <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                Loading weekly brief...
              </div>
            ) : weeklyBrief ? (
              <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
                <ReactMarkdown>{weeklyBrief}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-8 text-center">
                No weekly brief generated yet. Click "Regenerate" to create one.
              </p>
            )}
          </div>
        </div>

        {/* Drift Alerts Side Panel */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Drift & Risk Alerts
            </h2>

            {driftAlerts.length > 0 ? (
              <div className="space-y-3">
                {driftAlerts.map((drift) => (
                  <div
                    key={drift.id}
                    className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 space-y-1 text-sm"
                  >
                    <p className="text-amber-200 font-medium">{drift.topic_name}</p>
                    <p className="text-slate-400 text-xs">
                      Discussed across <span className="text-slate-200 font-semibold">{drift.meeting_count}</span> meetings without resolution.
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                No drift detected across recent meetings.
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/topics"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
              >
                View all Topic Threads <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
