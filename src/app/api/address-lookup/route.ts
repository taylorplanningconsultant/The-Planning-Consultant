import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get("postcode")

  if (!postcode) {
    return NextResponse.json({ addresses: [] }, { status: 400 })
  }

  try {
    const clean = postcode.replace(/\s+/g, "").toUpperCase()
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${clean}/autocomplete`,
    )
    const data = await res.json()

    if (!data.result) {
      return NextResponse.json({ addresses: [] })
    }

    return NextResponse.json({
      addresses: data.result,
    })
  } catch (err) {
    console.error("address-lookup error:", err)
    return NextResponse.json({ addresses: [] })
  }
}
