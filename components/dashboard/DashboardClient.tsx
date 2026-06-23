'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFilterSummaryLabel } from '../../lib/filter-labels';
import FilterBar from './FilterBar';
import KPISection from './KPISection';
import PerformanceSection from './PerformanceSection';
import { AlertCircle } from 'lucide-react';

interface FilterOptions {
  months: string[];
  districts: string[];
  grades: string[];
  subjects: string[];
}

interface DashboardClientProps {
  filterOptions: FilterOptions;
  initialFilters: {
    month?: string;
    district?: string;
    block?: string;
    grade?: string;
    subject?: string;
  };
}

export default function DashboardClient({ filterOptions, initialFilters }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // API Data states
  const [kpiData, setKpiData] = useState<any>(null);
  const [districtData, setDistrictData] = useState<any[]>([]);
  const [blockData, setBlockData] = useState<any[]>([]);

  // Fetch status states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract current filters from searchParams
  const currentFilters = {
    month: searchParams.get('month') || undefined,
    district: searchParams.get('district') || undefined,
    block: searchParams.get('block') || undefined,
    grade: searchParams.get('grade') || undefined,
    subject: searchParams.get('subject') || undefined,
  };

  // Default to 2025-09 on initial mount if month is absent
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('month')) {
      params.set('month', '2025-09');
      router.replace(`/dashboard?${params.toString()}`);
    }
  }, [router]);

  // Sync state and run fetches when searchParams change
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    const monthStr = searchParams.get('month') || '';
    const districtStr = searchParams.get('district') || '';
    const blockStr = searchParams.get('block') || '';
    const gradeStr = searchParams.get('grade') || '';
    const subjectStr = searchParams.get('subject') || '';

    // Build query strings
    const kpiQuery = new URLSearchParams();
    if (monthStr) kpiQuery.set('month', monthStr);
    if (districtStr) kpiQuery.set('district', districtStr);
    if (blockStr) kpiQuery.set('block', blockStr);
    if (gradeStr) kpiQuery.set('grade', gradeStr);
    if (subjectStr) kpiQuery.set('subject', subjectStr);

    const districtQuery = new URLSearchParams();
    if (monthStr) districtQuery.set('month', monthStr);
    if (gradeStr) districtQuery.set('grade', gradeStr);
    if (subjectStr) districtQuery.set('subject', subjectStr);

    const blockQuery = new URLSearchParams();
    if (monthStr) blockQuery.set('month', monthStr);
    if (districtStr) blockQuery.set('district', districtStr);
    if (gradeStr) blockQuery.set('grade', gradeStr);
    if (subjectStr) blockQuery.set('subject', subjectStr);

    // Call API endpoints in parallel
    const kpiPromise = fetch(`/api/dashboard/kpis?${kpiQuery.toString()}`).then(r => r.json());
    const districtPromise = fetch(`/api/dashboard/districts?${districtQuery.toString()}`).then(r => r.json());
    const blockPromise = fetch(`/api/dashboard/blocks?${blockQuery.toString()}`).then(r => r.json());

    Promise.all([kpiPromise, districtPromise, blockPromise])
      .then(([kpisRes, districtsRes, blocksRes]) => {
        if (!active) return;

        if (kpisRes.success && districtsRes.success && blocksRes.success) {
          setKpiData(kpisRes.data);
          setDistrictData(districtsRes.data.districts || []);
          setBlockData(blocksRes.data.blocks || []);
        } else {
          setError(kpisRes.error || districtsRes.error || blocksRes.error || 'Failed to fetch dashboard metrics');
        }
      })
      .catch(err => {
        if (!active) return;
        console.error('Error fetching dashboard data:', err);
        setError('A network error occurred while loading dashboard metrics.');
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [searchParams]);

  // Handle individual filter dropdown change
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Changing district must clear block selection at the same time
    if (key === 'district') {
      params.delete('block');
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  // Reset all filters and clear the query string
  const handleResetFilters = () => {
    router.push('/dashboard');
  };

  const subtitleLabel = getFilterSummaryLabel(currentFilters);

  return (
    <div className="space-y-8">
      {/* 1. Dashboard Hero Area */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Program Review Dashboard
        </h1>
        <p className="text-sm text-gray-500 max-w-3xl">
          {subtitleLabel}
        </p>
      </div>

      {/* 2. Filter Bar */}
      <FilterBar
        filterOptions={filterOptions}
        currentFilters={currentFilters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* 3. Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold">Error: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 4. KPI Section */}
      <KPISection kpiData={kpiData} isLoading={isLoading} />

      {/* 5. Performance Section (Districts & Blocks) */}
      <PerformanceSection
        districtData={districtData}
        blockData={blockData}
        isLoading={isLoading}
        activeDistrict={currentFilters.district}
      />

      {/* 6. Footer */}
      <footer className="border-t border-gray-200 pt-8 text-center">
        <p className="text-xs text-gray-400">
          Data: Synthetic PBL assessment data. All figures are computed.
        </p>
      </footer>
    </div>
  );
}
