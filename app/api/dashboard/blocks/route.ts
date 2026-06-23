import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '../../../../lib/api-helpers';
import { getFilteredRecords } from '../../../../lib/queries';
import {
  computeBlockSummary,
  rankByParticipation
} from '../../../../lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || undefined;
    const district = searchParams.get('district') || undefined;
    const grade = searchParams.get('grade') || undefined;
    const subject = searchParams.get('subject') || undefined;

    // 1. Get filtered records
    const records = getFilteredRecords({ month, district, grade, subject });

    // 2. Identify all distinct blocks in the filtered records
    const blocks = Array.from(new Set(records.map(r => r.block).filter((b): b is string => !!b)));

    // 3. Compute summaries for each block
    const summaries = blocks.map(block => {
      const blockRecords = records.filter(r => r.block === block);
      return computeBlockSummary(block, blockRecords);
    });

    // 4. Rank by participation rate descending
    const ranked = rankByParticipation(summaries);

    // 5. Assign performance tiers
    const N = ranked.length;
    const blocksWithTier = ranked.map((item, index) => {
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

    return successResponse({ blocks: blocksWithTier });
  } catch (error: any) {
    console.error('Error in /api/dashboard/blocks:', error);
    return errorResponse('Internal server error', 500);
  }
}
