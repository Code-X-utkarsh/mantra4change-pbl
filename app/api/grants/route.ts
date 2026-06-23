import { successResponse, errorResponse } from '../../../lib/api-helpers';
import { getGrantList } from '../../../lib/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbGrants = getGrantList();
    const grants = dbGrants.map(g => ({
      grantId: g.grant_id,
      grantName: g.grant_name,
      donor: g.donor,
      periodStart: g.period_start,
      periodEnd: g.period_end,
      coveredDistricts: g.covered_districts ? g.covered_districts.split(';').map(d => d.trim()) : []
    }));

    return successResponse({ grants });
  } catch (error: any) {
    console.error('Error in /api/grants:', error);
    return errorResponse('Internal server error', 500);
  }
}
