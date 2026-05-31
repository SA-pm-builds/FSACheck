import { useState, type FormEvent } from "react"
import { Key, ExternalLink, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ApiKeyModalProps {
  onSave: (key: string) => void
}

export function ApiKeyModal({ onSave }: ApiKeyModalProps) {
  const [key, setKey] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = key.trim()
    if (!trimmed.startsWith("sk-ant-")) {
      setError("API key should start with 'sk-ant-'")
      return
    }
    onSave(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl">
        {/* Icon */}
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
          <Key className="h-6 w-6 text-white" />
        </div>

        {/* Heading */}
        <h2 className="mb-1 text-xl font-semibold text-gray-900">Connect your API key</h2>
        <p className="mb-6 text-sm text-gray-500 leading-relaxed">
          FSACheck uses Claude AI to analyze eligibility. Your key is stored locally in your browser and never sent to any server.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Anthropic API Key
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={key}
                onChange={(e) => { setKey(e.target.value); setError("") }}
                placeholder="sk-ant-api03-..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={!key.trim()}>
            Save & Start Checking
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-center gap-1.5">
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            Get an API key from Anthropic Console
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
