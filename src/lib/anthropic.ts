import Anthropic from "@anthropic-ai/sdk"
import type { EligibilityStatus, FSAResult } from "@/types/fsa"

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

export async function checkFSAEligibility(
  query: string,
  apiKey: string,
  onUpdate: (partial: Partial<FSAResult>) => void
): Promise<Partial<FSAResult>> {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

  let fullText = ""

  const stream = await client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Is this FSA eligible? "${query}"`,
      },
    ],
  })

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fullText += event.delta.text
      onUpdate({ isStreaming: true })
    }
  }

  try {
    // Extract JSON from the response (handle potential markdown code blocks)
    const jsonMatch = fullText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found in response")

    const parsed = JSON.parse(jsonMatch[0]) as {
      status: EligibilityStatus
      explanation: string
      caveats: string[]
      hsaDiffers: boolean
      hsaNote?: string
    }

    return {
      status: parsed.status,
      explanation: parsed.explanation,
      caveats: parsed.caveats || [],
      hsaDiffers: parsed.hsaDiffers,
      hsaNote: parsed.hsaNote,
      isStreaming: false,
    }
  } catch {
    return {
      status: "unknown",
      explanation: "Unable to determine eligibility. Please try rephrasing your question.",
      caveats: [],
      hsaDiffers: false,
      isStreaming: false,
    }
  }
}
