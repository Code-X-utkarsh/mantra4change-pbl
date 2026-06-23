import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '../../../../lib/api-helpers';
import { getFilteredRecords } from '../../../../lib/queries';
import {
  computeParticipationRate,
  computeEvidenceRate,
  computeAttendanceRate,
  computeTotalEnrollment,
  computeTotalAttendance,
  classifyRisk,
  computeMoMChange,
  MonthlyRecord
} from '../../../../lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || undefined;
    const district = searchParams.get('district') || undefined;
    const block = searchParams.get('block') || undefined;
    const grade = searchParams.get('grade') || undefined;
    const subject = searchParams.get('subject') || undefined;

    const filters = { month, district, block, grade, subject };

    // 1. Fetch current month records
    const currentRecords = getFilteredRecords(filters);

    // 2. Determine previous month
    let previousMonth: string | null = null;
    if (month) {
      if (month === '2025-09') {
        previousMonth = '2025-08';
      } else if (month === '2025-08') {
        previousMonth = '2025-07';
      }
    }

    // 3. Fetch previous month records
    let previousRecords: MonthlyRecord[] | null = null;
    if (previousMonth) {
      previousRecords = getFilteredRecords({ ...filters, month: previousMonth });
    }

    // 4. Calculate current KPIs
    const currentParticipation = computeParticipationRate(currentRecords);
    const currentAttendance = computeAttendanceRate(currentRecords);
    
    const currentKPIs = {
      totalSchools: currentRecords.length,
      participatingSchools: currentRecords.filter(r => r.pbl_conducted === 1).length,
      participationRate: currentParticipation,
      evidenceRate: computeEvidenceRate(currentRecords),
      totalEnrollment: computeTotalEnrollment(currentRecords),
      totalAttendance: computeTotalAttendance(currentRecords),
      attendanceRate: currentAttendance,
      riskStatus: classifyRisk(currentParticipation)
    };

    // 5. Calculate previous KPIs
    let previousKPIs = null;
    if (previousRecords) {
      const prevParticipation = computeParticipationRate(previousRecords);
      previousKPIs = {
        totalSchools: previousRecords.length,
        participatingSchools: previousRecords.filter(r => r.pbl_conducted === 1).length,
        participationRate: prevParticipation,
        evidenceRate: computeEvidenceRate(previousRecords),
        totalEnrollment: computeTotalEnrollment(previousRecords),
        totalAttendance: computeTotalAttendance(previousRecords),
        attendanceRate: computeAttendanceRate(previousRecords),
        riskStatus: classifyRisk(prevParticipation)
      };
    }

    // 6. Calculate MoM Change
    const momChange = {
      participationRate: previousKPIs ? computeMoMChange(currentKPIs.participationRate, previousKPIs.participationRate) : null,
      attendanceRate: previousKPIs ? computeMoMChange(currentKPIs.attendanceRate, previousKPIs.attendanceRate) : null
    };

    return successResponse({
      filters,
      current: currentKPIs,
      previous: previousKPIs,
      momChange
    });
  } catch (error: any) {
    console.error('Error in /api/dashboard/kpis:', error);
    return errorResponse('Internal server error', 500);
  }
}
