export const STRIPE_PRODUCTS = {
  oneOff: {
    fullReport: "price_1TGoYgJRdCrAqoHOjNJUliF0",
    statement: "price_1TGjkkJRdCrAqoHOZv7JlNDy",
    bundle: "price_1TGoXGJRdCrAqoHOiEnQeq52",
  },
  subscriptions: {
    starterMonthly: "price_1TGoc1JRdCrAqoHOzg6lRTnD",
    starterAnnual: "price_1TGodCJRdCrAqoHO3aItddb1",
    proMonthly: "price_1TGodbJRdCrAqoHOa7GFwZZR",
    proAnnual: "price_1TGoe4JRdCrAqoHOx6TFgomS",
    agencyMonthly: "price_1TGoeSJRdCrAqoHOopnsrHwO",
    agencyAnnual: "price_1TGoetJRdCrAqoHOXGliTSr9",
  },
} as const;

/** Maps a Stripe price id to the `subscriptions.plan` enum. */
export function planFromStripePriceId(
  priceId: string,
): "starter" | "pro" | "agency" | null {
  const s = STRIPE_PRODUCTS.subscriptions;
  if (priceId === s.starterMonthly || priceId === s.starterAnnual) {
    return "starter";
  }
  if (priceId === s.proMonthly || priceId === s.proAnnual) {
    return "pro";
  }
  if (priceId === s.agencyMonthly || priceId === s.agencyAnnual) {
    return "agency";
  }
  return null;
}
