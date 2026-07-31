'use client';

import React, { useEffect, useState } from 'react';
import { api, TaskItem } from '@/lib/api';
import { UserCheck, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function AccountabilityPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    api.getTasks().then(setTasks).catch(console.error);
  }, []);

  const groupedTasks: { [owner: string]: TaskItem[] } = {};
  tasks.forEach((t) => {
    const owner = t.owner || 'Unassigned';
    if (!groupedTasks[owner]) groupedTasks[owner] = [];
    groupedTasks[owner].push(t);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-emerald-400" />
          Accountability Board
        </h1>
        <p className="text-slate-400 text-sm mt-1">Per-person load, assigned commitments, and overdue tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedTasks).map(([owner, ownerTasks]) => {
          const completedCount = ownerTasks.filter((t) => t.status === 'done').length;
          const overdueCount = ownerTasks.filter((t) => t.status === 'overdue').length;

          return (
            <div key={owner} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{owner}</h3>
                  <span className="text-xs text-slate-400 font-mono">{ownerTasks.length} Assigned Items</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    {completedCount} Done
                  </span>
                  {overdueCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                      {overdueCount} Overdue
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {ownerTasks.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-start justify-between gap-2">
                    <div>
                      <p className="text-slate-200 font-medium">{t.description}</p>
                      {t.deadline && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Deadline: {t.deadline}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                        t.status === 'done'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : t.status === 'overdue'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {Object.keys(groupedTasks).length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs italic">
            No tasks assigned yet.
          </div>
        )}
      </div>
    </div>
  );
}
