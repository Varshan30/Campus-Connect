// Groq Cloud AI Service for intelligent item matchmaking
// Uses Groq's ultra-fast LLM inference API for semantic understanding & contextual matching

const GROK_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Built-in API key from environment (baked into build) — AI verification is always active
const BUILT_IN_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

// Optional localStorage override for admin/dev use
const GROK_API_KEY_STORAGE = 'campus_connect_grok_api_key';

/**
 * Get the active Groq API key.
 * Priority: localStorage override > built-in env key
 */
export function getGrokApiKey(): string | null {
  const override = localStorage.getItem(GROK_API_KEY_STORAGE);
  if (override && override.length > 10) return override;
  if (BUILT_IN_API_KEY && BUILT_IN_API_KEY.length > 10) return BUILT_IN_API_KEY;
  return null;
}

export function setGrokApiKey(key: string): void {
  localStorage.setItem(GROK_API_KEY_STORAGE, key);
}

export function removeGrokApiKey(): void {
  localStorage.removeItem(GROK_API_KEY_STORAGE);
}

/**
 * Check if AI verification is available.
 * Returns true if either the built-in key or a user-provided key exists.
 */
export function isGrokConfigured(): boolean {
  return !!getGrokApiKey();
}

/**
 * Check if the built-in (default) key is being used vs a user override.
 */
export function isUsingBuiltInKey(): boolean {
  const override = localStorage.getItem(GROK_API_KEY_STORAGE);
  if (override && override.length > 10) return false;
  return !!BUILT_IN_API_KEY && BUILT_IN_API_KEY.length > 10;
}

// ------- Core Grok Chat Completion Call -------

interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokResponse {
  choices: {
    message: {
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function callGrok(
  messages: GrokMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json' | 'text';
  } = {}
): Promise<string> {
  const apiKey = getGrokApiKey();
  if (!apiKey) {
    throw new Error('Groq API key not configured');
  }

  const {
    model = 'llama-3.3-70b-versatile',
    temperature = 0.3,
    maxTokens = 1024,
    responseFormat = 'text',
  } = options;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };

  if (responseFormat === 'json') {
    body.response_format = { type: 'json_object' };
    // Groq requires the word "json" in messages when using json_object response format
    const hasJsonMention = messages.some(m => m.content.toLowerCase().includes('json'));
    if (!hasJsonMention) {
      messages = messages.map((m, i) =>
        i === 0 && m.role === 'system'
          ? { ...m, content: m.content + '\nRespond in JSON format.' }
          : m
      );
      body.messages = messages;
    }
  }

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API error:', response.status, errorText);
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data: GrokResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

// ------- AI Matching Functions -------

export interface AIMatchResult {
  matchScore: number; // 0-100
  confidence: string; // 'high' | 'medium' | 'low'
  semanticSimilarity: number; // 0-100
  reasoning: string;
  matchedAttributes: string[];
  suggestion: string;
}

export interface AIClaimVerification {
  verificationScore: number; // 0-100
  confidence: string;
  riskLevel: 'low' | 'medium' | 'high';
  reasoning: string;
  breakdown: {
    category: string;
    score: number;
    maxScore: number;
    aiInsight: string;
  }[];
  overallAssessment: string;
  redFlags: string[];
  positiveIndicators: string[];
}

/**
 * AI-powered semantic matching between a new item report and an existing item.
 * Uses Grok to understand context, synonyms, and implicit matches.
 */
export async function aiSemanticMatch(
  newItem: {
    name: string;
    category: string;
    location: string;
    description: string;
    type: 'lost' | 'found';
  },
  existingItem: {
    name: string;
    category: string;
    location: string;
    description: string;
  }
): Promise<AIMatchResult> {
  const systemPrompt = `You are an expert AI matchmaking engine for a campus lost-and-found system called Campus Connect. Your job is to intelligently match lost items with found items using semantic understanding.

You must analyze:
1. **Semantic similarity** - Do the names/descriptions refer to the same kind of item even if worded differently? (e.g., "laptop charger" ≈ "MacBook power adapter")
2. **Attribute matching** - Colors, brands, sizes, unique features, damage marks
3. **Location proximity** - Campus locations that are nearby or commonly confused
4. **Temporal context** - Items reported around similar times are more likely matches
5. **Category intelligence** - Same category items with different names could still match

Return ONLY valid JSON with this exact structure:
{
  "matchScore": <number 0-100>,
  "confidence": "<high|medium|low>",
  "semanticSimilarity": <number 0-100>,
  "reasoning": "<detailed explanation of why items may or may not match>",
  "matchedAttributes": ["<list of matching attributes found>"],
  "suggestion": "<actionable next step for the user>"
}`;

  const userPrompt = `Match these two items:

**New ${newItem.type.toUpperCase()} Item Report:**
- Name: ${newItem.name}
- Category: ${newItem.category}
- Location: ${newItem.location}
- Description: ${newItem.description}

**Existing Item in Database:**
- Name: ${existingItem.name}
- Category: ${existingItem.category}
- Location: ${existingItem.location}
- Description: ${existingItem.description}

Analyze semantic similarity, attribute overlaps, location proximity on a college campus, and give a match score 0-100.`;

  try {
    const result = await callGrok(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.2, maxTokens: 512, responseFormat: 'json' }
    );

    const parsed = JSON.parse(result) as AIMatchResult;
    return {
      matchScore: Math.min(100, Math.max(0, parsed.matchScore || 0)),
      confidence: parsed.confidence || 'low',
      semanticSimilarity: Math.min(100, Math.max(0, parsed.semanticSimilarity || 0)),
      reasoning: parsed.reasoning || 'No reasoning provided',
      matchedAttributes: parsed.matchedAttributes || [],
      suggestion: parsed.suggestion || 'Review this match manually',
    };
  } catch (error) {
    console.error('AI semantic match failed:', error);
    throw error;
  }
}

/**
 * AI-powered batch matching: finds best matches for a new item across all candidates.
 * More efficient than individual calls — sends all candidates in one prompt.
 */
export async function aiBatchMatch(
  newItem: {
    name: string;
    category: string;
    location: string;
    description: string;
    type: 'lost' | 'found';
  },
  candidates: {
    id: string;
    name: string;
    category: string;
    location: string;
    description: string;
  }[]
): Promise<{ id: string; score: number; reasoning: string; matchedAttributes: string[] }[]> {
  if (candidates.length === 0) return [];

  const systemPrompt = `You are an AI matchmaking engine for Campus Connect, a campus lost-and-found platform. You will receive a reported item and a list of candidate items. Score each candidate on how likely it is the SAME physical item.

Scoring criteria:
- **Name similarity** (0-25): Same item type? Synonyms? Abbreviations?
- **Description match** (0-30): Colors, brands, sizes, unique identifiers, damage
- **Location proximity** (0-20): Same building? Nearby? Items move on campus
- **Category fit** (0-15): Exact match or plausible cross-category
- **Contextual clues** (0-10): Any implicit evidence they're the same item

Return ONLY valid JSON array:
[
  {
    "id": "<candidate id>",
    "score": <number 0-100>,
    "reasoning": "<brief explanation>",
    "matchedAttributes": ["<matched feature 1>", "<matched feature 2>"]
  }
]

Sort by score descending. Only include candidates with score >= 25.`;

  const candidateList = candidates
    .map(
      (c, i) =>
        `  ${i + 1}. [ID: ${c.id}] "${c.name}" | Category: ${c.category} | Location: ${c.location} | Desc: ${c.description}`
    )
    .join('\n');

  const userPrompt = `**Reported ${newItem.type.toUpperCase()} item:**
- Name: ${newItem.name}
- Category: ${newItem.category}
- Location: ${newItem.location}
- Description: ${newItem.description}

**Candidate items to match against:**
${candidateList}

Score each candidate and return matches.`;

  try {
    const result = await callGrok(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.2, maxTokens: 1500, responseFormat: 'json' }
    );

    let parsed = JSON.parse(result);

    // Handle if Grok wraps in an object like { matches: [...] }
    if (!Array.isArray(parsed)) {
      parsed = parsed.matches || parsed.results || parsed.candidates || [];
    }

    return (parsed as { id: string; score: number; reasoning: string; matchedAttributes: string[] }[])
      .filter((m) => m.score >= 25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  } catch (error) {
    console.error('AI batch match failed:', error);
    throw error;
  }
}

/**
 * AI-powered claim verification: analyzes security answers, description,
 * and context to determine if a claim is legitimate.
 */
export async function aiVerifyClaim(
  item: {
    name: string;
    category: string;
    description: string;
    location: string;
    dateFound: string;
  },
  claim: {
    description: string;
    securityAnswers: Record<string, string>;
    securityQuestions: { id: string; question: string }[];
  }
): Promise<AIClaimVerification> {
  const systemPrompt = `You are an AI ownership verification engine for Campus Connect. You must analyze a claim against a found item and determine the likelihood the claimant is the true owner.

Evaluation criteria:
1. **Specificity of answers** - Vague answers vs. precise details
2. **Consistency** - Do all answers paint a coherent picture of the same item?
3. **Knowledge depth** - Does the claimant know details not visible in photos?
4. **Red flags** - Generic answers, contradictions, answers that don't match the item type
5. **Positive indicators** - Unique details, serial numbers, specific damage descriptions

Return ONLY valid JSON:
{
  "verificationScore": <number 0-100>,
  "confidence": "<high|medium|low>",
  "riskLevel": "<low|medium|high>",
  "reasoning": "<detailed analysis>",
  "breakdown": [
    {
      "category": "<aspect being evaluated>",
      "score": <number>,
      "maxScore": <max points>,
      "aiInsight": "<specific insight about this aspect>"
    }
  ],
  "overallAssessment": "<1-2 sentence summary>",
  "redFlags": ["<any concerns>"],
  "positiveIndicators": ["<evidence supporting genuine ownership>"]
}`;

  const qaList = claim.securityQuestions
    .map((q) => {
      const answer = claim.securityAnswers[q.id] || '(not answered)';
      return `  Q: ${q.question}\n  A: ${answer}`;
    })
    .join('\n\n');

  const userPrompt = `**Found Item:**
- Name: ${item.name}
- Category: ${item.category}
- Description: ${item.description}
- Location: ${item.location}
- Date Found: ${item.dateFound}

**Claimant's Identification Description:**
${claim.description || '(not provided)'}

**Security Question Answers:**
${qaList}

Analyze this claim and assess ownership likelihood.`;

  try {
    const result = await callGrok(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.2, maxTokens: 1200, responseFormat: 'json' }
    );

    const parsed = JSON.parse(result) as AIClaimVerification;
    return {
      verificationScore: Math.min(100, Math.max(0, parsed.verificationScore || 0)),
      confidence: parsed.confidence || 'low',
      riskLevel: parsed.riskLevel || 'high',
      reasoning: parsed.reasoning || 'Unable to fully assess',
      breakdown: parsed.breakdown || [],
      overallAssessment: parsed.overallAssessment || 'Manual review recommended',
      redFlags: parsed.redFlags || [],
      positiveIndicators: parsed.positiveIndicators || [],
    };
  } catch (error) {
    console.error('AI claim verification failed:', error);
    throw error;
  }
}

