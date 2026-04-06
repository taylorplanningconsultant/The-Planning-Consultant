import { addCredits } from "@/lib/credits";
import { SUBSCRIPTION_CREDITS } from "@/lib/stripe/products";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type SubscriptionPlanKey = keyof typeof SUBSCRIPTION_CREDITS;

function isSubscriptionPlanKey(plan: string): plan is SubscriptionPlanKey {
  return plan in SUBSCRIPTION_CREDITS;
}

/**
 * Monthly credit grant for annual subscribers only. Monthly plans are credited
 * on renewal via Stripe webhooks (e.g. customer.subscription.updated) to avoid
 * double-counting. Requires `subscriptions.billing_interval` = 'annual' (set
 * when syncing subscription rows from Stripe).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not set");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: annualSubs, error } = await supabase
    .from("subscriptions")
    .select("user_id, plan")
    .eq("status", "active")
    .eq("billing_interval", "annual");

  if (error) {
    console.error("monthly-credits subscriptions query:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const rows = annualSubs ?? [];
  let processed = 0;

  for (const sub of rows) {
    const userId = sub.user_id;
    if (!userId) continue;
    if (!isSubscriptionPlanKey(sub.plan)) {
      console.warn("monthly-credits: unknown plan, skipping", sub.plan);
      continue;
    }

    try {
      await addCredits(
        userId,
        SUBSCRIPTION_CREDITS[sub.plan],
        "subscription",
      );
      processed += 1;
    } catch (err) {
      console.error("monthly-credits addCredits:", { userId, err });
      return NextResponse.json(
        { error: "Credits error" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true, processed });
}
