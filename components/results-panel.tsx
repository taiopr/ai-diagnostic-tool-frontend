"use client"

import { useState } from "react"
import {
  ChevronDown,
  ArrowRight,
  Wrench,
  ClipboardCheck,
  GitCompare,
  ChevronUp,
  Copy,
  Check,
  Play,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type DiagnosticSession,
  type DiagnosticIssue,
  type Severity,
  scoreColor,
  severityColor,
} from "@/lib/diagnostic-data"
import type { DiagnosticMode } from "@/components/diagnostic-form"

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function scoreLabel(score: number): string {
  if (score < 40) return "Critical"
  if (score < 70) return "Fair"
  if (score < 85) return "Good"
  return "Great"
}

function ScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score)
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - score / 100)

  return (
    <div className="relative flex shrink-0 flex-col items-center justify-center">
      {/* 68px on mobile, 84px on sm+ */}
      <svg width="68" height="68" viewBox="0 0 84 84"
        className="-rotate-90 sm:!w-[84px] sm:!h-[84px]">
        <circle cx="42" cy="42" r={radius} fill="none" stroke="currentColor"
          strokeWidth="7" className="text-border" />
        <circle cx="42" cy="42" r={radius} fill="none" stroke={color}
          strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold tabular-nums leading-none sm:text-xl" style={{ color }}>
          {score}
        </span>
        <span className="text-[8px] text-muted-foreground sm:text-[9px]">/100</span>
        <span className="mt-0.5 text-[8px] font-semibold leading-none sm:text-[9px]" style={{ color }}>
          {scoreLabel(score)}
        </span>
      </div>
    </div>
  )
}

function SeverityTag({ severity }: { severity: Severity }) {
  const color = severityColor(severity)
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={{ color, backgroundColor: `color-mix(in oklch, ${color} 16%, transparent)` }}
    >
      {severity}
    </span>
  )
}

function OutputBlock({ title, text, tone }: {
  title: string; text: string; tone: "original" | "improved"
}) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <span className={cn("text-xs font-semibold uppercase tracking-wide",
        tone === "improved" ? "text-primary" : "text-muted-foreground")}>
        {title}
      </span>
      <pre className={cn("h-full whitespace-pre-wrap rounded-lg border p-3 font-mono text-sm text-foreground",
        tone === "improved" ? "border-primary/30 bg-primary/5" : "border-border bg-background")}>
        {text}
      </pre>
    </div>
  )
}

