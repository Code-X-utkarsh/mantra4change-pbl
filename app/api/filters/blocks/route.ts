import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '../../../../lib/api-helpers';
import { getAvailableBlocks } from '../../../../lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district') || undefined;
    const blocks = getAvailableBlocks(district);
    return successResponse({ blocks });
  } catch (error: any) {
    console.error('Error in /api/filters/blocks:', error);
    return errorResponse('Internal server error', 500);
  }
}
