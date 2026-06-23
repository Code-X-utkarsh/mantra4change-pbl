import React from 'react';

export type RiskStatusType = 'On Track' | 'Behind' | 'At Risk' | 'Critical';

interface RiskBadgeProps {
  status: RiskStatusType | string;
  className?: string;
}

export default function RiskBadge({ status, className }: RiskBadgeProps) {
  const normStatus = status?.trim();

  let colors = 'bg-gray-100 text-gray-700';

  if (normStatus === 'On Track') {
    colors = 'bg-green-50 text-green-700 ring-1 ring-green-600/10';
  } else if (normStatus === 'Behind') {
    colors = 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/15';
  } else if (normStatus === 'At Risk') {
    colors = 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/10';
  } else if (normStatus === 'Critical') {
    colors = 'bg-red-50 text-red-700 ring-1 ring-red-600/10';
  }

  const defaultClasses = `inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${colors}`;

  return (
    <span className={className ? `${className} ${colors}` : defaultClasses}>
      {normStatus || 'Unknown'}
    </span>
  );
}
