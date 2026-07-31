'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, MeetingSummary } from '@/lib/api';
import { FileText, Plus, Trash2, Calendar, AlertTriangle } from 'lucide-react';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Meeting Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [rawTranscript, setRawTranscript] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMeetings();
      setMeetings(data);
    } catch (err: any) {
      setError('Failed to fetch meetings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rawTranscript) return;

    try {
      setSubmitting(true);
      await api.createMeeting(title, rawTranscript);
      setIsModalOpen(false);
      setTitle('');
      setRawTranscript('');
      loadMeetings();
    } catch (err: any) {
      setError('Failed to ingest meeting transcript.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeeting = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this meeting?')) return;

    try {
      await api.deleteMeeting(id);
      loadMeetings();
    } catch (err: any) {
      setError('Failed to delete meeting.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Meeting Intelligence</h1>
          <p className="text-slate-400 text-sm">
            Ingest meeting transcripts and view automated decision extractions.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Ingest New Meeting
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Meetings List */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          Loading meetings...
        </div>
      ) : meetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((m) => (
            <Link
              key={m.id}
              href={`/meetings/${m.id}`}
              className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md hover:border-slate-700 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/5 block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <button
                  onClick={(e) => handleDeleteMeeting(e, m.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete meeting"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors mb-2 line-clamp-1">
                {m.title}
              </h3>

              <p className="text-slate-400 text-xs line-clamp-2 mb-4">
                {m.summary || 'Processing transcript...'}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(m.created_at || m.meeting_date).toLocaleDateString()}
                </span>

                {m.contradictions_count > 0 && (
                  <span className="flex items-center gap-1 text-amber-400 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {m.contradictions_count} Flag
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl space-y-4">
          <FileText className="w-8 h-8 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-slate-300 font-medium">No meetings ingested yet</h3>
            <p className="text-slate-500 text-xs mt-1">
              Click "Ingest New Meeting" to analyze a transcript.
            </p>
          </div>
        </div>
      )}

      {/* Ingest Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100">Ingest Meeting Transcript</h2>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sprint Architecture Sync"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Raw Transcript
                </label>
                <textarea
                  required
                  rows={8}
                  value={rawTranscript}
                  onChange={(e) => setRawTranscript(e.target.value)}
                  placeholder="Paste conversation transcript here..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
                >
                  {submitting ? 'Processing...' : 'Run Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
