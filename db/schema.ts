import Database from 'better-sqlite3';

/**
 * Initializes the database schema.
 * @param db The database connection instance.
 * @param forceDrop If true, drops existing tables first. Use with caution!
 */
export function initDbSchema(db: Database.Database, forceDrop = false) {
  if (forceDrop) {
    db.exec(`
      DROP TABLE IF EXISTS evidence_media;
      DROP TABLE IF EXISTS grant_performance;
      DROP TABLE IF EXISTS grant_finance;
      DROP TABLE IF EXISTS monthly_records;
      DROP TABLE IF EXISTS grants;
      DROP TABLE IF EXISTS schools;
    `);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS schools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_code TEXT UNIQUE NOT NULL,
      school_name TEXT,
      district TEXT NOT NULL,
      block TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS monthly_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_code TEXT NOT NULL,
      reporting_month TEXT NOT NULL,
      pbl_conducted INTEGER,
      evidence_submitted INTEGER,
      classes_conducted TEXT,
      subject TEXT,
      enrollment_class6 INTEGER,
      enrollment_class7 INTEGER,
      enrollment_class8 INTEGER,
      attendance_class6_science REAL,
      attendance_class6_math REAL,
      attendance_class7_science REAL,
      attendance_class7_math REAL,
      attendance_class8_science REAL,
      attendance_class8_math REAL,
      total_enrollment INTEGER,
      total_attendance REAL,
      attendance_rate REAL,
      risk_status TEXT,
      FOREIGN KEY (school_code) REFERENCES schools(school_code),
      UNIQUE(school_code, reporting_month)
    );

    CREATE TABLE IF NOT EXISTS grants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grant_id TEXT UNIQUE NOT NULL,
      donor TEXT,
      grant_name TEXT,
      period_start TEXT,
      period_end TEXT,
      covered_districts TEXT
    );

    CREATE TABLE IF NOT EXISTS grant_finance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grant_id TEXT NOT NULL,
      reporting_month TEXT NOT NULL,
      budget_line TEXT NOT NULL,
      approved_budget_units INTEGER,
      monthly_utilized_units INTEGER,
      cumulative_utilized_units INTEGER,
      cumulative_utilization_rate REAL,
      finance_note TEXT,
      FOREIGN KEY (grant_id) REFERENCES grants(grant_id)
    );

    CREATE TABLE IF NOT EXISTS grant_performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grant_id TEXT NOT NULL,
      reporting_month TEXT NOT NULL,
      period_end_date TEXT,
      report_due_date TEXT,
      report_status TEXT,
      covered_districts TEXT,
      sampled_school_records INTEGER,
      schools_completed_pbl INTEGER,
      pbl_completion_rate REAL,
      schools_with_evidence INTEGER,
      evidence_submission_rate REAL,
      total_enrollment INTEGER,
      total_attendance INTEGER,
      attendance_rate REAL,
      risk_status TEXT,
      milestone_summary TEXT,
      draft_report_text TEXT,
      FOREIGN KEY (grant_id) REFERENCES grants(grant_id),
      UNIQUE(grant_id, reporting_month)
    );

    CREATE TABLE IF NOT EXISTS evidence_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT UNIQUE,
      record_type TEXT,
      grant_id TEXT NOT NULL,
      donor TEXT,
      reporting_month TEXT,
      district TEXT,
      title TEXT,
      summary_or_caption TEXT,
      file_name TEXT,
      relative_path TEXT,
      usage_note TEXT,
      FOREIGN KEY (grant_id) REFERENCES grants(grant_id)
    );
  `);
}
