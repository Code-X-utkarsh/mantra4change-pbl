'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { monthLabel } from '../../lib/filter-labels';

interface FilterOptions {
  months: string[];
  districts: string[];
  grades: string[];
  subjects: string[];
}

interface FilterBarProps {
  filterOptions: FilterOptions;
  currentFilters: {
    month?: string;
    district?: string;
    block?: string;
    grade?: string;
    subject?: string;
  };
  onChange: (key: string, value: string) => void;
  onReset: () => void;
}

export default function FilterBar({
  filterOptions,
  currentFilters,
  onChange,
  onReset,
}: FilterBarProps) {
  const [blocks, setBlocks] = useState<string[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  // Fetch blocks dynamically when selected district changes
  useEffect(() => {
    if (currentFilters.district) {
      setLoadingBlocks(true);
      fetch(`/api/filters/blocks?district=${encodeURIComponent(currentFilters.district)}`)
        .then(res => res.json())
        .then(res => {
          if (res.success && res.data) {
            setBlocks(res.data.blocks || []);
          } else {
            setBlocks([]);
          }
        })
        .catch(err => {
          console.error('Error fetching blocks:', err);
          setBlocks([]);
        })
        .finally(() => {
          setLoadingBlocks(false);
        });
    } else {
      setBlocks([]);
    }
  }, [currentFilters.district]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap lg:items-end lg:gap-4">
        
        {/* 1. Month Dropdown */}
        <div className="flex flex-col lg:w-48">
          <label htmlFor="select-month" className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Reporting Month
          </label>
          <div className="relative">
            <select
              id="select-month"
              value={currentFilters.month || 'all'}
              onChange={e => onChange('month', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer appearance-none"
            >
              <option value="all">All Months</option>
              {filterOptions.months.map(m => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
              ▾
            </span>
          </div>
        </div>

        {/* 2. District Dropdown */}
        <div className="flex flex-col lg:w-56">
          <label htmlFor="select-district" className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            District
          </label>
          <div className="relative">
            <select
              id="select-district"
              value={currentFilters.district || 'all'}
              onChange={e => onChange('district', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer appearance-none"
            >
              <option value="all">All Districts</option>
              {filterOptions.districts.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
              ▾
            </span>
          </div>
        </div>

        {/* 3. Block Dropdown */}
        <div className="flex flex-col lg:w-56">
          <label htmlFor="select-block" className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Block
          </label>
          <div className="relative">
            <select
              id="select-block"
              value={currentFilters.block || 'all'}
              onChange={e => onChange('block', e.target.value)}
              disabled={!currentFilters.district || loadingBlocks}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer appearance-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">
                {loadingBlocks ? 'Loading blocks...' : currentFilters.district ? 'All Blocks' : 'Select a District first'}
              </option>
              {blocks.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
              ▾
            </span>
          </div>
        </div>

        {/* 4. Grade Dropdown */}
        <div className="flex flex-col lg:w-36">
          <label htmlFor="select-grade" className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Grade
          </label>
          <div className="relative">
            <select
              id="select-grade"
              value={currentFilters.grade || 'all'}
              onChange={e => onChange('grade', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer appearance-none"
            >
              <option value="all">All Grades</option>
              <option value="6">Grade 6</option>
              <option value="7">Grade 7</option>
              <option value="8">Grade 8</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
              ▾
            </span>
          </div>
        </div>

        {/* 5. Subject Dropdown */}
        <div className="flex flex-col lg:w-48">
          <label htmlFor="select-subject" className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Subject
          </label>
          <div className="relative">
            <select
              id="select-subject"
              value={currentFilters.subject || 'all'}
              onChange={e => onChange('subject', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer appearance-none"
            >
              <option value="all">All Subjects</option>
              <option value="Math">Math</option>
              <option value="Science">Science</option>
              <option value="Math and Science">Math and Science</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
              ▾
            </span>
          </div>
        </div>

        {/* Reset Filters Button */}
        <div className="flex items-end">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 rounded-lg px-3 py-2 hover:border-indigo-300 transition-colors w-full lg:w-auto h-[38px] justify-center"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Filters</span>
          </button>
        </div>

      </div>
    </div>
  );
}
