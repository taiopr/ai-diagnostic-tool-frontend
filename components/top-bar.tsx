import { Stethoscope } from "lucide-react"
import type { StatsResponse } from "@/lib/api"

export function TopBar({ stats }: { stats: StatsResponse | null }) {
  const total = stats?.total_sessions ?? 0

  return (
    <header className="flex items-center gap-4 border-b border-border bg-background/80 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Stethoscope className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-tight text-foreground">
            AI Diagnostic Tool
          </h1>
          <p className="text-xs text-muted-foreground">
            Paste a prompt → get a score, the specific problems, and a
            rewritten fix
          </p>
        </div>
      </div>
      {total > 0 && (
        <div className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {total.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">
            prompts diagnosed
          </span>
        </div>
      )}
    </header>
  )
}