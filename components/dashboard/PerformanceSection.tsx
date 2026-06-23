'use client';

import React, { useState, useEffect } from 'react';
import DistrictTable from './DistrictTable';
import BlockTable from './BlockTable';

interface PerformanceSectionProps {
  districtData: any[];
  blockData: any[];
  isLoading: boolean;
  activeDistrict?: string;
}

export default function PerformanceSection({
  districtData,
  blockData,
  isLoading,
  activeDistrict,
}: PerformanceSectionProps) {
  const [activeTab, setActiveTab] = useState<'districts' | 'blocks'>('districts');

  // Auto-switch tab to 'blocks' when district filter becomes active
  useEffect(() => {
    if (activeDistrict) {
      setActiveTab('blocks');
    } else {
      setActiveTab('districts');
    }
  }, [activeDistrict]);

  return (
    <div className="space-y-6">
      {/* Tab Switcher Bar */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('districts')}
            className={`pb-4 text-sm font-semibold transition-all duration-200 focus:outline-none ${
              activeTab === 'districts'
                ? 'border-b-2 border-b-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Districts Breakdown
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`pb-4 text-sm font-semibold transition-all duration-200 focus:outline-none ${
              activeTab === 'blocks'
                ? 'border-b-2 border-b-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Blocks Breakdown
          </button>
        </div>
      </div>

      {/* Render active table */}
      <div>
        {activeTab === 'districts' ? (
          <DistrictTable districts={districtData} isLoading={isLoading} />
        ) : (
          <BlockTable
            blocks={blockData}
            isLoading={isLoading}
            activeDistrict={activeDistrict}
          />
        )}
      </div>
    </div>
  );
}
