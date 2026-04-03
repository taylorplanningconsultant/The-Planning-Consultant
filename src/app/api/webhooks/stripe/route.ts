import { stripe } from "@/lib/stripe/client";
import { planFromStripePriceId } from "@/lib/stripe/products";
import { createServiceClient } from "@/lib/supabase/server";
import type { TablesInsert, TablesUpdate } from "@/types/database";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

function mapSubscriptionStatus(
  status: Stripe.Subscription.Status,
): "active" | "cancelled" | "past_due" {
  if (status === "active" || status === "trialing") {
    return "active";
  }
  if (status === "canceled" || status === "unpaid") {
    return "cancelled";
  }
  if (status === "past_due") {
    return "past_due";
  }
  return "past_due";
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const reportId = session.metadata?.reportId?.trim();
    const customerEmail =
      session.customer_email ??
      session.customer_details?.email ??
      null;

    console.log("Webhook received:", {
      sessionId: session.id,
      reportId,
      customerEmail,
      metadata: session.metadata,
    });

    if (reportId) {
      const update: TablesUpdate<"reports"> = {
        report_type: "full",
        ...(customerEmail ? { email: customerEmail } : {}),
      };

      const { error } = await supabase
        .from("reports")
        .update(update)
        .eq("id", reportId);

      console.log("Update result:", { error, reportId });

      if (error) {
        console.error("checkout.session.completed reports update:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    } else {
      console.log("No reportId in metadata - skipping update");
    }
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;
    const status = mapSubscriptionStatus(subscription.status);
    const firstItem = subscription.items.data[0];
    const priceId = firstItem?.price.id;
    const planName = priceId ? planFromStripePriceId(priceId) : null;
    const periodEndUnix = firstItem?.current_period_end;
    const currentPeriodEnd =
      periodEndUnix != null
        ? new Date(periodEndUnix * 1000).toISOString()
        : null;

    if (!planName) {
      console.warn(
        "customer.subscription.updated: unknown price id, skipping plan",
        priceId,
      );
    }

    const baseUpdate: TablesUpdate<"subscriptions"> = {
      stripe_subscription_id: subscription.id,
      status,
      ...(planName ? { plan: planName } : {}),
      ...(currentPeriodEnd ? { current_period_end: currentPeriodEnd } : {}),
    };

    const { data: updatedRows, error: updateError } = await supabase
      .from("subscriptions")
      .update(baseUpdate)
      .eq("stripe_customer_id", customerId)
      .select("id");

    if (updateError) {
      console.error("customer.subscription.updated:", updateError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!updatedRows?.length && planName) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (profileError) {
        console.error("subscription.updated profile lookup:", profileError);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      if (profile) {
        const insert: TablesInsert<"subscriptions"> = {
          user_id: profile.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          plan: planName,
          status,
          ...(currentPeriodEnd ? { current_period_end: currentPeriodEnd } : {}),
        };

        const { error: upsertError } = await supabase
          .from("subscriptions")
          .upsert(insert, { onConflict: "user_id" });

        if (upsertError) {
          console.error("subscription.updated upsert:", upsertError);
          return NextResponse.json({ error: "Database error" }, { status: 500 });
        }
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    const { error: subUpdateError } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("stripe_customer_id", customerId);

    if (subUpdateError) {
      console.error("customer.subscription.deleted:", subUpdateError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const { data: sub, error: subSelectError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (subSelectError) {
      console.error("subscription.deleted select:", subSelectError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (sub?.user_id) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ subscription_tier: "free" })
        .eq("id", sub.user_id);

      if (profileError) {
        console.error("subscription.deleted profile:", profileError);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
