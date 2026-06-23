import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { detectAnomalies } from '../../../../lib/anomaly-detector';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const district = searchParams.get('district') || undefined;

    if (!month) {
      return NextResponse.json(
        { success: false, error: 'Month parameter is required' },
        { status: 400 }
      );
    }

    // 1. Fetch overall school metrics for the selected month
    let schoolQuery = `
      SELECT COUNT(mr.id) as total_records,
             SUM(CASE WHEN mr.pbl_conducted = 1 THEN 1 ELSE 0 END) as active_schools,
             SUM(CASE WHEN mr.evidence_submitted = 1 THEN 1 ELSE 0 END) as evidence_schools,
             AVG(mr.attendance_rate) as avg_attendance,
             SUM(mr.total_enrollment) as total_enrollment
      FROM monthly_records mr
      JOIN schools s ON mr.school_code = s.school_code
      WHERE mr.reporting_month = ?
    `;
    const schoolParams: any[] = [month];

    if (district) {
      schoolQuery += ` AND s.district = ?`;
      schoolParams.push(district);
    }

    const schoolStats = db.prepare(schoolQuery).get(schoolParams) as any;
    
    const totalRecords = schoolStats?.total_records || 0;
    const activeSchools = schoolStats?.active_schools || 0;
    const evidenceSchools = schoolStats?.evidence_schools || 0;
    const avgAttendance = schoolStats?.avg_attendance || 0;

    const participationRate = totalRecords > 0 ? (activeSchools / totalRecords) * 100 : 0;
    const evidenceRate = activeSchools > 0 ? (evidenceSchools / activeSchools) * 100 : 0;

    // 2. Fetch total grant expenditures (utilized units) for the month
    let financeQuery = `
      SELECT SUM(gf.monthly_utilized_units) as total_utilized 
      FROM grant_finance gf
    `;
    const financeParams: any[] = [];

    if (district) {
      // Join on grants to verify if they cover this district
      financeQuery += `
        JOIN grants g ON gf.grant_id = g.grant_id
        WHERE gf.reporting_month = ? AND g.covered_districts LIKE ?
      `;
      financeParams.push(month, `%${district}%`);
    } else {
      financeQuery += ` WHERE gf.reporting_month = ?`;
      financeParams.push(month);
    }

    const financeStats = db.prepare(financeQuery).get(financeParams) as any;
    const totalSpend = financeStats?.total_utilized || 0;

    // 3. Scan anomalies
    const anomalies = detectAnomalies(month, district);

    return NextResponse.json({
      success: true,
      data: {
        activeSchools,
        participationRate: Math.round(participationRate * 100) / 100,
        evidenceRate: Math.round(evidenceRate * 100) / 100,
        attendanceRate: Math.round(avgAttendance * 100) / 100,
        totalSpend,
        anomalies,
      },
    });

  } catch (error: any) {
    console.error('Error in /api/review/metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
