import { useState, useRef, useEffect, useCallback } from "react"
import { Settings, Key, PlusCircle } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { SearchBar } from "@/components/SearchBar"
import { Sidebar } from "@/components/Sidebar"
import { ResultCard } from "@/components/ResultCard"
import { WelcomeScreen } from "@/components/WelcomeScreen"
import { ApiKeyModal } from "@/components/ApiKeyModal"
import { checkFSAEligibility } from "@/lib/anthropic"
import type { FSAResult } from "@/types/fsa"

const STORAGE_KEY = "fsacheck_api_key"
const HISTORY_KEY = "fsacheck_history"

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
  // Only save completed results (not loading ones)
  const toSave = history.filter((h) => !h.isLoading && !h.isStreaming)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(toSave.slice(-50)))
}

export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? "")
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [history, setHistory] = useState<FSAResult[]>(loadHistory)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [currentResult, setCurrentResult] = useState<FSAResult | null>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  const needsApiKey = !apiKey

  const handleSaveApiKey = (key: string) => {
    setApiKey(key)
    localStorage.setItem(STORAGE_KEY, key)
    setShowApiKeyModal(false)
  }

  const handleSearch = useCallback(
    async (query: string) => {
      if (!apiKey || isLoading) return

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

      // Add to history immediately as loading
      setHistory((prev) => {
        const next = [...prev, newResult]
        return next
      })

      // Scroll to top of main area
      mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })

      try {
        const result = await checkFSAEligibility(query, apiKey, (partial) => {
          setCurrentResult((prev) =>
            prev ? { ...prev, ...partial } : prev
          )
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
        const errorResult: FSAResult = {
          ...newResult,
          status: "unknown",
          explanation:
            err instanceof Error && err.message.includes("401")
              ? "Invalid API key. Please check your Anthropic API key and try again."
              : "Something went wrong. Please try again.",
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
    [apiKey, isLoading]
  )

  const handleExampleClick = (query: string) => {
    if (!apiKey) {
      setShowApiKeyModal(true)
      return
    }
    handleSearch(query)
  }

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

  // Auto-show API key modal if no key
  useEffect(() => {
    if (!apiKey) setShowApiKeyModal(true)
  }, [apiKey])

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
          <div className="flex items-center gap-2">
            {apiKey && (
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <Key className="h-3 w-3" />
                API Key
              </button>
            )}
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Search area */}
        <div className="border-b border-gray-200 bg-white px-6 py-4 shrink-0">
          <SearchBar
            onSearch={apiKey ? handleSearch : () => setShowApiKeyModal(true)}
            isLoading={isLoading}
            placeholder="e.g. 'Is sunscreen FSA eligible?' or 'Can I use FSA for therapy?'"
          />
        </div>

        {/* Results / Welcome */}
        <div ref={mainRef} className="flex-1 overflow-y-auto">
          {showWelcome ? (
            <WelcomeScreen onExampleClick={handleExampleClick} />
          ) : (
            <div className="mx-auto max-w-2xl px-6 py-6">
              {currentResult && <ResultCard result={currentResult} />}

              {/* Previous results hint */}
              {history.filter((h) => h.id !== currentResult?.id && !h.isLoading).length > 0 && (
                <p className="mt-6 text-center text-xs text-gray-400">
                  ← Browse previous searches in the sidebar
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* API Key Modal */}
      {(showApiKeyModal || needsApiKey) && (
        <ApiKeyModal onSave={handleSaveApiKey} />
      )}
    </div>
  )
}
