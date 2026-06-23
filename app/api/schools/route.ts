import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '../../../lib/api-helpers';
import { getFilteredRecords } from '../../../lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || undefined;
    const district = searchParams.get('district') || undefined;
    const block = searchParams.get('block') || undefined;

    const records = getFilteredRecords({ month, district, block });

    const schools = records.map(row => ({
      schoolCode: row.school_code,
      schoolName: row.school_name || null,
      district: row.district || null,
      block: row.block || null,
      pblConducted: row.pbl_conducted === 1,
      evidenceSubmitted: row.evidence_submitted === 1,
      attendanceRate: Math.round((row.attendance_rate || 0) * 100 * 100) / 100,
      riskStatus: row.risk_status,
      reportingMonth: row.reporting_month
    }));

    return successResponse({
      schools,
      total: schools.length
    });
  } catch (error: any) {
    console.error('Error in /api/schools:', error);
    return errorResponse('Internal server error', 500);
  }
}
