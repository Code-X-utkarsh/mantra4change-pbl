import { db } from './db';
import { MonthlyRecord } from './calculations';

export interface Grant {
  id: number;
  grant_id: string;
  donor: string;
  grant_name: string;
  period_start: string;
  period_end: string;
  covered_districts: string;
}

export interface GrantFinanceRow {
  id: number;
  grant_id: string;
  reporting_month: string;
  budget_line: string;
  approved_budget_units: number;
  monthly_utilized_units: number;
  cumulative_utilized_units: number;
  cumulative_utilization_rate: number;
  finance_note: string;
}

export interface GrantPerformanceRow {
  id: number;
  grant_id: string;
  reporting_month: string;
  period_end_date: string;
  report_due_date: string;
  report_status: string;
  covered_districts: string;
  sampled_school_records: number;
  schools_completed_pbl: number;
  pbl_completion_rate: number;
  schools_with_evidence: number;
  evidence_submission_rate: number;
  total_enrollment: number;
  total_attendance: number;
  attendance_rate: number;
  risk_status: string;
  milestone_summary: string;
  draft_report_text: string;
}

export interface EvidenceMediaRow {
  id: number;
  record_id: string;
  record_type: string;
  grant_id: string;
  donor: string;
  reporting_month: string;
  district: string;
  title: string;
  summary_or_caption: string;
  file_name: string;
  relative_path: string;
  usage_note: string;
}

/**
 * Fetches distinct reporting months sorted ascending.
 */
export function getAvailableMonths(): string[] {
  const rows = db.prepare('SELECT DISTINCT reporting_month FROM monthly_records ORDER BY reporting_month ASC').all() as { reporting_month: string }[];
  return rows.map(r => r.reporting_month);
}

/**
 * Fetches distinct districts sorted ascending.
 */
export function getAvailableDistricts(): string[] {
  const rows = db.prepare('SELECT DISTINCT district FROM schools ORDER BY district ASC').all() as { district: string }[];
  return rows.map(r => r.district);
}

/**
 * Fetches distinct blocks. If a district is provided, filters for blocks in that district.
 */
export function getAvailableBlocks(district?: string): string[] {
  if (district) {
    const rows = db.prepare(`
      SELECT DISTINCT s.block 
      FROM schools s 
      JOIN monthly_records mr ON s.school_code = mr.school_code 
      WHERE s.district = ? 
      ORDER BY s.block ASC
    `).all(district) as { block: string }[];
    return rows.map(r => r.block);
  } else {
    const rows = db.prepare('SELECT DISTINCT block FROM schools ORDER BY block ASC').all() as { block: string }[];
    return rows.map(r => r.block);
  }
}

/**
 * Fetches monthly records joined with school details based on optional filters.
 */
export function getFilteredRecords(filters: {
  month?: string;
  district?: string;
  block?: string;
  grade?: string;
  subject?: string;
}): MonthlyRecord[] {
  let query = `
    SELECT mr.*, s.school_name, s.district, s.block
    FROM monthly_records mr
    JOIN schools s ON mr.school_code = s.school_code
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.month) {
    conditions.push("mr.reporting_month = ?");
    params.push(filters.month);
  }
  if (filters.district) {
    conditions.push("s.district = ?");
    params.push(filters.district);
  }
  if (filters.block) {
    conditions.push("s.block = ?");
    params.push(filters.block);
  }
  if (filters.grade) {
    conditions.push("mr.classes_conducted LIKE ?");
    params.push(`%${filters.grade}%`);
  }
  if (filters.subject) {
    conditions.push("mr.subject LIKE ?");
    params.push(`%${filters.subject}%`);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY mr.reporting_month ASC, s.school_code ASC";

  return db.prepare(query).all(params) as MonthlyRecord[];
}

/**
 * Fetches all records for a specific month.
 */
export function getRecordsByMonth(month: string): MonthlyRecord[] {
  return getFilteredRecords({ month });
}

/**
 * Fetches all records for a specific district.
 */
export function getAllRecordsForDistrict(district: string): MonthlyRecord[] {
  return getFilteredRecords({ district });
}

/**
 * Fetches all grants.
 */
export function getGrantList(): Grant[] {
  return db.prepare('SELECT * FROM grants ORDER BY grant_id ASC').all() as Grant[];
}

/**
 * Fetches a single grant profile by its ID.
 */
export function getGrantById(grantId: string): Grant | null {
  const row = db.prepare('SELECT * FROM grants WHERE grant_id = ?').get(grantId) as Grant | undefined;
  return row || null;
}

/**
 * Fetches grant finance rows.
 */
export function getGrantFinance(grantId: string, month?: string): GrantFinanceRow[] {
  if (month) {
    return db.prepare('SELECT * FROM grant_finance WHERE grant_id = ? AND reporting_month = ? ORDER BY budget_line ASC').all(grantId, month) as GrantFinanceRow[];
  } else {
    return db.prepare('SELECT * FROM grant_finance WHERE grant_id = ? ORDER BY reporting_month ASC, budget_line ASC').all(grantId) as GrantFinanceRow[];
  }
}

/**
 * Fetches a grant performance row. Returns the latest month if no month is provided.
 */
export function getGrantPerformance(grantId: string, month?: string): GrantPerformanceRow | null {
  if (month) {
    const row = db.prepare('SELECT * FROM grant_performance WHERE grant_id = ? AND reporting_month = ?').get(grantId, month) as GrantPerformanceRow | undefined;
    return row || null;
  } else {
    const row = db.prepare('SELECT * FROM grant_performance WHERE grant_id = ? ORDER BY reporting_month DESC LIMIT 1').get(grantId) as GrantPerformanceRow | undefined;
    return row || null;
  }
}

/**
 * Fetches evidence media index records.
 */
export function getGrantEvidence(grantId: string, month?: string): EvidenceMediaRow[] {
  if (month) {
    return db.prepare('SELECT * FROM evidence_media WHERE grant_id = ? AND reporting_month = ? ORDER BY record_id ASC').all(grantId, month) as EvidenceMediaRow[];
  } else {
    return db.prepare('SELECT * FROM evidence_media WHERE grant_id = ? ORDER BY reporting_month ASC, record_id ASC').all(grantId) as EvidenceMediaRow[];
  }
}

/**
 * Fetches distinct reporting months that have performance data for a grant.
 */
export function getGrantMonths(grantId: string): string[] {
  const rows = db.prepare(`
    SELECT DISTINCT reporting_month 
    FROM grant_performance 
    WHERE grant_id = ? 
    ORDER BY reporting_month ASC
  `).all(grantId) as { reporting_month: string }[];
  return rows.map(r => r.reporting_month);
}
