import { db } from './db';

export interface Anomaly {
  type: string;
  location: string;
  level: 'Warning' | 'Critical';
  description: string;
}

/**
 * Programmatically scans the SQLite database for compliance issues and anomalies for a given month and optional district filter.
 */
export function detectAnomalies(month: string, district?: string): Anomaly[] {
  const anomalies: Anomaly[] = [];

  try {
    // 1. Scan Grant-Level Performance and Finance anomalies
    const performanceQuery = `
      SELECT gp.*, g.grant_name 
      FROM grant_performance gp
      JOIN grants g ON gp.grant_id = g.grant_id
      WHERE gp.reporting_month = ?
    `;
    const perfParams: any[] = [month];
    const perfRows = db.prepare(performanceQuery).all(perfParams) as any[];

    for (const perf of perfRows) {
      // If a district is specified, check if this grant covers that district
      if (district) {
        const covered = gpCoversDistrict(perf.grant_id, district);
        if (!covered) continue;
      }

      // Fetch financial summary for this grant and month
      const finance = db.prepare(`
        SELECT SUM(approved_budget_units) as total_approved, 
               SUM(monthly_utilized_units) as total_utilized 
        FROM grant_finance 
        WHERE grant_id = ? AND reporting_month = ?
      `).get(perf.grant_id, month) as any;

      const totalApproved = finance?.total_approved || 0;
      const totalUtilized = finance?.total_utilized || 0;
      const utilizationRate = totalApproved > 0 ? (totalUtilized / totalApproved) * 100 : 0;
      
      const pblRate = Math.round((perf.pbl_completion_rate || 0) * 100 * 100) / 100;
      const evidenceRate = Math.round((perf.evidence_submission_rate || 0) * 100 * 100) / 100;

      // Anomaly A: Budget Frontloading (High Spend / Low PBL completion)
      if (utilizationRate > 70 && pblRate < 30) {
        anomalies.push({
          type: 'Budget Frontloading',
          location: `Grant: ${perf.grant_name}`,
          level: 'Critical',
          description: `Budget utilization is high at ${utilizationRate.toFixed(1)}% of allocations, but PBL completion rate lags at ${pblRate}%.`,
        });
      }

      // Anomaly B: Missing Proof of Concept (High completion / Low evidence submission)
      if (pblRate > 60 && evidenceRate < 15) {
        anomalies.push({
          type: 'Missing Evidence Proofs',
          location: `Grant: ${perf.grant_name}`,
          level: 'Warning',
          description: `NGO reports high PBL completion (${pblRate}%), but media evidence uploads remain critical at ${evidenceRate}%.`,
        });
      }
    }

    // 2. Scan Block-Level Attendance and Participation discrepancies
    let blockQuery = `
      SELECT s.block, s.district, 
             AVG(mr.attendance_rate) as avg_attendance,
             SUM(CASE WHEN mr.pbl_conducted = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(mr.id) as completion_rate
      FROM monthly_records mr
      JOIN schools s ON mr.school_code = s.school_code
      WHERE mr.reporting_month = ?
    `;
    const blockParams: any[] = [month];

    if (district) {
      blockQuery += ` AND s.district = ?`;
      blockParams.push(district);
    }

    blockQuery += ` GROUP BY s.block, s.district`;

    const blockRows = db.prepare(blockQuery).all(blockParams) as any[];

    for (const row of blockRows) {
      const avgAtt = row.avg_attendance || 0;
      const compRate = row.completion_rate || 0;

      // Anomaly C: High completion reported but critical student attendance
      if (compRate > 75 && avgAtt < 50) {
        anomalies.push({
          type: 'Attendance Divergence',
          location: `Block: ${row.block} (${row.district})`,
          level: 'Warning',
          description: `PBL project conduction is high (${Math.round(compRate)}%), but average student attendance is critical at ${Math.round(avgAtt)}%.`,
        });
      }
    }

  } catch (error) {
    console.error('Error runing detectAnomalies:', error);
  }

  return anomalies;
}

// Helper checking covered districts
function gpCoversDistrict(grantId: string, districtName: string): boolean {
  try {
    const row = db.prepare('SELECT covered_districts FROM grants WHERE grant_id = ?').get(grantId) as any;
    if (row && row.covered_districts) {
      const list = row.covered_districts.split(';').map((d: string) => d.trim().toLowerCase());
      return list.includes(districtName.toLowerCase());
    }
  } catch (e) {
    console.error(e);
  }
  return false;
}
