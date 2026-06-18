import { Activity, BarChart3, Stethoscope, AlertTriangle } from "lucide-react"
import type { StatsResponse } from "@/lib/api"

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
      <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-primary">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
    </div>
  )
}

export function TopBar({ stats }: { stats: StatsResponse | null }) {
  const total = stats?.total_sessions ?? 0
  const avg = stats?.avg_score != null ? Math.round(stats.avg_score) : 0
  const commonIssue = stats?.top_issues?.[0]?.type ?? "—"

  return (
    <header className="flex flex-col gap-4 border-b border-border bg-background/80 px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Stethoscope className="size-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-tight text-foreground">
            AI Diagnostic Tool
          </h1>
          <p className="text-xs text-muted-foreground">
            Prompt &amp; workflow quality analysis
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Stat
          icon={<Activity className="size-4" />}
          label="Sessions run"
          value={String(total)}
        />
        <Stat
          icon={<BarChart3 className="size-4" />}
          label="Average score"
          value={`${avg}/100`}
        />
        <Stat
          icon={<AlertTriangle className="size-4" />}
          label="Common issue"
          value={commonIssue}
        />
      </div>
    </header>
  )
}