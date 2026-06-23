import { headers } from 'next/headers';
import GrantsClient from '../../components/grants/GrantsClient';

export const dynamic = 'force-dynamic';

export default async function GrantsPage() {
  const host = headers().get('host') || 'localhost:3000';
  let grants = [];

  try {
    const res = await fetch(`http://${host}/api/grants`, {
      cache: 'no-store',
    });
    const json = await res.json();
    if (json.success && json.data?.grants) {
      grants = json.data.grants;
    }
  } catch (error) {
    console.error('Error fetching grants in Server Component:', error);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Grant Reporting Assistant
        </h1>
        <p className="text-sm text-gray-500 max-w-3xl">
          Select a grant and reporting month to generate a report section.
        </p>
      </div>

      <GrantsClient grants={grants} />
    </div>
  );
}
