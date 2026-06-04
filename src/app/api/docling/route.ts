import { NextResponse } from 'next/server';

// In production: IBM Docling ingests PDFs (FIA regulations, race transcripts, strategy docs)
// and exposes a FAISS vector search endpoint. Swap mock below with:
// const res = await fetch(`${process.env.DOCLING_ENDPOINT}/query`, {
//   method: 'POST',
//   headers: { 'Authorization': `Bearer ${process.env.IBM_API_KEY}` },
//   body: JSON.stringify({ query: `strategist profile ${target}`, top_k: 5 })
// });

const STRATEGIST_PROFILES: Record<string, object> = {
  lambiase: {
    name: 'Gianpiero Lambiase',
    team: 'Red Bull Racing',
    role: 'Principal Race Engineer',
    aggressionIndex: 88,
    riskTolerance: 'Extreme',
    knownDeceptions: [
      'Broadcasts "staying out" within 1 lap of actual pit stop',
      'Deploys dummy pit crew to force rival overcut',
      'Radio silence before aggressive undercut attempts',
    ],
    historicalPatterns: [
      { scenario: 'Undercut trigger at gap < 1.5s', probability: 92, confidence: 'High', seasons: 5 },
      { scenario: 'Dummy pit crew deployment', probability: 65, confidence: 'Medium', seasons: 3 },
      { scenario: 'Late safety car gamble', probability: 80, confidence: 'High', seasons: 5 },
      { scenario: '"Staying out" bluff pre-pit', probability: 87, confidence: 'High', seasons: 4 },
    ],
    doclingSource: 'race_transcripts_2020_2024.pdf · fia_radio_logs.pdf',
    ragConfidence: 0.94,
  },
  xavi: {
    name: 'Xavi Marcos',
    team: 'Ferrari',
    role: 'Race Strategist',
    aggressionIndex: 72,
    riskTolerance: 'Medium-High',
    knownDeceptions: [
      'Claims "no pit planned" within 3 laps of undercut window closing',
      'Instructs driver to push when actually managing to cover rival stop',
    ],
    historicalPatterns: [
      { scenario: 'Pits within 2 laps of undercut window', probability: 78, confidence: 'High', seasons: 3 },
      { scenario: '"Focus on the gap" pre-pit bluff', probability: 61, confidence: 'Medium', seasons: 3 },
      { scenario: 'Double stack attempt under SC', probability: 55, confidence: 'Medium', seasons: 2 },
      { scenario: 'Overcut gamble in wet conditions', probability: 70, confidence: 'High', seasons: 3 },
    ],
    doclingSource: 'race_transcripts_2022_2024.pdf · ferrari_strategy_analysis.pdf',
    ragConfidence: 0.89,
  },
  bonnington: {
    name: 'Peter Bonnington',
    team: 'Mercedes',
    role: 'Race Engineer',
    aggressionIndex: 65,
    riskTolerance: 'Calculated',
    knownDeceptions: [
      'Push instructions used to mask fuel saving phase',
      'Rarely broadcasts strategic intent — radio discipline is high',
    ],
    historicalPatterns: [
      { scenario: 'Fuel save masked as push instruction', probability: 58, confidence: 'Medium', seasons: 4 },
      { scenario: 'Late pit for fresh tyres on final stint', probability: 74, confidence: 'High', seasons: 5 },
      { scenario: 'DRS train exploitation undercut', probability: 69, confidence: 'Medium', seasons: 3 },
      { scenario: 'Safety car double stack', probability: 82, confidence: 'High', seasons: 5 },
    ],
    doclingSource: 'race_transcripts_2020_2024.pdf · mercedes_strategy_docs.pdf',
    ragConfidence: 0.91,
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const target = (searchParams.get('target') || 'lambiase').toLowerCase();

    // Simulate Docling RAG vector retrieval latency
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

    const profile = STRATEGIST_PROFILES[target] || STRATEGIST_PROFILES['lambiase'];

    return NextResponse.json({
      knowledgeSource: 'ibm-docling-faiss-vector-db',
      retrievalTimestamp: new Date().toISOString(),
      profile,
    });
  } catch {
    return NextResponse.json({ error: 'Docling retrieval failed' }, { status: 500 });
  }
}