export const STRIPE_PRODUCTS = {
  oneOff: {
    fullReport: "price_1TJyRCJV85dwM5kFI3rrMoK8",
    statement: "price_1TJyR8JV85dwM5kFBFaFLhro",
    bundle: "price_1TJyRKJV85dwM5kFV5A0tEkj",
  },
  topUp: {
    small: "price_1TJyR3JV85dwM5kFuLsE2wc4",
    medium: "price_1TJyR0JV85dwM5kFSiHhpFMy",
    large: "price_1TJyR3JV85dwM5kFkA1JbJXJ",
  },
  subscriptions: {
    starterMonthly: "price_1TJyR4JV85dwM5kFnc69LYn9",
    starterAnnual: "price_1TJyR3JV85dwM5kF3XV7chxW",
    proMonthly: "price_1TJyR2JV85dwM5kFE1fS6u2b",
    proAnnual: "price_1TJyR3JV85dwM5kFyKmoamhR",
    agencyMonthly: "price_1TJyR2JV85dwM5kFAzgIpeSx",
    agencyAnnual: "price_1TJyR5JV85dwM5kFdBTobeQN",
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
