import { headers } from 'next/headers';
import DashboardClient from '../../components/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: {
    month?: string;
    district?: string;
    block?: string;
    grade?: string;
    subject?: string;
  };
}) {
  const host = headers().get('host') || 'localhost:3000';

  let filterOptions = {
    months: [],
    districts: [],
    grades: ['6', '7', '8'],
    subjects: ['Math', 'Science', 'Math and Science'],
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
    console.error('Error fetching filters in Server Component:', error);
  }

  return (
    <DashboardClient
      filterOptions={filterOptions}
      initialFilters={searchParams}
    />
  );
}
