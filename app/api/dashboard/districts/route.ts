import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '../../../../lib/api-helpers';
import { getFilteredRecords } from '../../../../lib/queries';
import {
  computeDistrictSummary,
  rankByParticipation
} from '../../../../lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || undefined;
    const grade = searchParams.get('grade') || undefined;
    const subject = searchParams.get('subject') || undefined;

    // 1. Get filtered records
    const records = getFilteredRecords({ month, grade, subject });

    // 2. Identify all distinct districts in the filtered records
    const districts = Array.from(new Set(records.map(r => r.district).filter((d): d is string => !!d)));

    // 3. Compute summaries for each district
    const summaries = districts.map(district => {
      const districtRecords = records.filter(r => r.district === district);
      return computeDistrictSummary(district, districtRecords);
    });

    // 4. Rank by participation rate descending
    const ranked = rankByParticipation(summaries);

    // 5. Assign performance tiers
    const N = ranked.length;
    const districtsWithTier = ranked.map((item, index) => {
      let performanceTier: "high" | "mid" | "low" = "mid";
      if (index < 5) {
        performanceTier = "high";
      } else if (index >= N - 5 && N - 5 >= 5) {
        performanceTier = "low";
      }
      return {
        ...item,
        performanceTier
      };
    });

    return successResponse({ districts: districtsWithTier });
  } catch (error: any) {
    console.error('Error in /api/dashboard/districts:', error);
    return errorResponse('Internal server error', 500);
  }
}
