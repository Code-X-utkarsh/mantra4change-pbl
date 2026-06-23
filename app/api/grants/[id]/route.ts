import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '../../../../lib/api-helpers';
import {
  getGrantById,
  getGrantFinance,
  getGrantPerformance,
  getGrantEvidence,
  getGrantMonths
} from '../../../../lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const grantId = params.id;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || undefined;

    // 1. Fetch grant profile
    const grant = getGrantById(grantId);
    if (!grant) {
      return errorResponse('Grant not found', 404);
    }

    // 2. Fetch finance rows
    const financeRows = getGrantFinance(grantId, month);
    let totalApproved = 0;
    let totalUtilized = 0;

    const lineItems = financeRows.map(row => {
      totalApproved += row.approved_budget_units || 0;
      totalUtilized += row.monthly_utilized_units || 0;

      const rate = row.approved_budget_units > 0 
        ? (row.monthly_utilized_units / row.approved_budget_units) * 100 
        : 0;

      return {
        budgetLine: row.budget_line,
        approvedUnits: row.approved_budget_units,
        utilizedUnits: row.monthly_utilized_units,
        cumulativeUtilized: row.cumulative_utilized_units,
        utilizationRate: Math.round(rate * 100) / 100,
        note: row.finance_note
      };
    });

    const overallRate = totalApproved > 0 ? (totalUtilized / totalApproved) * 100 : 0;
    const finance = {
      month: month || 'all',
      lineItems,
      totalApproved,
      totalUtilized,
      overallUtilizationRate: Math.round(overallRate * 100) / 100
    };

    // 3. Fetch performance row
    const perfRow = getGrantPerformance(grantId, month);
    const performance = perfRow ? {
      pblCompletionRate: Math.round((perfRow.pbl_completion_rate || 0) * 100 * 100) / 100,
      evidenceSubmissionRate: Math.round((perfRow.evidence_submission_rate || 0) * 100 * 100) / 100,
      attendanceRate: Math.round((perfRow.attendance_rate || 0) * 100 * 100) / 100,
      totalEnrollment: perfRow.total_enrollment,
      totalAttendance: perfRow.total_attendance,
      riskStatus: perfRow.risk_status,
      milestoneSummary: perfRow.milestone_summary,
      draftReportText: perfRow.draft_report_text
    } : null;

    // 4. Fetch evidence rows
    const evidenceRows = getGrantEvidence(grantId, month);
    const evidence = evidenceRows.map(row => ({
      recordId: row.record_id,
      recordType: row.record_type,
      title: row.title,
      summaryOrCaption: row.summary_or_caption,
      fileName: row.file_name,
      relativePath: row.relative_path,
      usageNote: row.usage_note
    }));

    // 5. Fetch available months for this grant
    const availableMonths = getGrantMonths(grantId);

    // 6. Map grant profile to camelCase response structure
    const grantProfile = {
      grantId: grant.grant_id,
      grantName: grant.grant_name,
      donor: grant.donor,
      periodStart: grant.period_start,
      periodEnd: grant.period_end,
      coveredDistricts: grant.covered_districts ? grant.covered_districts.split(';').map(d => d.trim()) : []
    };

    return successResponse({
      grant: grantProfile,
      finance,
      performance,
      evidence,
      availableMonths
    });
  } catch (error: any) {
    console.error(`Error in /api/grants/${params?.id}:`, error);
    return errorResponse('Internal server error', 500);
  }
}
