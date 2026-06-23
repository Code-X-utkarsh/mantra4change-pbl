import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let prompt = '';
  try {
    const body = await request.json();
    const { month, district, facts } = body;

    if (!month || !facts) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: month or facts' },
        { status: 400 }
      );
    }

    // Compile facts into system prompt
    prompt = `You are a staff NGO Operations Review director. Write a professional 3-paragraph Executive Program Evaluation and Corrective Action Plan for Mantra4Change based ONLY on the following monthly audit data.

Period: ${facts.monthLabel || month}
District Context: ${district || 'All Districts'}
Active Participating Schools: ${facts.activeSchools}
PBL Completion Rate: ${facts.participationRate}%
Evidence Upload Rate: ${facts.evidenceRate}%
Average Student Attendance: ${facts.attendanceRate}%
Total Monthly Expenditure: ${facts.totalSpend}
Flagged Operational Anomalies: ${facts.anomaliesCount}

Detailed Flags:
${facts.anomaliesText || 'No major compliance issues detected.'}

Format guidelines:
- Paragraph 1: Operational overview and metrics review.
- Paragraph 2: Discussion of flagged anomalies, compliance gaps, and evidence status.
- Paragraph 3: Specific corrective actions and recommendations.
Write in a formal, analytical evaluation tone. Do not invent any numbers, regions, or metrics not listed above. Do not use markdown bullet lists.`;

    // 1. Try Primary Model: Gemini
    const primaryKey = process.env.GEMINI_API_KEY;
    if (primaryKey && primaryKey !== 'your_gemini_api_key_here' && primaryKey.trim() !== '') {
      try {
        const genAI = new GoogleGenerativeAI(primaryKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text && text.trim().length > 0) {
          return NextResponse.json({
            success: true,
            data: {
              narrative: text.trim(),
              source: 'ai',
              model: 'gemini-2.5-flash',
            },
          });
        }
      } catch (geminiError) {
        console.warn('Primary Gemini call failed, attempting failover to secondary model...', geminiError);
      }
    }

    // 2. Try Secondary Model: Llama (or other OpenAI-compatible endpoints)
    const secondaryKey = process.env.SECONDARY_LLM_API_KEY;
    const secondaryEndpoint = process.env.SECONDARY_LLM_ENDPOINT || 'https://integrate.api.nvidia.com/v1/chat/completions';
    const secondaryModel = process.env.SECONDARY_LLM_MODEL || 'meta-llama/llama-3.2-3b-instruct';

    if (secondaryKey && secondaryKey !== 'your_llama_api_key_here' && secondaryKey.trim() !== '') {
      try {
        const response = await fetch(secondaryEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secondaryKey}`,
          },
          body: JSON.stringify({
            model: secondaryModel,
            messages: [
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const resJson = await response.json();
          const text = resJson.choices?.[0]?.message?.content;
          if (text && text.trim().length > 0) {
            return NextResponse.json({
              success: true,
              data: {
                narrative: text.trim(),
                source: 'ai',
                model: `${secondaryModel} (Failover)`,
              },
            });
          }
        }
        console.warn('Secondary LLM service responded with error status:', response.status);
      } catch (secondaryError) {
        console.error('Secondary LLM call failed:', secondaryError);
      }
    }

    return NextResponse.json(
      { success: false, error: 'AI generation failed on both primary (Gemini) and secondary (Llama) models.' },
      { status: 503 }
    );

  } catch (error: any) {
    console.error('Error generating Review Narrative:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during narrative generation.' },
      { status: 500 }
    );
  }
}
