'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Video, HelpCircle, GitCommit, Tags, UserCheck } from 'lucide-react';

const navItems = [
  { label: 'Command Center', href: '/', icon: LayoutDashboard },
  { label: 'Meetings', href: '/meetings', icon: Video },
  { label: 'Ask Anything', href: '/ask', icon: HelpCircle },
  { label: 'Decisions', href: '/decisions', icon: GitCommit },
  { label: 'Topic Threads', href: '/topics', icon: Tags },
  { label: 'Accountability', href: '/accountability', icon: UserCheck },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/80 backdrop-blur-xl flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
          OS
        </div>
        <div>
          <h1 className="font-bold text-lg text-white leading-none">Execution OS</h1>
          <span className="text-xs text-blue-400 font-mono">v1.0 • Intelligence</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
        <span>Team Lead Workspace</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Ready" />
      </div>
    </aside>
  );
}
