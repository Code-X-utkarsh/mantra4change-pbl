'use client';

import React, { useState, useEffect } from 'react';
import { buildDeterministicNarrative } from '../../lib/narrative-templates';
import { monthLabel } from '../../lib/filter-labels';
import { AlertCircle, Copy, Check, Sparkles, FileText } from 'lucide-react';

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
  totalApproved: number;
  totalUtilized: number;
  overallUtilizationRate: number;
  lineItems: LineItem[];
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
  evidence: any[];
  availableMonths: string[];
}

interface GrantNarrativePanelProps {
  grantDetail: GrantDetailResponse;
  grantId: string;
  month: string;
}

export default function GrantNarrativePanel({
  grantDetail,
  grantId,
  month,
}: GrantNarrativePanelProps) {
  const { grant, finance, performance, evidence } = grantDetail;

  const [narrative, setNarrative] = useState('');
  const [activeTab, setActiveTab] = useState<'draft' | 'deterministic' | 'ai'>('draft');
  
  // Local operation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize/reset text when grant details change
  useEffect(() => {
    setNarrative(performance?.draftReportText || '');
    setActiveTab('draft');
    setError(null);
  }, [performance, grantId, month]);

  if (!performance) {
    return null;
  }

  // Lookup for total sampled school records
  const sampledSchoolsMap: Record<string, number> = {
    'GRANT_AA_2025': 661,
    'GRANT_BB_2025': 479,
    'GRANT_CC_2025': 477,
  };
  const sampledSchoolRecords = sampledSchoolsMap[grant.grantId] || 661;

  // Compile facts to display on the left side
  const sourceFacts = [
    { label: 'Grant', value: grant.grantName },
    { label: 'Period', value: monthLabel(finance.month) },
    { label: 'PBL Completion', value: `${performance.pblCompletionRate}%` },
    { label: 'Evidence Rate', value: `${performance.evidenceSubmissionRate}%` },
    { label: 'Attendance Rate', value: `${performance.attendanceRate}%` },
    { label: 'Overall Budget Utilization', value: `${finance.overallUtilizationRate}%` },
    { label: 'Milestone Status', value: performance.milestoneSummary || 'N/A' },
    { label: 'Risk Status', value: performance.riskStatus || 'Unknown' },
    { label: 'Evidence records', value: `${evidence.length} linked items` },
  ];

  // Action: Use Deterministic Summary
  const handleUseDeterministic = () => {
    setError(null);
    const text = buildDeterministicNarrative(grantDetail);
    setNarrative(text);
    setActiveTab('deterministic');
  };

  // Action: Generate with AI
  const handleGenerateAI = async () => {
    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/grants/generate-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantId,
          month,
          facts: {
            grantName: grant.grantName,
            month: monthLabel(finance.month),
            pblCompletionRate: performance.pblCompletionRate,
            evidenceRate: performance.evidenceSubmissionRate,
            attendanceRate: performance.attendanceRate,
            overallUtilizationRate: finance.overallUtilizationRate,
            milestoneSummary: performance.milestoneSummary,
            riskStatus: performance.riskStatus,
            evidenceCount: evidence.length,
            sampledSchools: sampledSchoolRecords,
            totalEnrollment: performance.totalEnrollment,
          },
        }),
      });

      const resJson = await response.json();

      if (response.ok && resJson.success && resJson.data?.narrative) {
        setNarrative(resJson.data.narrative);
        setActiveTab('ai');
      } else {
        setError(resJson.error || 'AI generation failed');
        // Fall back to rule-based deterministic summary
        const fallbackText = buildDeterministicNarrative(grantDetail);
        setNarrative(fallbackText);
        setActiveTab('deterministic');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred while calling the AI model.');
      // Fall back
      const fallbackText = buildDeterministicNarrative(grantDetail);
      setNarrative(fallbackText);
      setActiveTab('deterministic');
    } finally {
      setIsGenerating(false);
    }
  };

  // Action: Copy to clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Generated Report Section</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          This narrative is generated from the structured facts above. AI is optional.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">AI Generation Notice: </span>
            <span>{error} (Fell back to rule-based summary)</span>
          </div>
        </div>
      )}

      {/* Two-panel Side-by-Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Left panel (40% width) - Source Facts */}
        <div className="lg:col-span-4 bg-gray-50/50 border border-gray-150 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700 border-b border-gray-200/60 pb-2 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-indigo-500" />
            Source Facts Used
          </h3>
          <div className="space-y-3">
            {sourceFacts.map((fact, idx) => (
              <div key={idx} className="flex flex-col text-xs">
                <span className="text-gray-500 font-medium mb-0.5">{fact.label}</span>
                <span className="text-gray-900 font-semibold leading-relaxed break-words">
                  {fact.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel (60% width) - Narrative */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          
          {/* Controls Bar */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleUseDeterministic}
              disabled={isGenerating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                activeTab === 'deterministic' || activeTab === 'draft'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Use Deterministic Summary
            </button>
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                activeTab === 'ai'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              Generate with AI ✨
            </button>
          </div>

          {/* Narrative Text Container */}
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-5 min-h-[220px] relative">
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 rounded-xl space-y-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <span className="text-sm font-medium text-gray-600">Generating narrative...</span>
              </div>
            ) : (
              <p className="text-sm text-gray-800 leading-relaxed font-normal whitespace-pre-wrap">
                {narrative}
              </p>
            )}
          </div>

          {/* Copy Button */}
          <div className="flex justify-end">
            <button
              onClick={handleCopyToClipboard}
              disabled={isGenerating || !narrative}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                copied
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>✓ Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Report Section</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
