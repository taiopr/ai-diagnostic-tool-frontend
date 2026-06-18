"use client"

import { useState } from "react"
import { Play, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type DiagnosticMode = "prompt" | "n8n"

const DEMO_EXAMPLES: {
  label: string
  prompt: string
  testInput: string
  mode: DiagnosticMode
}[] = [
    {
      label: "Vague customer support prompt",
      prompt: "You are a helpful assistant. Help the user.",
      testInput: "My order hasn't arrived and it's been 3 weeks.",
      mode: "prompt",
    },
    {
      label: "n8n workflow with no error handling",
      prompt:
        '{"nodes": [{"name": "AI Agent", "type": "@n8n/n8n-nodes-langchain.agent", "parameters": {"prompt": "Process this: {{ $json.input }}"}}]}',
      testInput: "Customer complaint about late delivery",
      mode: "n8n",
    },
    {
      label: "Well-structured prompt (high score)",
      prompt: `You are a sentiment analysis assistant. Classify the sentiment of the input text.
 
Return only valid JSON: {"sentiment": "positive"|"negative"|"neutral", "confidence": 0.0-1.0, "reasoning": "one sentence"}
 
If the text is ambiguous, classify as "neutral" with confidence below 0.5.`,
      testInput: "The product arrived late but the quality exceeded my expectations.",
      mode: "prompt",
    },
  ]

export function DiagnosticForm({
  onRun,
  isRunning,
}: {
  onRun: (data: {
    prompt: string
    testInput: string
    mode: DiagnosticMode
    label: string
  }) => void
  isRunning: boolean
}) {
  const [prompt, setPrompt] = useState("")
  const [testInput, setTestInput] = useState("")
  const [mode, setMode] = useState<DiagnosticMode>("prompt")
  const [label, setLabel] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onRun({ prompt, testInput, mode, label })
  }

  function loadDemo(example: (typeof DEMO_EXAMPLES)[number]) {
    setPrompt(example.prompt)
    setTestInput(example.testInput)
    setMode(example.mode)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">
          Try an example
        </span>
        <div className="flex flex-wrap gap-2">
          {DEMO_EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => loadDemo(example)}
              className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="prompt"
          className="text-sm font-medium text-foreground"
        >
          Prompt to diagnose
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          placeholder="Paste the prompt or workflow you want to analyze..."
          className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="test-input"
          className="text-sm font-medium text-foreground"
        >
          Test input
        </label>
        <textarea
          id="test-input"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          rows={3}
          placeholder="Sample input to run the prompt against..."
          className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Type</span>
          <div className="inline-flex rounded-lg border border-border bg-secondary p-1">
            {(["prompt", "n8n"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "prompt" ? "Prompt" : "n8n Workflow"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <label
            htmlFor="label"
            className="text-sm font-medium text-foreground"
          >
            Session label{" "}
            <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Support reply generator"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isRunning || prompt.trim().length === 0}
        className="w-full sm:w-auto sm:self-end"
      >
        {isRunning ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play className="size-4" />
            Run Diagnostic
          </>
        )}
      </Button>
    </form>
  )
}