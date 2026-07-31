'use client';

import { useState, useEffect } from 'react';
import { api, Task } from '@/lib/api';
import { CheckSquare, Clock, AlertCircle, CheckCircle2, User, Filter } from 'lucide-react';

export default function AccountabilityPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadTasks();
  }, [ownerFilter, statusFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTasks(ownerFilter || undefined, statusFilter || undefined);
      setTasks(data);
    } catch (err: any) {
      setError('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Task['status']) => {
    try {
      await api.updateTaskStatus(id, newStatus);
      loadTasks();
    } catch (err: any) {
      setError('Failed to update task status.');
    }
  };

  const statusBadge = (status: Task['status']) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            <Clock className="w-3 h-3" /> Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
            <AlertCircle className="w-3 h-3" /> Overdue
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Accountability Board</h1>
        <p className="text-slate-400 text-sm">
          Per-person commitments, deadlines, and overdue action items.
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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Tasks Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          Loading tasks...
        </div>
      ) : tasks.length > 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Task Description</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-100">{task.description}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      {task.owner}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                  </td>
                  <td className="px-6 py-4">{statusBadge(task.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
          No tasks found matching filters.
        </div>
      )}
    </div>
  );
}
