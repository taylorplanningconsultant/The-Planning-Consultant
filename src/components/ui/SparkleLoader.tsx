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
  const liveSteps = useMemo(
    () => (steps && steps.length > 0 ? steps : DEFAULT_STEPS),
    [steps],
  )
  const [stepIndex, setStepIndex] = useState<number>(0)
  const [visibleStep, setVisibleStep] = useState<string>(liveSteps[0] ?? "")
  const [isStepVisible, setIsStepVisible] = useState<boolean>(true)
  const [dotCount, setDotCount] = useState<number>(1)
  const enterTimeoutRef = useRef<number | null>(null)
  const exitTimeoutRef = useRef<number | null>(null)
  const transitionDurationMs = 260

  useEffect(() => {
    setStepIndex(0)
    setVisibleStep(liveSteps[0] ?? "")
    setIsStepVisible(true)
  }, [liveSteps])

  useEffect(() => {
    if (liveSteps.length <= 1) return

    const rotateInterval = window.setInterval(() => {
      setIsStepVisible(false)

      exitTimeoutRef.current = window.setTimeout(() => {
        setStepIndex((currentIndex) => {
          const nextIndex = Math.floor(Math.random() * liveSteps.length)
          const resolvedIndex =
            nextIndex === currentIndex
              ? (currentIndex + 1) % liveSteps.length
              : nextIndex

          setVisibleStep(liveSteps[resolvedIndex] ?? "")
          return resolvedIndex
        })

        enterTimeoutRef.current = window.setTimeout(() => {
          setIsStepVisible(true)
        }, 10)
      }, transitionDurationMs)
    }, 1800)

    return () => {
      window.clearInterval(rotateInterval)
      if (exitTimeoutRef.current) window.clearTimeout(exitTimeoutRef.current)
      if (enterTimeoutRef.current) window.clearTimeout(enterTimeoutRef.current)
    }
  }, [liveSteps])

  useEffect(() => {
    const dotInterval = window.setInterval(() => {
      setDotCount((currentCount) => (currentCount % 3) + 1)
    }, 450)

    return () => window.clearInterval(dotInterval)
  }, [])

  const animatedDots = ".".repeat(dotCount)
  const title = message ?? "AI is thinking"

  return (
    <div className="flex items-center gap-3 py-2">
      <Sparkles
        className="w-5 h-5 text-accent flex-shrink-0"
        style={{ animation: "gentle-pulse 2s ease-in-out infinite" }}
      />
      <div className="relative overflow-hidden">
        <p className="text-sm font-medium text-foreground">
          {visibleStep}
          <span className="text-muted-brand">{animatedDots}</span>
        </p>
        <div
          className="absolute inset-y-0 w-1/3 pointer-events-none"
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
