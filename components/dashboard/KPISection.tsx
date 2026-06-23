import React from 'react';
import KPICard from './KPICard';
import SkeletonCard from '../ui/SkeletonCard';

interface KPIData {
  current: {
    totalSchools: number;
    participatingSchools: number;
    participationRate: number;
    evidenceRate: number;
    totalEnrollment: number;
    totalAttendance: number;
    attendanceRate: number;
    riskStatus: string;
  };
  previous: {
    totalSchools: number;
    participatingSchools: number;
    participationRate: number;
    evidenceRate: number;
    totalEnrollment: number;
    totalAttendance: number;
    attendanceRate: number;
    riskStatus: string;
  } | null;
  momChange: {
    participationRate: number | null;
    attendanceRate: number | null;
  };
}

interface KPISectionProps {
  kpiData: KPIData | null;
  isLoading: boolean;
}

function clientClassifyRisk(rate: number): 'On Track' | 'Behind' | 'At Risk' | 'Critical' {
  if (rate >= 75) return 'On Track';
  if (rate >= 60) return 'Behind';
  if (rate >= 35) return 'At Risk';
  return 'Critical';
}

export default function KPISection({ kpiData, isLoading }: KPISectionProps) {
  if (isLoading || !kpiData) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <SkeletonCard key={idx} height="h-36" />
        ))}
      </div>
    );
  }

  const { current, previous, momChange } = kpiData;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {/* 1. Total Schools */}
      <KPICard
        title="Total Schools"
        value={current.totalSchools.toLocaleString()}
      />

      {/* 2. Participating Schools */}
      <KPICard
        title="Active Schools"
        value={current.participatingSchools.toLocaleString()}
      />

      {/* 3. Participation Rate */}
      <KPICard
        title="Participation"
        value={`${current.participationRate}%`}
        momChange={momChange.participationRate}
        subLabel={previous ? `${previous.participationRate}% last month` : undefined}
        showRiskBadge={true}
        riskStatus={clientClassifyRisk(current.participationRate)}
      />

      {/* 4. Evidence Rate */}
      <KPICard
        title="Evidence Rate"
        value={`${current.evidenceRate}%`}
      />

      {/* 5. Total Enrollment */}
      <KPICard
        title="Enrollment"
        value={current.totalEnrollment.toLocaleString()}
      />

      {/* 6. Attendance Rate */}
      <KPICard
        title="Attendance Rate"
        value={`${current.attendanceRate}%`}
        momChange={momChange.attendanceRate}
        subLabel={previous ? `${previous.attendanceRate}% last month` : undefined}
        showRiskBadge={true}
        riskStatus={clientClassifyRisk(current.attendanceRate)}
      />
    </div>
  );
}
