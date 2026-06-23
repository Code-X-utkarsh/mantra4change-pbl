'use client';

import React from 'react';
import RiskBadge from '../ui/RiskBadge';

interface LineItem {
  budgetLine: string;
  approvedUnits: number;
  utilizedUnits: number;
  cumulativeUtilized: number;
  utilizationRate: number;
  note?: string;
}

interface GrantFinance {
  month: string;
  lineItems: LineItem[];
  totalApproved: number;
  totalUtilized: number;
  overallUtilizationRate: number;
}

interface GrantPerformance {
  pblCompletionRate: number;
  evidenceSubmissionRate: number;
  attendanceRate: number;
  totalEnrollment: number;
  totalAttendance: number;
  riskStatus: string;
  milestoneSummary: string;
  draftReportText: string;
}

interface EvidenceMedia {
  recordId: string;
  recordType: string;
  title: string;
  summaryOrCaption: string;
  fileName: string;
  relativePath: string;
  usageNote: string;
}

interface GrantProfile {
  grantId: string;
  grantName: string;
  donor: string;
  periodStart: string;
  periodEnd: string;
  coveredDistricts: string[];
}

interface GrantDetailResponse {
  grant: GrantProfile;
  finance: GrantFinance;
  performance: GrantPerformance | null;
  evidence: EvidenceMedia[];
  availableMonths: string[];
}

interface GrantFactPanelProps {
  grantDetail: GrantDetailResponse;
}

// Risk classifier helper for individual metrics
function rateClassifyRisk(rate: number): 'On Track' | 'Behind' | 'At Risk' | 'Critical' {
  if (rate >= 75) return 'On Track';
  if (rate >= 60) return 'Behind';
  if (rate >= 35) return 'At Risk';
  return 'Critical';
}

export default function GrantFactPanel({ grantDetail }: GrantFactPanelProps) {
  const { finance, performance, evidence } = grantDetail;

  // Helper to determine color of utilization progress bar
  const getProgressBarColor = (rate: number) => {
    if (rate < 50) return 'bg-green-500';
    if (rate <= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      
      {/* SECTION 1 — Budget Utilization */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
          Budget Utilization
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50/75">
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Budget Line
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Approved Units
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Utilized (Month)
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Cumulative
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-48">
                  Utilization %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {finance.lineItems.map((item, idx) => {
                const widthPercent = Math.min(item.utilizationRate, 100);
                const barColor = getProgressBarColor(item.utilizationRate);

                return (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.budgetLine}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {item.approvedUnits.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {item.utilizedUnits.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {item.cumulativeUtilized.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="space-y-1">
                        <span className="font-semibold text-gray-900">
                          {item.utilizationRate.toFixed(2)}%
                        </span>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${barColor}`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Totals Row */}
              <tr className="bg-gray-50/50 font-bold border-t-2 border-gray-200">
                <td className="px-4 py-3.5 text-sm text-gray-900">Total</td>
                <td className="px-4 py-3.5 text-sm text-right text-gray-900">
                  {finance.totalApproved.toLocaleString()}
                </td>
                <td className="px-4 py-3.5 text-sm text-right text-gray-900">
                  {finance.totalUtilized.toLocaleString()}
                </td>
                <td className="px-4 py-3.5 text-sm text-right text-gray-900">
                  {finance.lineItems.reduce((acc, item) => acc + item.cumulativeUtilized, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3.5 text-sm">
                  <div className="space-y-1">
                    <span className="text-gray-900">
                      {finance.overallUtilizationRate.toFixed(2)}%
                    </span>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${getProgressBarColor(finance.overallUtilizationRate)}`}
                        style={{ width: `${Math.min(finance.overallUtilizationRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2 — Program Performance */}
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
          Performance Metrics
        </h2>

        {performance ? (
          <div className="space-y-6">
            {/* 4 Metric Tiles Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* PBL Completion Rate */}
              <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between h-28">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  PBL Completion
                </span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {performance.pblCompletionRate}%
                  </span>
                  <RiskBadge status={rateClassifyRisk(performance.pblCompletionRate)} />
                </div>
              </div>

              {/* Evidence Submission Rate */}
              <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between h-28">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Evidence Submitted
                </span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {performance.evidenceSubmissionRate}%
                  </span>
                  <RiskBadge status={rateClassifyRisk(performance.evidenceSubmissionRate)} />
                </div>
              </div>

              {/* Attendance Rate */}
              <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between h-28">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Attendance Rate
                </span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {performance.attendanceRate}%
                  </span>
                  <RiskBadge status={rateClassifyRisk(performance.attendanceRate)} />
                </div>
              </div>

              {/* Schools Sampled */}
              <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between h-28">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Schools Sampled
                </span>
                <div className="flex items-baseline mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {performance.totalEnrollment.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">students</span>
                </div>
              </div>
            </div>

            {/* Milestone Summary & Risk Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50/50 border-l-4 border-indigo-400 p-4 rounded-r-lg">
                <span className="block text-xs font-semibold uppercase tracking-wider text-indigo-900 mb-1">
                  Milestone Status
                </span>
                <p className="text-sm text-indigo-950 leading-relaxed font-medium">
                  {performance.milestoneSummary}
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                    Overall Risk Status
                  </span>
                  <p className="text-sm text-gray-600">Based on participation levels</p>
                </div>
                <div className="scale-110 pr-2">
                  <RiskBadge status={performance.riskStatus} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No performance metrics reported for this period.</p>
        )}
      </div>

      {/* SECTION 3 — Evidence & Media */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
          Linked Evidence & Media
        </h2>

        {evidence.length === 0 ? (
          <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">
            No evidence records for this grant/month.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidence.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between hover:border-gray-300 transition-all">
                <div className="space-y-2">
                  {/* Record type badge */}
                  <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {item.recordType}
                  </span>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                    {item.summaryOrCaption}
                  </p>
                </div>
                
                <div className="mt-4 border-t border-gray-100 pt-2 flex flex-col gap-0.5">
                  <div className="text-[10px] text-gray-400 font-mono">
                    File: {item.fileName}
                  </div>
                  {item.usageNote && (
                    <div className="text-[10px] italic text-gray-400">
                      Note: {item.usageNote}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
