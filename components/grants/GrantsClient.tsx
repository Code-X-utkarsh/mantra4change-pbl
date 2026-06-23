'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GrantSelector from './GrantSelector';
import GrantEmptyState from './GrantEmptyState';
import GrantFactPanel from './GrantFactPanel';
import GrantNarrativePanel from './GrantNarrativePanel';
import { AlertCircle } from 'lucide-react';

interface Grant {
  grantId: string;
  grantName: string;
  donor: string;
  periodStart: string;
  periodEnd: string;
  coveredDistricts: string[];
}

interface GrantsClientProps {
  grants: Grant[];
}

export default function GrantsClient({ grants }: GrantsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected parameters from URL
  const currentGrantId = searchParams.get('grantId') || undefined;
  const currentMonth = searchParams.get('month') || undefined;

  // Selected grant detail states
  const [grantDetail, setGrantDetail] = useState<any>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state and run fetches when URL searchParams change
  useEffect(() => {
    if (!currentGrantId) {
      setGrantDetail(null);
      setAvailableMonths([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    // Construct request url
    const query = new URLSearchParams();
    if (currentMonth) {
      query.set('month', currentMonth);
    }

    const url = `/api/grants/${currentGrantId}?${query.toString()}`;

    fetch(url)
      .then(res => res.json())
      .then(resJson => {
        if (!active) return;

        if (resJson.success && resJson.data) {
          setGrantDetail(resJson.data);
          setAvailableMonths(resJson.data.availableMonths || []);

          // Smart UX redirect: if month was empty, set the default returned month in URL
          const apiMonth = resJson.data.finance?.month;
          if (!currentMonth && apiMonth && apiMonth !== 'all') {
            const nextParams = new URLSearchParams(searchParams.toString());
            nextParams.set('month', apiMonth);
            router.replace(`/grants?${nextParams.toString()}`);
          }
        } else {
          setError(resJson.error || 'Failed to load grant data');
          setGrantDetail(null);
        }
      })
      .catch(err => {
        if (!active) return;
        console.error('Error fetching grant details:', err);
        setError('A network error occurred while loading grant details.');
        setGrantDetail(null);
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentGrantId, currentMonth, router, searchParams]);

  // Handle selectors change
  const handleSelectorChange = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (key === 'grantId') {
      nextParams.set('grantId', value);
      nextParams.delete('month'); // Clear selected month when switching grants
    } else if (key === 'month') {
      nextParams.set('month', value);
    }
    router.push(`/grants?${nextParams.toString()}`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Top selector */}
      <GrantSelector
        grants={grants}
        currentGrantId={currentGrantId}
        currentMonth={currentMonth}
        availableMonths={availableMonths}
        onChange={handleSelectorChange}
      />

      {/* 2. Loading state */}
      {isLoading && !grantDetail && (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm min-h-[300px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-semibold text-gray-500">Loading grant details...</p>
        </div>
      )}

      {/* 3. Error state */}
      {error && !isLoading && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 max-w-4xl mx-auto">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold">Error: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 4. Empty/Selected states */}
      {!currentGrantId && !isLoading && <GrantEmptyState />}

      {grantDetail && !isLoading && (
        <div className="grid grid-cols-1 gap-6">
          {/* Outlines of the selected grant summary */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-md font-bold text-indigo-950">
                {grantDetail.grant.grantName}
              </h2>
              <p className="text-xs text-indigo-800 mt-0.5">
                Donor: {grantDetail.grant.donor} · Period: {grantDetail.grant.periodStart} to {grantDetail.grant.periodEnd}
              </p>
            </div>
            <div className="bg-white rounded-lg px-3 py-1.5 border border-indigo-200 shrink-0 text-center md:text-right">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide block font-semibold">Active Month</span>
              <span className="text-sm font-bold text-indigo-950">
                {grantDetail.finance?.month || 'N/A'}
              </span>
            </div>
          </div>

          {/* Side-by-side components of outcomes & narrative reports */}
          <GrantFactPanel grantDetail={grantDetail} />
          
          <GrantNarrativePanel
            grantDetail={grantDetail}
            grantId={currentGrantId!}
            month={currentMonth || grantDetail.finance?.month || ''}
          />
        </div>
      )}

    </div>
  );
}
