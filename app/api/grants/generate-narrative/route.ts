import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let prompt = '';
  try {
    const body = await request.json();
    const { grantId, month, facts } = body;

    // Validate body
    if (!grantId || !month || !facts) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: grantId, month, or facts' },
        { status: 400 }
      );
    }

    // Format inputs into the requested prompt
    prompt = `You are a grant reporting assistant for an education NGO. Write a professional 2-paragraph report section for a donor grant report using ONLY the following verified program data. Do not invent any numbers, locations, or achievements not present in this data.

Grant: ${facts.grantName || grantId}
Reporting Month: ${facts.month || month}
PBL Completion Rate: ${facts.pblCompletionRate}%
Evidence Submission Rate: ${facts.evidenceRate}%
Attendance Rate: ${facts.attendanceRate}%
Budget Utilization: ${facts.overallUtilizationRate}%
Schools Sampled: ${facts.sampledSchools}
Total Student Enrollment: ${facts.totalEnrollment}
Milestone Status: ${facts.milestoneSummary || 'N/A'}
Risk Classification: ${facts.riskStatus || 'Unknown'}
Evidence Records Linked: ${facts.evidenceCount}

Write in formal grant reporting language. Do not use bullet points.
Do not add any information not provided above. End with one sentence about the program's trajectory based on the risk classification.`;

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
        console.warn('Primary Gemini call failed for Grant narrative. Attempting secondary LLM failover...', geminiError);
      }
    }

    // 2. Try Secondary Model: Llama
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
        console.warn('Secondary LLM service responded with error status for Grant narrative:', response.status);
      } catch (secondaryError) {
        console.error('Secondary LLM call failed for Grant narrative:', secondaryError);
      }
    }

    return NextResponse.json(
      { success: false, error: 'AI generation failed on both primary (Gemini) and secondary (Llama) models.' },
      { status: 503 }
    );

  } catch (error: any) {
    console.error('Error generating AI narrative:', error);
    return NextResponse.json(
      { success: false, error: 'AI generation failed' },
      { status: 500 }
    );
  }
}
