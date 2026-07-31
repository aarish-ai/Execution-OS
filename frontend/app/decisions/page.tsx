'use client';

import { useState, useEffect } from 'react';
import { api, Decision } from '@/lib/api';
import { CheckCircle2, User, Calendar, Filter } from 'lucide-react';

export default function DecisionTimelinePage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [ownerFilter, setOwnerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadDecisions();
  }, [ownerFilter]);

  const loadDecisions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDecisions(ownerFilter || undefined);
      setDecisions(data);
    } catch (err: any) {
      setError('Failed to fetch decisions.');
    } finally {
      setLoading(false);
    }
  };

  const filteredDecisions = decisions.filter((d) => {
    if (!d.created_at) return true;
    const dDate = new Date(d.created_at).toISOString().split('T')[0];
    if (startDate && dDate < startDate) return false;
    if (endDate && dDate > endDate) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Decision Timeline</h1>
        <p className="text-slate-400 text-sm">
          Traceable commitments and architectural choices made across all meetings.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        <input
          type="text"
          placeholder="Filter by owner..."
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
        />

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {(ownerFilter || startDate || endDate) && (
          <button
            onClick={() => {
              setOwnerFilter('');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-blue-400 hover:underline ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Timeline List */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          Loading decisions...
        </div>
      ) : filteredDecisions.length > 0 ? (
        <div className="relative border-l border-slate-800 ml-4 space-y-6 pl-6">
          {filteredDecisions.map((d) => (
            <div key={d.id} className="relative group">
              <div className="absolute -left-[31px] top-1 p-1 rounded-full bg-slate-900 border border-emerald-500/50 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>

              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
                <p className="text-slate-100 text-base font-medium">{d.content}</p>

                {d.rationale && (
                  <p className="text-slate-400 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                    <strong className="text-slate-300 font-semibold">Rationale: </strong>
                    {d.rationale}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Owner: {d.owner || 'Unassigned'}
                  </span>

                  {d.created_at && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(d.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
          No decisions match the selected filters.
        </div>
      )}
    </div>
  );
}
