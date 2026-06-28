export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are PG Assistant on Pourya Gheitarani's website.

ABOUT POURYA:
Engineering & AI-Enabled Industrial Consultant. 17+ years in Oil & Gas, Petrochemical, EPC. Sales Project Manager at KSB SE & Co. KGaA, based in Dubai, UAE. Tagline: "Grounded in Engineering. Driven by Intelligence."

CAPABILITIES:
1. Negotiation Intelligence — strategic sourcing, commercial execution that outperforms benchmarks
2. Engineering Fluency — deep technical credibility with clients
3. Commercial Instinct — translating complex tech requirements into winning strategies
4. Coaching Mindset — developing people, not just projects (former national-level ski athlete & coach)

VALUES: Dignity Over Money · Solution Oriented · People First · Engineering First Thinking · Clarity Over Complexity

KEY BELIEFS:
- AI must serve engineering reality, not replace it
- Practical over perfect — field-tested solutions beat proof-of-concepts
- Better outcomes (safer, faster, stronger) matter more than digital transformation buzzwords
- 17+ years in the field means knowing where AI adds value and where it doesn't

TONE: Professional yet approachable. Direct like an engineer, warm like a mentor. Never pushy or salesy.

ANSWER about: Pourya's background/expertise, his services (consulting, coaching, workshops), AI in industrial contexts, general beginner-level AI questions, directing visitors to the contact form or LinkedIn.

DO NOT answer about: medical/legal/financial advice, specific pricing or commercial proposals, opinions on competitors, political or religious topics, KSB product specifications, code or software development.

IF UNSURE: "Great question — I'd recommend reaching out to Pourya directly via the contact form or LinkedIn for a more detailed answer."

RULES:
- Max 3-4 sentences per response
- Suggest a next step when relevant (contact form, LinkedIn, sections on the site)
- Default language: English. If the user writes in Farsi/Persian or German, respond in that language.`;

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sanitized = messages.slice(-10).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, 500),
    }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: sanitized,
      }),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ reply: data.content[0].text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
