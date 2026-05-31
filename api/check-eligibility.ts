import type { VercelRequest, VercelResponse } from "@vercel/node"
import Anthropic from "@anthropic-ai/sdk"

const MAX_QUERY_LENGTH = 500
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS_PER_WINDOW = 2

const SYSTEM_PROMPT = `You are an FSA (Flexible Spending Account) and HSA (Health Savings Account) eligibility expert.
When users ask about whether something is FSA or HSA eligible, you provide accurate, helpful guidance based on IRS Publication 502 and current FSA/HSA rules.

You must respond with ONLY valid JSON in this exact format:
{
  "status": "eligible" | "not_eligible" | "conditional",
  "explanation": "A clear, plain English explanation of why this item is or isn't eligible (2-3 sentences)",
  "caveats": ["caveat 1", "caveat 2"],
  "hsaDiffers": true | false,
  "hsaNote": "If HSA rules differ, explain how here. Otherwise omit this field."
}

Rules:
- "eligible": Clearly FSA eligible under IRS rules
- "not_eligible": Clearly NOT eligible (general wellness, cosmetic, etc.)
- "conditional": Eligible only with specific conditions (prescription required, medical necessity letter, etc.)
- "caveats": Array of important conditions, exceptions, or notes (can be empty array)
- "hsaDiffers": true only if HSA eligibility meaningfully differs from FSA eligibility
- Keep explanations concise and practical, avoid jargon
- Be accurate — this is financial/medical guidance people rely on`

// In-memory rate limit store keyed by session ID.
// Resets whenever the serverless function cold-starts, which is fine for a
// best-effort limit. A Redis/KV store would be needed for strict enforcement.
const rateLimitStore = new Map<string, { count: number; windowStart: number }>()

function checkRateLimit(sessionId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(sessionId)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(sessionId, { count: 1, windowStart: now })
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 }
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 }
  }

  entry.count += 1
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - entry.count }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  // --- Input validation ---
  const { query, sessionId } = req.body as { query?: unknown; sessionId?: unknown }

  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "query is required" })
  }

  if (query.trim().length > MAX_QUERY_LENGTH) {
    return res.status(400).json({
      error: `Query must be ${MAX_QUERY_LENGTH} characters or fewer`,
    })
  }

  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return res.status(400).json({ error: "sessionId is required" })
  }

  // --- Rate limiting ---
  const { allowed, remaining } = checkRateLimit(sessionId.trim())
  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW)
  res.setHeader("X-RateLimit-Remaining", remaining)

  if (!allowed) {
    return res.status(429).json({
      error: "You've reached the limit of 2 searches per session. Please refresh to start a new session.",
    })
  }

  // --- Stream SSE back to the client ---
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: "Server configuration error" })
  }

  const client = new Anthropic({ apiKey })

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  try {
    const stream = await client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Is this FSA eligible? "${query.trim()}"` }],
    })

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
      }
    }

    res.write("data: [DONE]\n\n")
    res.end()
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    res.end()
  }
}
