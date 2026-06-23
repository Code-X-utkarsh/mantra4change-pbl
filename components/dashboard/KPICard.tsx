import React from 'react';
import RiskBadge from '../ui/RiskBadge';

interface KPICardProps {
  title: string;
  value: string | number;
  subLabel?: string;
  momChange?: number | null;
  showRiskBadge?: boolean;
  riskStatus?: string;
}

export default function KPICard({
  title,
  value,
  subLabel,
  momChange,
  showRiskBadge,
  riskStatus,
}: KPICardProps) {
  const hasMom = momChange !== undefined && momChange !== null;
  const isPositive = hasMom && momChange > 0;
  const isNegative = hasMom && momChange < 0;
  const isZero = hasMom && momChange === 0;

  return (
    <div className="group relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-md min-h-[130px] flex flex-col justify-between">
      <div>
        {/* Top row: title & optional risk badge */}
        <div className="flex items-start justify-between gap-2">
          <span className="flex-1 min-w-0 text-xs font-semibold uppercase tracking-wider text-gray-500 truncate">
            {title}
          </span>
          {showRiskBadge && riskStatus && (
            <RiskBadge
              status={riskStatus}
              className="shrink-0 self-start text-xs px-2 py-0.5 rounded-full font-medium"
            />
          )}
        </div>

        {/* Center: main value */}
        <div className="mt-3 mb-1">
          <span className="text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </span>
        </div>
      </div>

      {/* Bottom row: subLabel & MoM indicator */}
      {(subLabel || hasMom) && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
          <span className="text-xs text-gray-500">{subLabel || ''}</span>
          
          {hasMom && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold">
              {isPositive && (
                <span className="text-green-600 font-medium">
                  ▲ +{Math.abs(momChange).toFixed(2)}%
                </span>
              )}
              {isNegative && (
                <span className="text-red-600 font-medium">
                  ▼ {Math.abs(momChange).toFixed(2)}%
                </span>
              )}
              {isZero && (
                <span className="text-gray-400 text-xs font-normal">
                  No change
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
