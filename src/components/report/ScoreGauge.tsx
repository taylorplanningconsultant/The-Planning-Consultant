"use client"

import { Lock } from "lucide-react"
import { cn } from "@/utils/cn"
import { useSyncExternalStore } from "react"

export type ScoreGaugeProps = {
  score: number
  blurred?: boolean
}

const RADIUS = 50
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function ringColour(score: number): string {
  if (score >= 60) return "#18A056"
  if (score >= 40) return "#C49A3C"
  return "#D94040"
}

function ringTextClass(score: number): string {
  if (score >= 60) return "fill-accent"
  if (score >= 40) return "fill-amber"
  return "fill-danger"
}

function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

export function ScoreGauge({ score, blurred = false }: ScoreGaugeProps) {
  const clamped = Math.min(100, Math.max(0, score))
  const strokeColour = ringColour(clamped)
  const textFillClass = ringTextClass(clamped)

  const ready = useHydrated()

  const offset =
    CIRCUMFERENCE - (ready ? clamped / 100 : 0) * CIRCUMFERENCE

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div
          className={cn(
            "relative",
            blurred && "pointer-events-none select-none blur-md",
          )}
        >
          <svg
            width="160"
            height="160"
            viewBox="0 0 120 120"
            className="block"
            aria-hidden
          >
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              className="stroke-border"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={strokeColour}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
              className="transition-[stroke-dashoffset] duration-[800ms] ease-out"
            />
            <text
              x="60"
              y="60"
              textAnchor="middle"
              dominantBaseline="middle"
              className={cn(
                "font-sans text-[24px] font-extrabold",
                textFillClass,
              )}
            >
              {clamped}%
            </text>
          </svg>
        </div>
        {blurred ? (
          <div
            className="absolute inset-0 flex items-center justify-center text-3xl"
            aria-hidden
          >
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
        ) : null}
      </div>
      <p className="text-center text-sm font-medium text-muted-brand">
        Approval likelihood
      </p>
    </div>
  )
}
