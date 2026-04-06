export const STRIPE_PRODUCTS = {
  oneOff: {
    fullReport: "price_1TGoYgJRdCrAqoHOjNJUliF0",
    statement: "price_1TJ0daJRdCrAqoHOX0ayE1Pf",
    bundle: "price_1TGoXGJRdCrAqoHOiEnQeq52",
  },
  topUp: {
    small: "price_1TJ0egJRdCrAqoHOjyMUeDh8",
    medium: "price_1TJ0fMJRdCrAqoHOAdmXUCWS",
    large: "price_1TJ0fjJRdCrAqoHOiNeGyfSu",
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

export const CREDIT_COSTS = {
  report: 1,
  statement: 3,
  bundle: 3,
} as const;

export const TOPUP_CREDITS = {
  small: 5,
  medium: 15,
  large: 40,
} as const;

export const SUBSCRIPTION_CREDITS = {
  starter: 15,
  pro: 60,
  agency: 160,
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
