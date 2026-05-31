const RATE_LIMIT_KEY = "fsacheck_rate_limit"
const MAX_QUERIES = 5
const WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

interface RateLimitState {
  count: number
  windowStart: number // epoch ms of first query in current window
}

function readState(): RateLimitState | null {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY)
    return raw ? (JSON.parse(raw) as RateLimitState) : null
  } catch {
    return null
  }
}

function writeState(state: RateLimitState) {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state))
  } catch {
    // ignore (private browsing storage quota)
  }
}

/** Returns the current rate-limit state, resetting if the 24-hour window has elapsed. */
function getActiveState(): RateLimitState {
  const now = Date.now()
  const stored = readState()
  if (!stored || now - stored.windowStart >= WINDOW_MS) {
    return { count: 0, windowStart: now }
  }
  return stored
}

export function getRemainingQueries(): number {
  return Math.max(0, MAX_QUERIES - getActiveState().count)
}

/**
 * Returns ms until the window resets, or 0 if not yet limited.
 * Useful for showing a countdown.
 */
export function getMsUntilReset(): number {
  const state = readState()
  if (!state) return 0
  const elapsed = Date.now() - state.windowStart
  return Math.max(0, WINDOW_MS - elapsed)
}

/**
 * Records a query. Call this immediately before firing the request so the
 * count is accurate even if the page reloads mid-request.
 */
export function recordQuery(): void {
  const state = getActiveState()
  writeState({ ...state, count: state.count + 1 })
}

export { MAX_QUERIES }
