import { useState, useRef, useCallback } from "react"
import { PlusCircle } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { SearchBar } from "@/components/SearchBar"
import { Sidebar } from "@/components/Sidebar"
import { ResultCard } from "@/components/ResultCard"
import { WelcomeScreen } from "@/components/WelcomeScreen"
import { checkFSAEligibility } from "@/lib/anthropic"
import type { FSAResult } from "@/types/fsa"

const HISTORY_KEY = "fsacheck_history"
const RATE_LIMIT_KEY = "fsacheck_rate_limit"
const MAX_REQUESTS = 2

// Stable session ID for this browser tab — resets on page reload
const SESSION_ID = uuidv4()

function loadHistory(): FSAResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<Omit<FSAResult, "timestamp"> & { timestamp: string }>
    return parsed.map((item) => ({ ...item, timestamp: new Date(item.timestamp) }))
  } catch {
    return []
  }
}

function saveHistory(history: FSAResult[]) {
  const toSave = history.filter((h) => !h.isLoading && !h.isStreaming)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(toSave.slice(-50)))
}

// Client-side rate limit counter, mirroring the server's session-based limit.
// The server is authoritative; this just gives instant UI feedback.
function getRemainingQueries(): number {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY)
    if (!raw) return MAX_REQUESTS
    const { count, sessionId } = JSON.parse(raw) as { count: number; sessionId: string }
    // Reset if this is a new session
    if (sessionId !== SESSION_ID) return MAX_REQUESTS
    return Math.max(0, MAX_REQUESTS - count)
  } catch {
    return MAX_REQUESTS
  }
}

function incrementQueryCount() {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY)
    const existing = raw ? JSON.parse(raw) as { count: number; sessionId: string } : null
    const count = existing?.sessionId === SESSION_ID ? existing.count + 1 : 1
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ count, sessionId: SESSION_ID }))
  } catch {
    // ignore
  }
}

export default function App() {
  const [history, setHistory] = useState<FSAResult[]>(loadHistory)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [currentResult, setCurrentResult] = useState<FSAResult | null>(null)
  const [remaining, setRemaining] = useState(getRemainingQueries)
  const mainRef = useRef<HTMLDivElement>(null)

  const handleSearch = useCallback(
    async (query: string) => {
      if (isLoading || remaining <= 0) return

      const id = uuidv4()
      const newResult: FSAResult = {
        id,
        query,
        timestamp: new Date(),
        status: "unknown",
        explanation: "",
        caveats: [],
        hsaDiffers: false,
        isLoading: true,
        isStreaming: false,
      }

      setCurrentResult(newResult)
      setSelectedId(id)
      setIsLoading(true)
      incrementQueryCount()
      setRemaining(getRemainingQueries())

      setHistory((prev) => [...prev, newResult])
      mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })

      try {
        const result = await checkFSAEligibility(query, SESSION_ID, (partial) => {
          setCurrentResult((prev) => (prev ? { ...prev, ...partial } : prev))
        })

        const finalResult: FSAResult = {
          ...newResult,
          ...result,
          isLoading: false,
          isStreaming: false,
        }

        setCurrentResult(finalResult)
        setHistory((prev) => {
          const next = prev.map((h) => (h.id === id ? finalResult : h))
          saveHistory(next)
          return next
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        const errorResult: FSAResult = {
          ...newResult,
          status: "unknown",
          explanation: message,
          caveats: [],
          hsaDiffers: false,
          isLoading: false,
          isStreaming: false,
        }
        setCurrentResult(errorResult)
        setHistory((prev) => {
          const next = prev.map((h) => (h.id === id ? errorResult : h))
          saveHistory(next)
          return next
        })
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, remaining]
  )

  const handleSelectHistory = (result: FSAResult) => {
    setCurrentResult(result)
    setSelectedId(result.id)
  }

  const handleHome = () => {
    setCurrentResult(null)
    setSelectedId(undefined)
  }

  const handleClearHistory = () => {
    setHistory([])
    setCurrentResult(null)
    setSelectedId(undefined)
    localStorage.removeItem(HISTORY_KEY)
  }

  const rateLimitReached = remaining <= 0
  const showWelcome = !currentResult

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 shrink-0 flex-col border-r border-gray-800">
        <Sidebar
          history={history}
          onSelect={handleSelectHistory}
          onClear={handleClearHistory}
          onHome={handleHome}
          selectedId={selectedId}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-semibold text-gray-900">FSA Eligibility Checker</h1>
              <p className="text-xs text-gray-500">Powered by Claude AI</p>
            </div>
            {currentResult && (
              <button
                onClick={handleHome}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                New search
              </button>
            )}
          </div>

          {/* Remaining queries badge */}
          <div className="text-xs text-gray-400">
            {rateLimitReached ? (
              <span className="rounded-full bg-red-50 px-3 py-1 text-red-600 font-medium border border-red-100">
                Search limit reached
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-3 py-1 tabular-nums">
                {remaining} search{remaining !== 1 ? "es" : ""} remaining
              </span>
            )}
          </div>
        </header>

        {/* Search area */}
        <div className="border-b border-gray-200 bg-white px-6 py-4 shrink-0">
          <SearchBar
            onSearch={handleSearch}
            isLoading={isLoading}
            disabled={rateLimitReached}
            placeholder="e.g. 'Is sunscreen FSA eligible?' or 'Can I use FSA for therapy?'"
          />
          {rateLimitReached && (
            <p className="mt-2 text-xs text-red-500">
              You've used both searches for this session. Refresh the page to start a new session.
            </p>
          )}
        </div>

        {/* Results / Welcome */}
        <div ref={mainRef} className="flex-1 overflow-y-auto">
          {showWelcome ? (
            <WelcomeScreen onExampleClick={handleSearch} disabled={rateLimitReached} />
          ) : (
            <div className="mx-auto max-w-2xl px-6 py-6">
              {currentResult && <ResultCard result={currentResult} />}
              {history.filter((h) => h.id !== currentResult?.id && !h.isLoading).length > 0 && (
                <p className="mt-6 text-center text-xs text-gray-400">
                  ← Browse previous searches in the sidebar
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
