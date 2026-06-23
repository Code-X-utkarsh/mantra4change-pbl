'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { monthLabel } from '../../lib/filter-labels';
import RiskBadge from '../ui/RiskBadge';
import { AlertCircle, CheckCircle, Sparkles, Copy, Check, Printer, FileText } from 'lucide-react';

interface FilterOptions {
  months: string[];
  districts: string[];
}

interface ReviewClientProps {
  filterOptions: FilterOptions;
}

interface Anomaly {
  type: string;
  location: string;
  level: 'Warning' | 'Critical';
  description: string;
}

interface ReviewData {
  activeSchools: number;
  participationRate: number;
  evidenceRate: number;
  attendanceRate: number;
  totalSpend: number;
  anomalies: Anomaly[];
}

function rateClassifyRisk(rate: number): 'On Track' | 'Behind' | 'At Risk' | 'Critical' {
  if (rate >= 75) return 'On Track';
  if (rate >= 60) return 'Behind';
  if (rate >= 35) return 'At Risk';
  return 'Critical';
}

export default function ReviewClient({ filterOptions }: ReviewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active filters from URL
  const currentMonth = searchParams.get('month') || '2025-09';
  const currentDistrict = searchParams.get('district') || '';

  // Data states
  const [metrics, setMetrics] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Narrative summary states
  const [narrative, setNarrative] = useState('');
  const [activeTab, setActiveTab] = useState<'deterministic' | 'ai'>('deterministic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genModel, setGenModel] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync state and run fetch
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    setNarrative('');
    setGenModel(null);
    setGenError(null);
    setActiveTab('deterministic');

    const query = new URLSearchParams();
    query.set('month', currentMonth);
    if (currentDistrict) {
      query.set('district', currentDistrict);
    }

    fetch(`/api/review/metrics?${query.toString()}`)
      .then(res => res.json())
      .then(resJson => {
        if (!active) return;
        if (resJson.success && resJson.data) {
          setMetrics(resJson.data);
          
          // Pre-populate with deterministic summary
          const mLabel = monthLabel(currentMonth);
          const dLabel = currentDistrict || 'All Districts';
          const defaultText = buildDeterministicReview(resJson.data, mLabel, dLabel);
          setNarrative(defaultText);
        } else {
          setError(resJson.error || 'Failed to fetch review metrics');
        }
      })
      .catch(err => {
        if (!active) return;
        console.error(err);
        setError('A network error occurred while loading metrics.');
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentMonth, currentDistrict]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    router.push(`/review?${nextParams.toString()}`);
  };

  // Rule-based summary template
  const buildDeterministicReview = (data: ReviewData, mLabel: string, dLabel: string) => {
    const anomaliesCount = data.anomalies.length;
    const anomaliesSummary = anomaliesCount > 0 
      ? `There are ${anomaliesCount} operational anomalies flagged requiring immediate corrective actions.` 
      : 'No major operational anomalies or spending discrepancies were detected.';

    return `Mantra4Change Operations Review — ${mLabel} (${dLabel})

During the reporting period of ${mLabel}, a total of ${data.activeSchools} active schools successfully participated in the project-based learning (PBL) program. The overall PBL completion rate stood at ${data.participationRate}%, with an average student attendance rate of ${data.attendanceRate}%. Evidence uploads were completed by ${data.evidenceRate}% of the participating schools.

A total expenditure of ${data.totalSpend.toLocaleString()} units was utilized across all active grant programs. ${anomaliesSummary}

Corrective actions should prioritize resolving flagged discrepancies in attendance, evidence submission completeness, and budget alignment.`;
  };

  // Use Local Deterministic
  const handleUseDeterministic = () => {
    if (!metrics) return;
    setGenError(null);
    setGenModel(null);
    const text = buildDeterministicReview(metrics, monthLabel(currentMonth), currentDistrict || 'All Districts');
    setNarrative(text);
    setActiveTab('deterministic');
  };

  // Generate Executive report via AI (with dual failover)
  const handleGenerateAI = async () => {
    if (!metrics) return;
    setGenError(null);
    setIsGenerating(true);

    const anomaliesText = metrics.anomalies.map(a => `- [${a.level}] ${a.type} at ${a.location}: ${a.description}`).join('\n');

    try {
      const response = await fetch('/api/review/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentMonth,
          district: currentDistrict || undefined,
          facts: {
            monthLabel: monthLabel(currentMonth),
            activeSchools: metrics.activeSchools,
            participationRate: metrics.participationRate,
            evidenceRate: metrics.evidenceRate,
            attendanceRate: metrics.attendanceRate,
            totalSpend: metrics.totalSpend.toLocaleString(),
            anomaliesCount: metrics.anomalies.length,
            anomaliesText: anomaliesText,
          },
        }),
      });

      const resJson = await response.json();

      if (response.ok && resJson.success && resJson.data?.narrative) {
        setNarrative(resJson.data.narrative);
        setGenModel(resJson.data.model || 'AI Model');
        setActiveTab('ai');
      } else {
        setGenError(resJson.error || 'AI generation failed');
        // Fall back
        handleUseDeterministic();
      }
    } catch (err) {
      console.error(err);
      setGenError('A network error occurred while connecting to AI services.');
      handleUseDeterministic();
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Print summary page
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Selector Row (Hidden in print) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Month selector */}
          <div className="flex flex-col">
            <label htmlFor="review-month" className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Reporting Month
            </label>
            <div className="relative">
              <select
                id="review-month"
                value={currentMonth}
                onChange={e => handleFilterChange('month', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer appearance-none"
              >
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

          {/* District selector */}
          <div className="flex flex-col">
            <label htmlFor="review-district" className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              District
            </label>
            <div className="relative">
              <select
                id="review-district"
                value={currentDistrict || 'all'}
                onChange={e => handleFilterChange('district', e.target.value)}
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

        </div>
      </div>

      {/* 2. Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm min-h-[300px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-semibold text-gray-500">Evaluating program metrics & scanning compliance...</p>
        </div>
      )}

      {/* 3. Error state */}
      {error && !isLoading && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 max-w-4xl mx-auto print:hidden">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold">Error: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 4. Loaded Workspace */}
      {metrics && !isLoading && (
        <div className="space-y-6">
          
          {/* Print Header Info */}
          <div className="hidden print:block border-b border-gray-300 pb-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Mantra4Change Executive Summary</h2>
            <p className="text-xs text-gray-500">
              Generated on {new Date().toLocaleDateString()} for Month: {monthLabel(currentMonth)} · Geography: {currentDistrict || 'All'}
            </p>
          </div>

          {/* Computed KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            {/* Active Schools */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between h-28">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Active Schools
              </span>
              <div className="flex items-baseline mt-2">
                <span className="text-2xl font-bold text-gray-900">
                  {metrics.activeSchools.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Participation Rate */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between h-28">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Participation
              </span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold text-gray-900">
                  {metrics.participationRate}%
                </span>
                <RiskBadge status={rateClassifyRisk(metrics.participationRate)} />
              </div>
            </div>

            {/* Evidence Rate */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between h-28">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Evidence rate
              </span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold text-gray-900">
                  {metrics.evidenceRate}%
                </span>
                <RiskBadge status={rateClassifyRisk(metrics.evidenceRate)} />
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between h-28">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Attendance
              </span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold text-gray-900">
                  {metrics.attendanceRate}%
                </span>
                <RiskBadge status={rateClassifyRisk(metrics.attendanceRate)} />
              </div>
            </div>

            {/* Total spend */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between h-28 col-span-2 md:col-span-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Spend
              </span>
              <div className="flex items-baseline mt-2">
                <span className="text-2xl font-bold text-gray-900 text-indigo-600">
                  {metrics.totalSpend.toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 font-medium ml-1">units</span>
              </div>
            </div>

          </div>

          {/* Executive review generator */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6 print:border-none print:shadow-none print:p-0">
            
            {/* Panel Title (Hidden in print) */}
            <div className="print:hidden">
              <h3 className="text-md font-bold text-gray-900">Operations Evaluation Report</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Review computed program reviews or trigger dual-model failover AI synthesis.
              </p>
            </div>

            {genError && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 print:hidden">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">AI System Notification: </span>
                  <span>{genError} (Fallback template loaded below)</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              
              {/* Left sidebar - Source facts (Hidden in print) */}
              <div className="lg:col-span-4 bg-gray-50/50 border border-gray-150 rounded-xl p-5 space-y-4 print:hidden">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700 border-b border-gray-200 pb-2 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  Synthesis Source Facts
                </h4>
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  <div className="flex flex-col">
                    <span className="text-gray-400 font-medium">Month</span>
                    <span className="text-gray-900 font-semibold mt-0.5">{monthLabel(currentMonth)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 font-medium">Geography</span>
                    <span className="text-gray-900 font-semibold mt-0.5">{currentDistrict || 'All Districts'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 font-medium">PBL Rate</span>
                    <span className="text-gray-900 font-semibold mt-0.5">{metrics.participationRate}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 font-medium">Attendance</span>
                    <span className="text-gray-900 font-semibold mt-0.5">{metrics.attendanceRate}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 font-medium">Evidence Rate</span>
                    <span className="text-gray-900 font-semibold mt-0.5">{metrics.evidenceRate}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 font-medium">Active Schools</span>
                    <span className="text-gray-900 font-semibold mt-0.5">{metrics.activeSchools}</span>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-gray-400 font-medium">Total spend</span>
                    <span className="text-gray-900 font-bold mt-0.5">{metrics.totalSpend.toLocaleString()} units</span>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-gray-400 font-medium">Anomalies</span>
                    <span className="text-gray-900 font-semibold mt-0.5">{metrics.anomalies.length} cases flagged</span>
                  </div>
                </div>
              </div>

              {/* Right text box - Narrative */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-4 print:col-span-10">
                
                {/* Control tabs (Hidden in print) */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 print:hidden">
                  <div className="flex gap-2">
                    <button
                      onClick={handleUseDeterministic}
                      disabled={isGenerating}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        activeTab === 'deterministic'
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
                      Generate AI Summary ✨
                    </button>
                  </div>
                  
                  {/* Model Label Badge */}
                  {activeTab === 'ai' && genModel && (
                    <span className="text-[10px] px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 font-mono rounded">
                      Model: {genModel}
                    </span>
                  )}
                  {activeTab === 'deterministic' && (
                    <span className="text-[10px] px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 font-mono rounded">
                      Source: Rule-based
                    </span>
                  )}
                </div>

                {/* Narrative Container */}
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-5 min-h-[220px] relative print:bg-white print:border-none print:p-0 print:min-h-0">
                  {isGenerating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 rounded-xl space-y-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      <span className="text-sm font-medium text-gray-600">Generating operations evaluation...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-800 leading-relaxed font-normal whitespace-pre-wrap print:text-black print:leading-relaxed">
                      {narrative}
                    </p>
                  )}
                </div>

                {/* Copy/Print buttons (Hidden in print) */}
                <div className="flex justify-end gap-2 print:hidden">
                  <button
                    onClick={handlePrint}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:scale-95"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Report / PDF</span>
                  </button>
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
                        <span>Copy Report</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* Compliance & Anomaly Section (Hidden in print if empty) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4 print:break-inside-avoid">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 border-b border-gray-150 pb-2 flex items-center gap-2">
              <span>NGO Compliance & Risk Audit Log</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                metrics.anomalies.length > 0 ? 'bg-red-50 text-red-600 border border-red-200/50' : 'bg-green-50 text-green-600 border border-green-200/50'
              }`}>
                {metrics.anomalies.length} Flagged
              </span>
            </h3>

            {metrics.anomalies.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50/50 p-4 text-sm text-green-800">
                <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold">Compliance Audit Passed: </span>
                  <span>No operational discrepancies, budget frontloading, or evidence gaps detected.</span>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {metrics.anomalies.map((anom, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start gap-2.5">
                    <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded shrink-0 w-20 text-center uppercase tracking-wide ${
                      anom.level === 'Critical' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {anom.level}
                    </span>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-gray-900">{anom.type}</span>
                        <span className="text-[10px] text-gray-400 font-semibold">· {anom.location}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        {anom.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
