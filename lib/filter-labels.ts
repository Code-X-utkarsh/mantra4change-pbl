/**
 * Translates a month code like "2025-09" to a human-readable label like "September 2025".
 */
export function monthLabel(m: string): string {
  if (!m) return '';
  const monthNames: Record<string, string> = {
    '2025-07': 'July 2025',
    '2025-08': 'August 2025',
    '2025-09': 'September 2025',
  };
  return monthNames[m] || m;
}

/**
 * Translates active filter parameters into a human-readable subtitle.
 */
export function getFilterSummaryLabel(filters: {
  month?: string;
  district?: string;
  block?: string;
  grade?: string;
  subject?: string;
}): string {
  const parts: string[] = [];

  if (filters.month) {
    parts.push(monthLabel(filters.month));
  }

  if (filters.district) {
    parts.push(filters.district);
  }

  if (filters.block) {
    parts.push(filters.block);
  }

  if (filters.grade) {
    parts.push(`Grade ${filters.grade}`);
  }

  if (filters.subject) {
    parts.push(filters.subject);
  }

  if (parts.length === 0) {
    return 'Showing all data across all months and geographies';
  }

  return `Showing data for ${parts.join(' · ')}`;
}
