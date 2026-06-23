export interface MonthlyRecord {
  id: number;
  school_code: string;
  reporting_month: string;
  pbl_conducted: number;
  evidence_submitted: number;
  classes_conducted: string;
  subject: string;
  enrollment_class6: number;
  enrollment_class7: number;
  enrollment_class8: number;
  attendance_class6_science: number;
  attendance_class6_math: number;
  attendance_class7_science: number;
  attendance_class7_math: number;
  attendance_class8_science: number;
  attendance_class8_math: number;
  total_enrollment: number;
  total_attendance: number;
  attendance_rate: number;
  risk_status: string;
  // Optional joined fields
  school_name?: string;
  district?: string;
  block?: string;
}

export interface DistrictSummary {
  district: string;
  totalSchools: number;
  participationRate: number;
  evidenceRate: number;
  attendanceRate: number;
  totalEnrollment: number;
  riskStatus: "On Track" | "Behind" | "At Risk" | "Critical";
}

export interface BlockSummary {
  block: string;
  totalSchools: number;
  participationRate: number;
  evidenceRate: number;
  attendanceRate: number;
  totalEnrollment: number;
  riskStatus: "On Track" | "Behind" | "At Risk" | "Critical";
}

/**
 * Calculates the participation rate of schools doing PBL (0-100).
 */
export function computeParticipationRate(records: MonthlyRecord[]): number {
  if (records.length === 0) return 0;
  const conducted = records.filter(r => r.pbl_conducted === 1).length;
  const rate = (conducted / records.length) * 100;
  return Math.round(rate * 100) / 100;
}

/**
 * Calculates the evidence submission rate of schools doing PBL (0-100).
 */
export function computeEvidenceRate(records: MonthlyRecord[]): number {
  if (records.length === 0) return 0;
  const evidence = records.filter(r => r.evidence_submitted === 1).length;
  const rate = (evidence / records.length) * 100;
  return Math.round(rate * 100) / 100;
}

/**
 * Calculates the average attendance rate across records (0-100).
 * Multiplies database fraction by 100 to get percentage.
 */
export function computeAttendanceRate(records: MonthlyRecord[]): number {
  if (records.length === 0) return 0;
  const sum = records.reduce((acc, r) => acc + (r.attendance_rate || 0), 0);
  const avg = (sum / records.length) * 100;
  return Math.round(avg * 100) / 100;
}

/**
 * Calculates total enrollment across records.
 */
export function computeTotalEnrollment(records: MonthlyRecord[]): number {
  return records.reduce((acc, r) => acc + (r.total_enrollment || 0), 0);
}

/**
 * Calculates total attendance across records.
 */
export function computeTotalAttendance(records: MonthlyRecord[]): number {
  const sum = records.reduce((acc, r) => acc + (r.total_attendance || 0), 0);
  return Math.round(sum * 100) / 100;
}

/**
 * Calculates Month-over-Month percentage change.
 */
export function computeMoMChange(currentValue: number, previousValue: number | null): number | null {
  if (previousValue === null || previousValue === undefined || previousValue === 0) return null;
  const change = ((currentValue - previousValue) / previousValue) * 100;
  return Math.round(change * 100) / 100;
}

/**
 * Classifies risk status based on performance rate (0-100).
 */
export function classifyRisk(rate: number): "On Track" | "Behind" | "At Risk" | "Critical" {
  if (rate >= 75) return "On Track";
  if (rate >= 60) return "Behind";
  if (rate >= 35) return "At Risk";
  return "Critical";
}

/**
 * Computes district-level summary.
 */
export function computeDistrictSummary(district: string, records: MonthlyRecord[]): DistrictSummary {
  const totalSchools = new Set(records.map(r => r.school_code)).size;
  const participationRate = computeParticipationRate(records);
  const evidenceRate = computeEvidenceRate(records);
  const attendanceRate = computeAttendanceRate(records);
  const totalEnrollment = computeTotalEnrollment(records);
  const riskStatus = classifyRisk(participationRate);

  return {
    district,
    totalSchools,
    participationRate,
    evidenceRate,
    attendanceRate,
    totalEnrollment,
    riskStatus
  };
}

/**
 * Computes block-level summary.
 */
export function computeBlockSummary(block: string, records: MonthlyRecord[]): BlockSummary {
  const totalSchools = new Set(records.map(r => r.school_code)).size;
  const participationRate = computeParticipationRate(records);
  const evidenceRate = computeEvidenceRate(records);
  const attendanceRate = computeAttendanceRate(records);
  const totalEnrollment = computeTotalEnrollment(records);
  const riskStatus = classifyRisk(participationRate);

  return {
    block,
    totalSchools,
    participationRate,
    evidenceRate,
    attendanceRate,
    totalEnrollment,
    riskStatus
  };
}

/**
 * Ranks districts or blocks by participation rate descending.
 */
export function rankByParticipation<T extends DistrictSummary | BlockSummary>(summaries: T[]): T[] {
  return [...summaries].sort((a, b) => b.participationRate - a.participationRate);
}
