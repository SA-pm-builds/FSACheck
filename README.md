# FSACheck

AI-powered FSA/HSA eligibility lookup. Ask anything in plain English — get instant answers based on IRS Publication 502.

![FSACheck screenshot](https://github.com/SA-pm-builds/FSACheck/assets/placeholder/screenshot.png)

## Features

- **Instant answers** — Ask "Is sunscreen FSA eligible?" and get a clear yes/no/conditional response
- **Plain English explanations** — No jargon, just the reason why something is or isn't covered
- **Caveats surfaced** — Prescription requirements, quantity limits, and other conditions called out explicitly
- **HSA differences** — Flags when HSA rules differ from FSA rules
- **Search history** — Previous lookups saved locally and browsable in the sidebar
- **Streaming responses** — Results appear as Claude thinks, no waiting for the full response

## Tech stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) primitives (Radix UI)
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) — `claude-opus-4-8`

## Getting started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/settings/keys)

### Run locally

```bash
git clone https://github.com/SA-pm-builds/FSACheck.git
cd FSACheck
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), enter your Anthropic API key when prompted, and start searching.

Your API key is stored in `localStorage` — it never leaves your browser.

## How it works

Each query is sent to `claude-opus-4-8` with a structured prompt that extracts:

| Field | Description |
|---|---|
| `status` | `eligible`, `not_eligible`, or `conditional` |
| `explanation` | 2–3 sentence plain English reason |
| `caveats` | Conditions, exceptions, or requirements |
| `hsaDiffers` | Whether HSA rules differ from FSA |
| `hsaNote` | Explanation of the HSA difference if applicable |

Responses stream in real time and results are cached in `localStorage` across sessions.

## Disclaimer

FSACheck is for informational purposes only. It is not financial, tax, or medical advice. FSA/HSA rules change — always verify eligibility with your plan administrator before making purchases.