/**
 * AI-powered smart description enhancement.
 * Suggests better descriptions to improve match probability.
 */
export async function aiEnhanceDescription(
  name: string,
  category: string,
  description: string
): Promise<{ enhancedDescription: string; suggestedKeywords: string[]; tips: string[] }> {
  const systemPrompt = `You are a helpful assistant for Campus Connect. Given an item report, suggest an improved description and keywords that would maximize the chance of matching it with its counterpart (lost item matching found item or vice versa).

Return ONLY valid JSON:
{
  "enhancedDescription": "<improved description incorporating the original but adding clarity>",
  "suggestedKeywords": ["<keyword1>", "<keyword2>", ...],
  "tips": ["<tip for better reporting>", ...]
}`;

  const userPrompt = `Item: ${name}
Category: ${category}
Current Description: ${description || '(none provided)'}

Enhance this description and suggest keywords.`;

  try {
    const result = await callGrok(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.5, maxTokens: 512, responseFormat: 'json' }
    );

    return JSON.parse(result);
  } catch (error) {
    console.error('AI description enhancement failed:', error);
    return {
      enhancedDescription: description,
      suggestedKeywords: [],
      tips: ['Add color, brand, and unique features for better matching'],
    };
  }
}

/**
 * Test the Grok API connection with a simple ping.
 */
export async function testGrokConnection(): Promise<{ success: boolean; message: string; model?: string }> {
  try {
    const result = await callGrok(
      [
        { role: 'system', content: 'Respond with exactly: {"status":"ok","model":"groq"}' },
        { role: 'user', content: 'ping' },
      ],
      { maxTokens: 50, responseFormat: 'json' }
    );

    const parsed = JSON.parse(result);
    return { success: true, message: 'Groq AI is connected and ready!', model: parsed.model || 'groq' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
  }
}
