import { postcodeToLatLng } from "@/lib/planning/lpa"
import type {
  ConstraintCategory,
  ConstraintResult,
  ConstraintStatus,
} from "@/types/planning"

/** Planning Data entity endpoint (see planning.data.gov.uk/docs). */
const PLANNING_ENTITY_JSON =
  "https://www.planning.data.gov.uk/entity.json"

const UNABLE_DETAIL =
  "Unable to retrieve data for this constraint. Please check with your local planning authority."

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

function hasPlanningEntity(json: unknown): boolean {
  if (!json || typeof json !== "object") return false
  const e = (json as { entities?: unknown }).entities
  return Array.isArray(e) && e.length > 0
}

async function checkPlanningDataset(
  lat: number,
  lng: number,
  dataset: string,
  category: ConstraintCategory,
  label: string,
  statusIfFound: ConstraintStatus,
  detailIfFound: string,
  detailIfNotFound: string,
): Promise<ConstraintResult> {
  const url = `${PLANNING_ENTITY_JSON}?dataset=${encodeURIComponent(dataset)}&entries=current&limit=1&longitude=${encodeURIComponent(String(lng))}&latitude=${encodeURIComponent(String(lat))}`
  try {
    const res = await fetchWithTimeout(url, 10_000)
    if (!res.ok) {
      console.error("checkPlanningDataset HTTP", dataset, res.status)
      return {
        category,
        label,
        status: "flag",
        detail: UNABLE_DETAIL,
      }
    }
    const json: unknown = await res.json()
    const found = hasPlanningEntity(json)
    return {
      category,
      label,
      status: found ? statusIfFound : "pass",
      detail: found ? detailIfFound : detailIfNotFound,
    }
  } catch (e) {
    console.error("checkPlanningDataset failed", dataset, e)
    return {
      category,
      label,
      status: "flag",
      detail: UNABLE_DETAIL,
    }
  }
}

function derivePermittedDevelopment(
  conservation: ConstraintResult,
  listed: ConstraintResult,
  article4: ConstraintResult,
): ConstraintResult {
  const cons = conservation.status
  const lst = listed.status
  const a4 = article4.status

  let status: ConstraintStatus
  if (cons === "fail" || lst === "fail") {
    status = "fail"
  } else if (cons === "flag" || a4 === "flag") {
    status = "flag"
  } else {
    status = "pass"
  }

  let detail: string
  if (status === "pass") {
    detail =
      "Full permitted development rights appear to apply. Many minor works may not need planning permission."
  } else if (status === "flag") {
    detail =
      "Permitted development rights may be restricted. Confirm with your LPA before starting any works."
  } else {
    detail =
      "Permitted development rights are restricted at this location due to designations identified above."
  }

  return {
    category: "permitted_development",
    label: "Permitted Development Rights",
    status,
    detail,
  }
}

export async function checkConstraints(
  postcode: string,
  _lpaCode: string,
): Promise<ConstraintResult[]> {
  void _lpaCode

  const coords = await postcodeToLatLng(postcode)
  if (!coords) {
    const mk = (
      category: ConstraintCategory,
      label: string,
    ): ConstraintResult => ({
      category,
      label,
      status: "flag",
      detail: UNABLE_DETAIL,
    })
    const conservation = mk("conservation_area", "Conservation Area")
    const listed = mk("listed_building", "Listed Building")
    const article4 = mk("article_4_direction", "Article 4 Direction")
    const tree = mk("tree_preservation_order", "Tree Preservation Order")
    const green = mk("green_belt", "Green Belt")
    const aonb = mk("aonb", "AONB / National Park")
    const flood = mk("flood_zone", "Flood Zone")
    const pd = derivePermittedDevelopment(conservation, listed, article4)
    return [conservation, listed, article4, tree, green, aonb, flood, pd]
  }

  const { lat, lng } = coords

  const settled = await Promise.allSettled([
    checkPlanningDataset(
      lat,
      lng,
      "conservation-area",
      "conservation_area",
      "Conservation Area",
      "fail",
      "This property is within a conservation area. Permitted development rights are restricted and many external alterations require planning permission.",
      "No conservation area designation found at this location.",
    ),
    checkPlanningDataset(
      lat,
      lng,
      "listed-building",
      "listed_building",
      "Listed Building",
      "fail",
      "This property is or is near a listed building. Listed building consent is required for works affecting character.",
      "No listed building designation found at this location.",
    ),
    checkPlanningDataset(
      lat,
      lng,
      "article-4-direction-area",
      "article_4_direction",
      "Article 4 Direction",
      "flag",
      "An Article 4 Direction applies here, removing some permitted development rights. Check with your LPA before starting works.",
      "No Article 4 Direction found at this location.",
    ),
    checkPlanningDataset(
      lat,
      lng,
      "tree-preservation-zone",
      "tree_preservation_order",
      "Tree Preservation Order",
      "flag",
      "A Tree Preservation Order (TPO) exists near this property. Written consent is required before pruning or felling any protected tree.",
      "No Tree Preservation Orders found at this location.",
    ),
    checkPlanningDataset(
      lat,
      lng,
      "green-belt",
      "green_belt",
      "Green Belt",
      "fail",
      "This property is within the Green Belt. Development is strictly controlled and only permitted in very special circumstances.",
      "This property is not within the Green Belt.",
    ),
    checkPlanningDataset(
      lat,
      lng,
      "area-of-outstanding-natural-beauty",
      "aonb",
      "AONB / National Park",
      "fail",
      "This property is within an Area of Outstanding Natural Beauty (AONB). Development must preserve the natural beauty of the landscape.",
      "This property is not within an AONB or National Park.",
    ),
    checkPlanningDataset(
      lat,
      lng,
      "flood-risk-zone",
      "flood_zone",
      "Flood Zone",
      "flag",
      "This property is within a flood risk zone. A flood risk assessment is likely to be required with any planning application. Consult the Environment Agency and your LPA before proceeding.",
      "No flood risk zone designation found at this location.",
    ),
  ])

  function unwrap(
    outcome: PromiseSettledResult<ConstraintResult>,
    fallback: ConstraintCategory,
    label: string,
  ): ConstraintResult {
    if (outcome.status === "fulfilled") return outcome.value
    console.error("checkConstraints settled rejection", fallback, outcome.reason)
    return {
      category: fallback,
      label,
      status: "flag",
      detail: UNABLE_DETAIL,
    }
  }

  const conservation = unwrap(
    settled[0],
    "conservation_area",
    "Conservation Area",
  )
  const listed = unwrap(settled[1], "listed_building", "Listed Building")
  const article4 = unwrap(
    settled[2],
    "article_4_direction",
    "Article 4 Direction",
  )
  const tree = unwrap(
    settled[3],
    "tree_preservation_order",
    "Tree Preservation Order",
  )
  const green = unwrap(settled[4], "green_belt", "Green Belt")
  const aonb = unwrap(settled[5], "aonb", "AONB / National Park")
  const flood = unwrap(settled[6], "flood_zone", "Flood Zone")

  const permitted = derivePermittedDevelopment(conservation, listed, article4)

  return [conservation, listed, article4, tree, green, aonb, flood, permitted]
}
