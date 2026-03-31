import type { LPAInfo } from "@/types/planning"

/** Live Planning Data entity endpoint (see planning.data.gov.uk/docs — `/api/entity.json` is not served). */
const PLANNING_ENTITY_JSON =
  "https://www.planning.data.gov.uk/entity.json"

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    })
  } finally {
    clearTimeout(t)
  }
}

export async function postcodeToLatLng(
  postcode: string,
): Promise<{ lat: number; lng: number } | null> {
  const clean = postcode.replace(/\s+/g, "")
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`, {
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      result?: { latitude?: number; longitude?: number }
    }
    if (!data.result) return null
    return {
      lat: data.result.latitude as number,
      lng: data.result.longitude as number,
    }
  } catch (e) {
    console.error("postcodeToLatLng: postcodes.io request failed", e)
    return null
  }
}

export async function getLpaFromPostcode(
  postcode: string,
): Promise<LPAInfo | null> {
  const coords = await postcodeToLatLng(postcode)
  if (!coords) return null

  const { lat, lng } = coords
  const url = `${PLANNING_ENTITY_JSON}?dataset=local-authority-district&entries=current&limit=1&longitude=${encodeURIComponent(String(lng))}&latitude=${encodeURIComponent(String(lat))}`

  try {
    const res = await fetchWithTimeout(url, 10_000)
    if (!res.ok) {
      console.error("getLpaFromPostcode: Planning Data HTTP", res.status)
      return null
    }
    const data = (await res.json()) as {
      entities?: Array<{ name?: string; reference?: string }>
    }
    const entity = data.entities?.[0]
    if (!entity) return null
    const lpaName =
      typeof entity.name === "string" && entity.name.length > 0
        ? entity.name
        : "Unknown LPA"
    const lpaCode =
      typeof entity.reference === "string" && entity.reference.length > 0
        ? entity.reference
        : ""
    if (!lpaCode) return null
    return { lpaName, lpaCode }
  } catch (e) {
    console.error("getLpaFromPostcode: Planning Data request failed", e)
    return null
  }
}
