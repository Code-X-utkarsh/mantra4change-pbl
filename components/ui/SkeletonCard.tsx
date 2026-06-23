import React from 'react';

interface SkeletonCardProps {
  height?: string;
  width?: string;
  className?: string;
}

export default function SkeletonCard({
  height = 'h-32',
  width = 'w-full',
  className = '',
}: SkeletonCardProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gray-100 ${height} ${width} ${className}`}
      role="status"
      aria-label="Loading..."
    />
  );
}
