'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  const isDashboardActive = pathname.startsWith('/dashboard') || pathname === '/';
  const isGrantsActive = pathname.startsWith('/grants');
  const isReviewActive = pathname.startsWith('/review');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-gray-900">PBL Intelligence</span>
            <span className="hidden sm:inline-block ml-2 text-xs text-gray-400 font-medium">· Mantra4Change Program Dashboard</span>
          </div>
        </div>

        {/* Right navigation links */}
        <nav className="flex items-center gap-6 h-16">
          <Link
            href="/dashboard"
            className={`flex items-center h-full border-b-2 text-sm font-semibold transition-all duration-150 ${
              isDashboardActive
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/grants"
            className={`flex items-center h-full border-b-2 text-sm font-semibold transition-all duration-150 ${
              isGrantsActive
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Grant Reports
          </Link>
          <Link
            href="/review"
            className={`flex items-center h-full border-b-2 text-sm font-semibold transition-all duration-150 ${
              isReviewActive
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Program Review
          </Link>
        </nav>
      </div>
    </header>
  );
}
