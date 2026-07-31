'use client';

import React, { useEffect, useState } from 'react';
import { api, Decision } from '@/lib/api';
import { GitCommit, User } from 'lucide-react';

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);

  useEffect(() => {
    api.getDecisions().then(setDecisions).catch(console.error);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <GitCommit className="w-8 h-8 text-blue-400" />
          Decision Timeline
        </h1>
        <p className="text-slate-400 text-sm mt-1">Chronological record of all team commitments and architectural choices</p>
      </div>

      <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
        {decisions.map((d) => (
          <div key={d.id} className="relative group">
            <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-slate-950 group-hover:scale-125 transition-transform" />

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-blue-500/40 transition-all">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-white leading-snug">{d.content}</h3>
                {d.owner && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {d.owner}
                  </span>
                )}
              </div>

              {d.rationale && (
                <p className="text-xs text-slate-400 mt-1 italic">
                  Rationale: {d.rationale}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                Verbatim Quote: "{d.source_quote}"
              </div>
            </div>
          </div>
        ))}

        {decisions.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs italic">
            No decisions logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
