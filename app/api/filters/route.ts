import { successResponse, errorResponse } from '../../../lib/api-helpers';
import { getAvailableMonths, getAvailableDistricts } from '../../../lib/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const months = getAvailableMonths();
    const districts = getAvailableDistricts();
    const grades = ["6", "7", "8"];
    const subjects = ["Math", "Science", "Math and Science"];

    return successResponse({
      months,
      districts,
      grades,
      subjects,
    });
  } catch (error: any) {
    console.error('Error in /api/filters:', error);
    return errorResponse('Internal server error', 500);
  }
}
