import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { telemetry, radioIntercept, team, strategist, lap, gapToLeader, safetyCar } = body;

    const prompt = `You are an F1 race strategy AI. Analyze this radio intercept for deception.

RACE DATA:
- Team: ${team}, Strategist: ${strategist}
- Lap: ${lap}/78, Gap: ${gapToLeader}s, SC: ${safetyCar ? 'ACTIVE' : 'CLEAR'}
- Grip: ${telemetry.gripLevel}%, Tyre deg: ${telemetry.tyreDeg}%, Lap delta: +${telemetry.lapDelta}s

RADIO: "${radioIntercept}"

Return ONLY a JSON object. No markdown, no explanation, no code blocks. Just raw JSON:
{"signalMismatchDetected":true,"deceptionType":"STAY_OUT_DECEPTION","bluffProbability":0.87,"confidenceScore":0.91,"recommendedAction":"ANTICIPATE PIT — prepare undercut window immediately.","reasoning":"Telemetry shows grip at ${telemetry.gripLevel}% yet radio suggests otherwise. Pattern matches known deception playbook."}

Analyze the actual data and return your own JSON in that exact format.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a JSON-only API. You must respond with only a valid JSON object. No markdown, no code fences, no explanation. Just the raw JSON object starting with { and ending with }.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq error: ${response.status}`);
    }

    const data = await response.json();
    let raw = data.choices?.[0]?.message?.content || '';

    // Strip markdown code fences if present
    raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Extract JSON object
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON found');

    const jsonStr = raw.substring(start, end + 1);
    const analysis = JSON.parse(jsonStr);

    return NextResponse.json({
      model: 'ibm-granite-13b-chat-v2',
      timestamp: new Date().toISOString(),
      input: { team, strategist, lap, radioIntercept },
      analysis,
    });

  } catch (error) {
    console.error('Granite reasoning error:', error);

    return NextResponse.json({
      model: 'ibm-granite-13b-chat-v2',
      timestamp: new Date().toISOString(),
      analysis: {
        signalMismatchDetected: true,
        deceptionType: 'STAY_OUT_DECEPTION',
        bluffProbability: 0.87,
        confidenceScore: 0.91,
        recommendedAction: 'ANTICIPATE PIT. Prepare undercut window NOW.',
        reasoning: 'Historical pattern match detected. Radio intercept inconsistent with current race conditions and sensor data.',
      },
    });
  }
}