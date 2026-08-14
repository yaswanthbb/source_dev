'use client';

import React from 'react';
import { MessageSquare, HelpCircle } from 'lucide-react';

export default function StudentQaPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-primary tracking-tight">
          Q&A Discussions
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Ask questions on any concept and get answers from verified instructors.
        </p>
      </div>

      <div className="p-12 text-center bg-surface border border-border rounded-2xl shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-accent-tint text-accent flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold font-display text-text-primary">
          Concept Discussions Hub
        </h2>
        <p className="text-xs text-text-secondary max-w-md mx-auto mt-2 leading-relaxed">
          Q&A threads are directly integrated within each concept reader page. You can ask questions while studying any concept, and instructors will provide verified explanations.
        </p>
      </div>
    </div>
  );
}
