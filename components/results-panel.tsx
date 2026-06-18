"use client"

import { useState } from "react"
import { ChevronDown, ArrowRight, Wrench, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type DiagnosticSession,
  type Severity,
  scoreColor,
  severityColor,
} from "@/lib/diagnostic-data"

function SeverityTag({ severity }: { severity: Severity }) {
  const color = severityColor(severity)
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={{
        color,
        backgroundColor: `color-mix(in oklch, ${color} 16%, transparent)`,
      }}
    >
      {severity}
    </span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = scoreColor(score)
  return (
    <div
      className="flex size-24 shrink-0 flex-col items-center justify-center rounded-2xl border"
      style={{
        color,
        borderColor: `color-mix(in oklch, ${color} 40%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)`,
      }}
    >
      <span className="text-3xl font-bold tabular-nums">{score}</span>
      <span className="text-xs font-medium text-muted-foreground">/ 100</span>
    </div>
  )
}

function OutputBlock({
  title,
  text,
  tone,
}: {
  title: string
  text: string
  tone: "original" | "improved"
}) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <span
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          tone === "improved" ? "text-primary" : "text-muted-foreground",
        )}
      >
        {title}
      </span>
      <pre
        className={cn(
          "h-full whitespace-pre-wrap rounded-lg border p-3 font-mono text-sm text-foreground",
          tone === "improved"
            ? "border-primary/30 bg-primary/5"
            : "border-border bg-background",
        )}
      >
        {text}
      </pre>
    </div>
  )
}

export function ResultsPanel({ session }: { session: DiagnosticSession }) {
  const [showRewrite, setShowRewrite] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      {/* Score + summary */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <ScoreBadge score={session.score} />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              {session.label}
            </h2>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {session.mode === "prompt" ? "Prompt" : "n8n Workflow"}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {session.summary}
          </p>
        </div>
      </div>

      {/* Issues */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          Issues found ({session.issues.length})
        </h3>
        <div className="flex flex-col gap-3">
          {session.issues.map((issue) => (
            <div
              key={issue.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2">
                <SeverityTag severity={issue.severity} />
                <span className="text-sm font-medium text-foreground">
                  {issue.type}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {issue.explanation}
              </p>
              <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3">
                <Wrench className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-foreground">
                  <span className="font-medium">Fix: </span>
                  {issue.fix}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Before / after */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          Output comparison
        </h3>
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 lg:flex-row">
          <OutputBlock
            title="Original output"
            text={session.originalOutput}
            tone="original"
          />
          <div className="hidden items-center lg:flex">
            <ArrowRight className="size-5 text-muted-foreground" />
          </div>
          <OutputBlock
            title="Improved output"
            text={session.improvedOutput}
            tone="improved"
          />
        </div>
      </div>

      {/* Rewritten prompt (collapsible) */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <button
          type="button"
          onClick={() => setShowRewrite((v) => !v)}
          className="flex w-full items-center gap-2 px-5 py-4 text-left transition-colors hover:bg-accent"
        >
          <ClipboardCheck className="size-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Suggested rewritten prompt
          </span>
          <ChevronDown
            className={cn(
              "ml-auto size-4 text-muted-foreground transition-transform",
              showRewrite && "rotate-180",
            )}
          />
        </button>
        {showRewrite && (
          <div className="border-t border-border p-5">
            <pre className="whitespace-pre-wrap rounded-lg border border-primary/30 bg-primary/5 p-4 font-mono text-sm leading-relaxed text-foreground">
              {session.rewrittenPrompt}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
