export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return
  if (typeof (window as any).gtag === "undefined") return
  ;(window as any).gtag("event", eventName, params)
}

export function trackPurchase(value: number, currency = "GBP") {
  trackEvent("purchase", { value, currency })
}
