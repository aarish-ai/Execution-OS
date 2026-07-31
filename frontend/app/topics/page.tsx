'use client';

import React, { useState } from 'react';
import { Tags, MessageSquare, Search } from 'lucide-react';

const mockTopics = [
  {
    name: 'Database Architecture',
    meetings: [
      { title: 'Sprint Architecture Review', date: '2026-07-30', quote: 'Postgres with pgvector handles vector search.', decision: 'Selected Postgres + pgvector' },
      { title: 'Recommendation Engine Spike', date: '2026-07-25', quote: 'Evaluating Redis vs Postgres.', decision: null },
    ]
  },
  {
    name: 'API Protocol',
    meetings: [
      { title: 'Sprint Architecture Review', date: '2026-07-30', quote: 'Revisit GraphQL vs REST API before frontend.', decision: 'Tabled' },
      { title: 'March 12th Planning', date: '2026-03-12', quote: 'Agreed to GraphQL to prevent versioning issues.', decision: 'Selected GraphQL' },
    ]
  }
];

export default function TopicsPage() {
  const [selectedTopic, setSelectedTopic] = useState(mockTopics[0]);
  const [search, setSearch] = useState('');

  const filteredTopics = mockTopics.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Tags className="w-8 h-8 text-purple-400" />
          Topic Threads
        </h1>
        <p className="text-slate-400 text-sm mt-1">Track how subjects evolved across multiple meeting sessions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-4 glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 pl-9 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          </div>

          <div className="space-y-1">
            {filteredTopics.map((top) => (
              <button
                key={top.name}
                onClick={() => setSelectedTopic(top)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedTopic.name === top.name
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {top.name}
              </button>
            ))}
          </div>
        </div>

        {/* Thread Details */}
        <div className="md:col-span-8 glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            Thread: {selectedTopic.name}
          </h2>

          <div className="space-y-4">
            {selectedTopic.meetings.map((m, idx) => (
              <div key={idx} className="p-4 rounded-xl glass-card border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{m.title}</span>
                  <span className="text-slate-500 font-mono">{m.date}</span>
                </div>
                <p className="text-xs text-slate-300 italic">"{m.quote}"</p>
                {m.decision && (
                  <div className="mt-2 px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 text-[11px] font-semibold inline-block border border-blue-500/30">
                    Decision Made: {m.decision}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
