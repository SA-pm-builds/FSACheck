import type { EligibilityStatus, FSAResult } from "@/types/fsa"

export const MAX_QUERY_LENGTH = 500

export async function checkFSAEligibility(
  query: string,
  sessionId: string,
  onUpdate: (partial: Partial<FSAResult>) => void
): Promise<Partial<FSAResult>> {
  const response = await fetch("/api/check-eligibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, sessionId }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Request failed (${response.status})`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error("No response body")

  const decoder = new TextDecoder()
  let fullText = ""
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const payload = line.slice(6).trim()

      if (payload === "[DONE]") break

      try {
        const parsed = JSON.parse(payload) as { text?: string; error?: string }
        if (parsed.error) throw new Error(parsed.error)
        if (parsed.text) {
          fullText += parsed.text
          onUpdate({ isStreaming: true })
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue // incomplete chunk
        throw e
      }
    }
  }

  try {
    const jsonMatch = fullText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")

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
      caveats: parsed.caveats ?? [],
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
