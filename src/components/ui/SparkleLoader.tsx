"use client"

import { Sparkles } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

export type SparkleLoaderProps = {
  message?: string
  steps?: string[]
}

const DEFAULT_STEPS: string[] = [
  "Looking at constraints",
  "Getting an idea of the job",
  "Mapping the best approach",
  "Gathering relevant context",
  "Generating your report",
  "Refining the final answer",
]

export function SparkleLoader({ message, steps }: SparkleLoaderProps) {
  const stepsSignature = useMemo(() => {
    if (steps && steps.length > 0) return steps.join("\u0001")
    return "__default__"
  }, [steps])

  const stepsRef = useRef(steps)
  useEffect(() => {
    stepsRef.current = steps
  })

  const [visibleStep, setVisibleStep] = useState(
    () =>
      steps && steps.length > 0
        ? (steps[0] ?? "")
        : (DEFAULT_STEPS[0] ?? ""),
  )
  const [dotCount, setDotCount] = useState(1)
  const stepIndexRef = useRef(0)

  useEffect(() => {
    queueMicrotask(() => {
      const list =
        stepsRef.current && stepsRef.current.length > 0
          ? stepsRef.current
          : DEFAULT_STEPS
      stepIndexRef.current = 0
      setVisibleStep(list[0] ?? "")
    })
  }, [stepsSignature])

  useEffect(() => {
    const rotateInterval = window.setInterval(() => {
      const list =
        stepsRef.current && stepsRef.current.length > 0
          ? stepsRef.current
          : DEFAULT_STEPS
      if (list.length <= 1) return

      const currentIndex = stepIndexRef.current
      const nextIndex = Math.floor(Math.random() * list.length)
      const resolvedIndex =
        nextIndex === currentIndex
          ? (currentIndex + 1) % list.length
          : nextIndex

      stepIndexRef.current = resolvedIndex
      setVisibleStep(list[resolvedIndex] ?? "")
    }, 1800)

    return () => {
      window.clearInterval(rotateInterval)
    }
  }, [stepsSignature])

  useEffect(() => {
    const dotInterval = window.setInterval(() => {
      setDotCount((currentCount) => (currentCount % 3) + 1)
    }, 450)

    return () => window.clearInterval(dotInterval)
  }, [])

  const animatedDots = ".".repeat(dotCount)
  const ariaLabel = message ? `${message} ${visibleStep}` : visibleStep

  return (
    <div
      className="flex items-center gap-3 py-2"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <Sparkles
        className="h-5 w-5 flex-shrink-0 text-accent"
        style={{ animation: "gentle-pulse 2s ease-in-out infinite" }}
      />
      <div className="relative overflow-hidden">
        <p className="text-sm font-medium text-foreground">
          {visibleStep}
          <span className="text-muted-brand">{animatedDots}</span>
        </p>
        <div
          className="pointer-events-none absolute inset-y-0 w-1/3"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.65) 50%, transparent 100%)",
            animation: "sweep 1.6s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  )
}
