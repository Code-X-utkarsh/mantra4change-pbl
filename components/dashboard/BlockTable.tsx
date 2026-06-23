'use client';

import React, { useState } from 'react';
import { ArrowUpDown, Award, AlertTriangle, Inbox, Compass } from 'lucide-react';
import RiskBadge from '../ui/RiskBadge';

interface BlockSummary {
  block: string;
  totalSchools: number;
  participationRate: number;
  evidenceRate: number;
  attendanceRate: number;
  totalEnrollment: number;
  riskStatus: string;
  performanceTier: 'high' | 'mid' | 'low';
}

interface BlockTableProps {
  blocks: BlockSummary[];
  isLoading: boolean;
  activeDistrict?: string;
}

function getRiskTextColor(rate: number): string {
  if (rate >= 75) return 'text-green-600 font-semibold';
  if (rate >= 60) return 'text-yellow-600 font-semibold';
  if (rate >= 35) return 'text-orange-600 font-semibold';
  return 'text-red-600 font-semibold';
}

export default function BlockTable({ blocks, isLoading, activeDistrict }: BlockTableProps) {
  const [sortKey, setSortKey] = useState<string>('participationRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  // 1. Check if a district is active. If not, show selection prompt.
  if (!activeDistrict) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <Compass className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-gray-900">No District Selected</h3>
        <p className="mt-1 text-xs text-gray-500 max-w-xs">
          Select a district in the filter bar above to view the block-level breakdown.
        </p>
      </div>
    );
  }

  // Sort blocks client-side based on user selection
  const sortedBlocks = [...blocks].sort((a, b) => {
    const aVal = a[sortKey as keyof BlockSummary];
    const bVal = b[sortKey as keyof BlockSummary];

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    } else {
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    }
  });

  // Extract top performers and follow-up lists based on performanceTier
  const topPerformers = blocks
    .filter(b => b.performanceTier === 'high')
    .map(b => b.block);

  const followUpBlocks = blocks
    .filter(b => b.performanceTier === 'low')
    .map(b => b.block);

  return (
    <div className="space-y-4">
      {/* 1. Performer summary lines */}
      {!isLoading && blocks.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Top Performers Panel */}
          {topPerformers.length > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-green-100 bg-green-50/30 p-3 text-sm text-gray-700">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                <Award className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="font-semibold text-green-800">Top Performers: </span>
                <span className="font-medium text-gray-700">{topPerformers.join(', ')}</span>
              </div>
            </div>
          )}

          {/* Need Follow-up Panel */}
          {followUpBlocks.length > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50/20 p-3 text-sm text-gray-700">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="font-semibold text-red-800">Need Follow-up: </span>
                <span className="font-medium text-gray-700">{followUpBlocks.join(', ')}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Sortable Table Container */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-gray-600">
            <thead className="border-b border-gray-200 bg-gray-50/70 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                {/* Column Headers */}
                <th
                  onClick={() => handleSort('block')}
                  className="cursor-pointer px-6 py-4 hover:bg-gray-100/50 hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Block</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalSchools')}
                  className="cursor-pointer px-6 py-4 hover:bg-gray-100/50 hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Schools</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('participationRate')}
                  className="cursor-pointer px-6 py-4 hover:bg-gray-100/50 hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Participation %</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('evidenceRate')}
                  className="cursor-pointer px-6 py-4 hover:bg-gray-100/50 hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Evidence %</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('attendanceRate')}
                  className="cursor-pointer px-6 py-4 hover:bg-gray-100/50 hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Attendance %</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalEnrollment')}
                  className="cursor-pointer px-6 py-4 hover:bg-gray-100/50 hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Enrollment</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('riskStatus')}
                  className="cursor-pointer px-6 py-4 hover:bg-gray-100/50 hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Risk Status</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                // Render skeleton placeholder rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4.5"><div className="h-4 w-28 rounded bg-gray-100" /></td>
                    <td className="px-6 py-4.5"><div className="ml-auto h-4 w-12 rounded bg-gray-100" /></td>
                    <td className="px-6 py-4.5"><div className="ml-auto h-4 w-16 rounded bg-gray-100" /></td>
                    <td className="px-6 py-4.5"><div className="ml-auto h-4 w-16 rounded bg-gray-100" /></td>
                    <td className="px-6 py-4.5"><div className="ml-auto h-4 w-16 rounded bg-gray-100" /></td>
                    <td className="px-6 py-4.5"><div className="ml-auto h-4 w-20 rounded bg-gray-100" /></td>
                    <td className="px-6 py-4.5"><div className="h-6 w-20 rounded-md bg-gray-100" /></td>
                  </tr>
                ))
              ) : sortedBlocks.length === 0 ? (
                // Render Empty State
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-8 w-8 text-gray-300" />
                      <span className="text-sm font-medium">No block data available</span>
                    </div>
                  </td>
                </tr>
              ) : (
                // Render real data rows
                sortedBlocks.map(item => {
                  let tierBorderClass = '';
                  if (item.performanceTier === 'high') {
                    tierBorderClass = 'border-l-4 border-l-green-400';
                  } else if (item.performanceTier === 'low') {
                    tierBorderClass = 'border-l-4 border-l-red-400';
                  }

                  return (
                    <tr
                      key={item.block}
                      className={`hover:bg-gray-50/50 transition-colors duration-150 ${tierBorderClass}`}
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-gray-900">
                        {item.block}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-gray-800">
                        {item.totalSchools.toLocaleString()}
                      </td>
                      <td className={`whitespace-nowrap px-6 py-4 text-right ${getRiskTextColor(item.participationRate)}`}>
                        {item.participationRate}%
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-gray-800">
                        {item.evidenceRate}%
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-gray-800">
                        {item.attendanceRate}%
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-gray-800">
                        {item.totalEnrollment.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <RiskBadge status={item.riskStatus} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
