'use client';

import React from 'react';
import { monthLabel } from '../../lib/filter-labels';

interface Grant {
  grantId: string;
  grantName: string;
  donor: string;
  periodStart: string;
  periodEnd: string;
  coveredDistricts: string[];
}

interface GrantSelectorProps {
  grants: Grant[];
  currentGrantId?: string;
  currentMonth?: string;
  availableMonths: string[];
  onChange: (key: string, value: string) => void;
}

export default function GrantSelector({
  grants,
  currentGrantId,
  currentMonth,
  availableMonths,
  onChange,
}: GrantSelectorProps) {
  // Find selected grant object
  const selectedGrant = grants.find(g => g.grantId === currentGrantId);

  // Handle changing grant ID
  const handleGrantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange('grantId', val);
  };

  // Handle changing month
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange('month', val);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left selector — Grant */}
        <div className="flex flex-col">
          <label htmlFor="grant-select" className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Grant
          </label>
          <div className="relative">
            <select
              id="grant-select"
              value={currentGrantId || ''}
              onChange={handleGrantChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer appearance-none"
            >
              <option value="" disabled>
                Select a Grant
              </option>
              {grants.map(g => (
                <option key={g.grantId} value={g.grantId}>
                  {g.grantName} ({g.grantId})
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
              ▾
            </span>
          </div>
          
          {/* Hint line of covered districts */}
          {selectedGrant && selectedGrant.coveredDistricts && selectedGrant.coveredDistricts.length > 0 && (
            <p className="mt-1.5 text-xs text-gray-500">
              <span className="font-medium text-gray-700">Covers:</span>{' '}
              {selectedGrant.coveredDistricts.join(', ')}
            </p>
          )}
        </div>

        {/* Right selector — Reporting Month */}
        <div className="flex flex-col">
          <label htmlFor="month-select" className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Reporting Month
          </label>
          <div className="relative">
            <select
              id="month-select"
              value={currentMonth || ''}
              onChange={handleMonthChange}
              disabled={!currentGrantId}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer appearance-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {!currentGrantId ? (
                <option value="" disabled>
                  Select a month
                </option>
              ) : (
                <>
                  <option value="" disabled>
                    Select a month
                  </option>
                  {availableMonths.map(m => (
                    <option key={m} value={m}>
                      {monthLabel(m)}
                    </option>
                  ))}
                </>
              )}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
              ▾
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
