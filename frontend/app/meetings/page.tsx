'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, MeetingSummary } from '@/lib/api';
import { Plus, Video, Trash2, ExternalLink } from 'lucide-react';

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    try {
      const data = await api.getMeetings();
      setMeetings(data);
    } catch (err) {
      console.error(err);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !transcript) return;
    setSubmitting(true);
    try {
      const res = await api.createMeeting(title, transcript);
      setIsModalOpen(false);
      setTitle('');
      setTranscript('');
      router.push(`/meetings/${res.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await api.deleteMeeting(id);
      loadMeetings();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Meeting Intelligence</h1>
          <p className="text-slate-400 text-sm mt-1">Paste raw transcripts to extract structured action items</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Meeting
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetings.map((m) => {
          const score = m.health_score ?? 0.5;
          let badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
          if (score >= 0.7) badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
          if (score < 0.4) badgeColor = 'bg-red-500/20 text-red-400 border-red-500/40';

          return (
            <div
              key={m.id}
              onClick={() => router.push(`/meetings/${m.id}`)}
              className="glass-card rounded-2xl p-6 hover:border-blue-500/50 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Video className="w-4 h-4 text-blue-400" />
                    <span>{new Date(m.meeting_date).toLocaleDateString()}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                    {(score * 100).toFixed(0)}% Health
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {m.summary || 'Summary processing...'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Enter Room <ExternalLink className="w-3 h-3" />
                </span>
                <button
                  onClick={(e) => handleDelete(m.id, e)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all"
                  title="Delete Meeting"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {meetings.length === 0 && (
          <div className="col-span-full glass-panel rounded-2xl p-12 text-center border-dashed border-2 border-slate-800">
            <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Meetings Ingested</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Paste your first raw meeting transcript to automatically extract decisions, tasks, and contradiction alerts.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-500/20"
            >
              Paste Transcript Now
            </button>
          </div>
        )}
      </div>

      {/* Modal for Transcript Paste */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-slate-800 shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-1">New Meeting Transcript</h2>
            <p className="text-xs text-slate-400 mb-6">
              Paste plain text or speaker-labeled lines (e.g. "Ahmed: ...").
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Meeting Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint Architecture & API Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Raw Transcript Text
                </label>
                <textarea
                  required
                  rows={10}
                  placeholder={`Ahmed: Let's discuss DB architecture...
Sarah: Postgres with pgvector is optimal.
Omar: I will set up the schema by Thursday.`}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2"
                >
                  {submitting ? 'Processing Pipeline...' : 'Process Transcript →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
