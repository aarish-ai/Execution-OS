import './globals.css';
import React from 'react';
import Navigation from '@/components/layout/Navigation';

export const metadata = {
  title: 'AI Execution OS',
  description: 'Meeting intelligence system for team leads',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen bg-slate-950 text-slate-100 antialiased">
        <Navigation />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
