import React from 'react';

export default function GrantEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center bg-indigo-50 rounded-xl p-12 border border-indigo-100 space-y-4 max-w-4xl mx-auto mt-6">
      <span className="text-5xl" role="img" aria-label="chart">
        📊
      </span>
      <h3 className="text-lg font-bold text-indigo-950">Select a grant to begin</h3>
      <p className="text-sm text-indigo-800/80 max-w-lg leading-relaxed">
        Choose a grant and reporting month above to view finance data, program outcomes, linked evidence, and generate a report section.
      </p>
    </div>
  );
}
