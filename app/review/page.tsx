import { headers } from 'next/headers';
import ReviewClient from '../../components/review/ReviewClient';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const host = headers().get('host') || 'localhost:3000';
  let filterOptions = {
    months: [],
    districts: [],
    grades: [],
    subjects: [],
  };

  try {
    const res = await fetch(`http://${host}/api/filters`, {
      cache: 'no-store',
    });
    const json = await res.json();
    if (json.success && json.data) {
      filterOptions = json.data;
    }
  } catch (error) {
    console.error('Error fetching filters in Review Server Component:', error);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Program Review & Compliance Audit
        </h1>
        <p className="text-sm text-gray-500 max-w-3xl">
          Conduct monthly program reviews, scan operational anomalies, and generate structured executive reports.
        </p>
      </div>

      <ReviewClient filterOptions={filterOptions} />
    </div>
  );
}