function IssueCard({ issue }: { issue: DiagnosticIssue }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button type="button" onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-accent">
        <SeverityTag severity={issue.severity} />
        <span className="text-sm font-medium text-foreground">{formatLabel(issue.type)}</span>
        <ChevronDown className={cn("ml-auto size-4 shrink-0 text-muted-foreground transition-transform",
          expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="flex flex-col gap-2 border-t border-border px-4 py-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{issue.explanation}</p>
          <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3">
            <Wrench className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-foreground">
              <span className="font-medium">Fix: </span>{issue.fix}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export function ResultsPanel({
  session,
  onRunWithFix,
}: {
  session: DiagnosticSession
  onRunWithFix: (rewrittenPrompt: string, testInput: string, mode: DiagnosticMode) => void
}) {
  const [rewriteExpanded, setRewriteExpanded] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [showIssues, setShowIssues] = useState(false)
  const [copied, setCopied] = useState(false)
  const [summaryExpanded, setSummaryExpanded] = useState(false)

  const color = scoreColor(session.score)
  const summaryIsLong = session.summary && session.summary.length > 120

  function handleCopy() {
    navigator.clipboard.writeText(session.rewrittenPrompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="flex flex-col gap-4">

      {/* 1. VERDICT */}
      <div
        className="flex items-start gap-4 rounded-xl border p-4"
        style={{
          borderColor: `color-mix(in oklch, ${color} 30%, transparent)`,
          backgroundColor: `color-mix(in oklch, ${color} 8%, transparent)`,
        }}
      >
        <ScoreGauge score={session.score} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2
              className="min-w-0 truncate text-sm font-semibold text-foreground"
              title={session.label}
            >
              {session.label}
            </h2>
            <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {session.mode === "prompt" ? "Prompt" : "n8n Workflow"}
            </span>
          </div>
          <p className={cn(
            "text-sm leading-relaxed text-muted-foreground",
            !summaryExpanded && "line-clamp-2",
          )}>
            {session.summary}
          </p>
          {summaryIsLong && (
            <button
              type="button"
              onClick={() => setSummaryExpanded((v) => !v)}
              className="self-start text-xs font-medium text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {summaryExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      </div>

      {/* 2. SUGGESTED FIX */}
      <div className="rounded-xl border border-primary/40">
        <div className="sticky top-0 z-10 flex items-center gap-2 rounded-t-xl border-b border-primary/20 bg-primary/5 px-4 py-3">
          <ClipboardCheck className="size-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Suggested fix</span>
          <button type="button" onClick={handleCopy}
            className={cn(
              "ml-auto flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
              copied
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20",
            )}>
            {copied
              ? <><Check className="size-3" />Copied!</>
              : <><Copy className="size-3" />Copy prompt</>}
          </button>
        </div>
        <div className="rounded-b-xl bg-primary/5 p-4">
          {/* Outer container — fixed boundary, copy icon pinned here */}
          <div className="relative rounded-lg border border-primary/30 bg-background">
            {/* Inner container — scrolls when expanded */}
            <div className={cn(
              "overflow-hidden transition-all",
              rewriteExpanded ? "max-h-72 overflow-y-auto" : "max-h-24",
            )}>
              <pre className="whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed text-foreground">
                {session.rewrittenPrompt}
              </pre>
            </div>
            {/* Copy icon — pinned in outer container, never scrolls away */}
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "absolute right-2 top-2 z-10 rounded-md border p-1.5 backdrop-blur-sm transition-all",
                copied
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border bg-background/80 text-muted-foreground hover:border-primary/30 hover:text-primary",
              )}
              title="Copy prompt"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
            {/* Gradient fade — only when collapsed */}
            {!rewriteExpanded && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 rounded-b-lg bg-gradient-to-t from-background to-transparent" />
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setRewriteExpanded((v) => !v)}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-primary/20 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10">
              {rewriteExpanded
                ? <><ChevronUp className="size-3" />Collapse</>
                : <><ChevronDown className="size-3" />Show full prompt</>}
            </button>
            <button
              type="button"
              onClick={() => onRunWithFix(session.rewrittenPrompt, session.testInput, session.mode)}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Play className="size-3" />
              Run with fix
            </button>
          </div>
        </div>
      </div>

      {/* 3. OUTPUT COMPARISON */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <button type="button" onClick={() => setShowComparison((v) => !v)}
          className="flex w-full items-center gap-2 px-5 py-3 text-left transition-colors hover:bg-accent">
          <GitCompare className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Output comparison</span>
          <span className="ml-auto mr-2 text-xs text-muted-foreground">original → improved</span>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform",
            showComparison && "rotate-180")} />
        </button>
        {showComparison && (
          <div className="flex flex-col gap-4 border-t border-border p-4 lg:flex-row">
            <OutputBlock title="Original output" text={session.originalOutput} tone="original" />
            <div className="hidden items-center lg:flex">
              <ArrowRight className="size-5 text-muted-foreground" />
            </div>
            <OutputBlock title="Improved output" text={session.improvedOutput} tone="improved" />
          </div>
        )}
      </div>

      {/* 4. ISSUES */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <button type="button" onClick={() => setShowIssues((v) => !v)}
          className="flex w-full items-center gap-2 px-5 py-3 text-left transition-colors hover:bg-accent">
          <span className="text-sm font-semibold text-foreground">Why — issues found</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {session.issues.length}
          </span>
          <ChevronDown className={cn("ml-auto size-4 text-muted-foreground transition-transform",
            showIssues && "rotate-180")} />
        </button>
        {showIssues && (
          <div className="flex flex-col gap-2 border-t border-border p-3">
            {session.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}