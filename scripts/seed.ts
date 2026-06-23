import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { db } from '../lib/db';
import { initDbSchema } from '../db/schema';

// Helper functions for parsing values safely
function parseValInt(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  const parsed = parseInt(String(val).trim(), 10);
  return isNaN(parsed) ? 0 : parsed;
}

function parseValFloat(val: any): number {
  if (val === null || val === undefined || val === '') return 0.0;
  const parsed = parseFloat(String(val).trim());
  return isNaN(parsed) ? 0.0 : parsed;
}

function parseBooleanInt(val: any): number {
  if (!val) return 0;
  const str = String(val).trim().toLowerCase();
  return str === 'yes' || str === '1' || str === 'true' ? 1 : 0;
}

function runSeed() {
  console.log('STEP 1: Dropping and recreating tables...');
  initDbSchema(db, true);
  console.log('Database tables cleared and recreated.');

  // Create prepared statements
  const insertSchool = db.prepare(`
    INSERT INTO schools (school_code, school_name, district, block)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(school_code) DO NOTHING
  `);

  const insertMonthlyRecord = db.prepare(`
    INSERT OR REPLACE INTO monthly_records (
      school_code, reporting_month, pbl_conducted, evidence_submitted,
      classes_conducted, subject, enrollment_class6, enrollment_class7,
      enrollment_class8, attendance_class6_science, attendance_class6_math,
      attendance_class7_science, attendance_class7_math, attendance_class8_science,
      attendance_class8_math, total_enrollment, total_attendance,
      attendance_rate, risk_status
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  const insertGrant = db.prepare(`
    INSERT OR IGNORE INTO grants (grant_id, donor, grant_name, period_start, period_end, covered_districts)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertGrantFinance = db.prepare(`
    INSERT INTO grant_finance (
      grant_id, reporting_month, budget_line, approved_budget_units,
      monthly_utilized_units, cumulative_utilized_units, cumulative_utilization_rate,
      finance_note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGrantPerformance = db.prepare(`
    INSERT OR REPLACE INTO grant_performance (
      grant_id, reporting_month, period_end_date, report_due_date,
      report_status, covered_districts, sampled_school_records,
      schools_completed_pbl, pbl_completion_rate, schools_with_evidence,
      evidence_submission_rate, total_enrollment, total_attendance,
      attendance_rate, risk_status, milestone_summary, draft_report_text
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?
    )
  `);

  const insertEvidenceMedia = db.prepare(`
    INSERT OR REPLACE INTO evidence_media (
      record_id, record_type, grant_id, donor, reporting_month,
      district, title, summary_or_caption, file_name, relative_path,
      usage_note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Wrap all ingestions in a single transaction for massive performance improvement
  const ingestData = db.transaction(() => {
    // STEP 2: Ingest monthly school CSVs
    const schoolCSVFiles = [
      'PBL_School_Response_Data_July_2025.csv',
      'PBL_School_Response_Data_August_2025.csv',
      'PBL_School_Response_Data_September_2025.csv'
    ];

    console.log('\nSTEP 2: Parsing and ingesting primary PBL CSVs...');
    for (const filename of schoolCSVFiles) {
      const filepath = path.join(process.cwd(), 'data', filename);
      console.log(`Processing ${filename}...`);
      if (!fs.existsSync(filepath)) {
        throw new Error(`File not found: ${filepath}`);
      }

      const csvContent = fs.readFileSync(filepath, 'utf8');
      const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });

      for (const row of parsed.data as any[]) {
        const schoolCode = row["What is your school's synthetic school code?"];
        if (!schoolCode) continue; // Skip malformed rows

        // Insert School
        insertSchool.run(
          schoolCode,
          row["What is the name of your school?"],
          row["What is the name of your district?"],
          row["Block Details"]
        );

        // Insert Monthly Record
        insertMonthlyRecord.run(
          schoolCode,
          row["Reporting Month"],
          parseBooleanInt(row["Was the PBL project conducted in your school this month?"]),
          parseBooleanInt(row["Was evidence submitted for the completed PBL project?"]),
          row["In which class/classes did you conduct the PBL project?"],
          row["Which subject do you teach?"],
          parseValInt(row["Total number of students enrolled in Class 6, including all sections"]),
          parseValInt(row["Total number of students enrolled in Class 7, including all sections"]),
          parseValInt(row["Total number of students enrolled in Class 8, including all sections"]),
          parseValFloat(row["Average student attendance during the Class 6 PBL Science session. If you did not teach Science in Class 6, enter 0."]),
          parseValFloat(row["Average student attendance during the Class 6 PBL Math session. If you did not teach Math in Class 6, enter 0."]),
          parseValFloat(row["Average student attendance during the Class 7 PBL Science session. If you did not teach Science in Class 7, enter 0."]),
          parseValFloat(row["Average student attendance during the Class 7 PBL Math session. If you did not teach Math in Class 7, enter 0."]),
          parseValFloat(row["Average student attendance during the Class 8 PBL Science session. If you did not teach Science in Class 8, enter 0."]),
          parseValFloat(row["Average student attendance during the Class 8 PBL Math session. If you did not teach Math in Class 8, enter 0."]),
          parseValInt(row["Derived: Total enrollment across Classes 6-8"]),
          parseValFloat(row["Derived: Total attendance across PBL Science and Math sessions"]),
          parseValFloat(row["Derived: Overall PBL attendance rate"]),
          row["Derived: Risk status"]
        );
      }
    }

    // STEP 3: Ingest Grant CSVs
    console.log('\nSTEP 3: Parsing and ingesting Grant CSVs...');

    // 3.1 Grant Profile and Finance
    const financePath = path.join(process.cwd(), 'data', '01_Grant_Profile_and_Finance.csv');
    if (!fs.existsSync(financePath)) {
      throw new Error(`File not found: ${financePath}`);
    }
    console.log('Processing 01_Grant_Profile_and_Finance.csv...');
    const financeContent = fs.readFileSync(financePath, 'utf8');
    const parsedFinance = Papa.parse(financeContent, { header: true, skipEmptyLines: true });

    for (const row of parsedFinance.data as any[]) {
      const grantId = row.grant_id;
      if (!grantId) continue;

      // Upsert Grant Profile
      insertGrant.run(
        grantId,
        row.donor,
        row.grant_name,
        row.period_start,
        row.period_end,
        row.covered_districts
      );

      // Insert Grant Finance Row
      insertGrantFinance.run(
        grantId,
        row.reporting_month,
        row.budget_line,
        parseValInt(row.approved_budget_units),
        parseValInt(row.monthly_utilized_units),
        parseValInt(row.cumulative_utilized_units),
        parseValFloat(row.cumulative_utilization_rate),
        row.finance_note
      );
    }

    // 3.2 Grant Performance
    const perfPath = path.join(process.cwd(), 'data', '02_Grant_Performance_and_Report_Material.csv');
    if (!fs.existsSync(perfPath)) {
      throw new Error(`File not found: ${perfPath}`);
    }
    console.log('Processing 02_Grant_Performance_and_Report_Material.csv...');
    const perfContent = fs.readFileSync(perfPath, 'utf8');
    const parsedPerf = Papa.parse(perfContent, { header: true, skipEmptyLines: true });

    for (const row of parsedPerf.data as any[]) {
      const grantId = row.grant_id;
      if (!grantId) continue;

      insertGrantPerformance.run(
        grantId,
        row.reporting_month,
        row.period_end_date,
        row.report_due_date,
        row.report_status,
        row.covered_districts,
        parseValInt(row.sampled_school_records),
        parseValInt(row.schools_completed_pbl),
        parseValFloat(row.pbl_completion_rate),
        parseValInt(row.schools_with_evidence),
        parseValFloat(row.evidence_submission_rate),
        parseValInt(row.total_enrollment),
        parseValInt(row.total_attendance),
        parseValFloat(row.attendance_rate),
        row.risk_status,
        row.milestone_summary,
        row.draft_report_text
      );
    }

    // 3.3 Evidence Media
    const mediaPath = path.join(process.cwd(), 'data', '03_Evidence_and_Media_Index.csv');
    if (!fs.existsSync(mediaPath)) {
      throw new Error(`File not found: ${mediaPath}`);
    }
    console.log('Processing 03_Evidence_and_Media_Index.csv...');
    const mediaContent = fs.readFileSync(mediaPath, 'utf8');
    const parsedMedia = Papa.parse(mediaContent, { header: true, skipEmptyLines: true });

    for (const row of parsedMedia.data as any[]) {
      const recordId = row.record_id;
      if (!recordId) continue;

      insertEvidenceMedia.run(
        recordId,
        row.record_type,
        row.grant_id,
        row.donor,
        row.reporting_month,
        row.district,
        row.title,
        row.summary_or_caption,
        row.file_name,
        row.relative_path,
        row.usage_note
      );
    }
  });

  ingestData();
  console.log('Ingest transaction committed successfully.');

  // STEP 4: Print summary
  console.log('\n================ SEED SUMMARY ================');
  
  const schoolCount = db.prepare('SELECT COUNT(*) as count FROM schools').get() as { count: number };
  console.log(`Total schools inserted: ${schoolCount.count}`);

  const monthlyCounts = db.prepare(`
    SELECT reporting_month, COUNT(*) as count 
    FROM monthly_records 
    GROUP BY reporting_month 
    ORDER BY reporting_month
  `).all() as { reporting_month: string; count: number }[];

  console.log('Total monthly_records inserted per month:');
  for (const row of monthlyCounts) {
    console.log(`  - ${row.reporting_month}: ${row.count}`);
  }

  const grantCount = db.prepare('SELECT COUNT(*) as count FROM grants').get() as { count: number };
  console.log(`Total grants inserted: ${grantCount.count}`);

  const financeCount = db.prepare('SELECT COUNT(*) as count FROM grant_finance').get() as { count: number };
  console.log(`Total grant_finance rows: ${financeCount.count}`);

  const perfCount = db.prepare('SELECT COUNT(*) as count FROM grant_performance').get() as { count: number };
  console.log(`Total grant_performance rows: ${perfCount.count}`);

  const mediaCount = db.prepare('SELECT COUNT(*) as count FROM evidence_media').get() as { count: number };
  console.log(`Total evidence_media rows: ${mediaCount.count}`);
  
  console.log('==============================================\n');
}

try {
  runSeed();
} catch (error) {
  console.error('Seeding failed with error:', error);
  process.exit(1);
}
