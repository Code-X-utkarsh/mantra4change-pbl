import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const schools = db.prepare('SELECT COUNT(*) as count FROM schools').get() as { count: number };
    const monthly_records = db.prepare('SELECT COUNT(*) as count FROM monthly_records').get() as { count: number };
    const grants = db.prepare('SELECT COUNT(*) as count FROM grants').get() as { count: number };
    const grant_finance = db.prepare('SELECT COUNT(*) as count FROM grant_finance').get() as { count: number };
    const grant_performance = db.prepare('SELECT COUNT(*) as count FROM grant_performance').get() as { count: number };
    const evidence_media = db.prepare('SELECT COUNT(*) as count FROM evidence_media').get() as { count: number };

    return NextResponse.json({
      status: 'ok',
      counts: {
        schools: schools.count,
        monthly_records: monthly_records.count,
        grants: grants.count,
        grant_finance: grant_finance.count,
        grant_performance: grant_performance.count,
        evidence_media: evidence_media.count,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
