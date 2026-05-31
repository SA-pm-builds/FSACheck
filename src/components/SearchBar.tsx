import { useState, useRef, type FormEvent, type KeyboardEvent } from "react"
import { Search, ArrowRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading: boolean
  placeholder?: string
}

export function SearchBar({ onSearch, isLoading, placeholder }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed && !isLoading) {
      onSearch(trimmed)
      setQuery("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div
        className={cn(
          "group relative flex items-center rounded-2xl border bg-white shadow-sm transition-all duration-200",
          "border-gray-200 hover:border-gray-300",
          "focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus-within:shadow-md",
          isLoading && "opacity-75"
        )}
      >
        <div className="flex items-center pl-5 pr-3">
          <Search className="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-blue-500" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Ask anything about FSA eligibility..."}
          disabled={isLoading}
          className={cn(
            "flex-1 bg-transparent py-4 pr-2 text-base text-gray-900 placeholder-gray-400",
            "focus:outline-none disabled:cursor-not-allowed"
          )}
          autoFocus
        />

        <div className="pr-3">
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
              query.trim() && !isLoading
                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
