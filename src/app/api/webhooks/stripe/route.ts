import { addCredits, getSubscriptionTier } from "@/lib/credits";
import { stripe } from "@/lib/stripe/client";
import {
  planFromStripePriceId,
  STRIPE_PRODUCTS,
  SUBSCRIPTION_CREDITS,
  TOPUP_CREDITS,
} from "@/lib/stripe/products";
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

    const lineItems = session.line_items?.data;
    const priceIdFromLineItems = lineItems?.[0]?.price;
    const priceId =
      (typeof priceIdFromLineItems === "object" && priceIdFromLineItems?.id
        ? priceIdFromLineItems.id
        : undefined) ??
      session.metadata?.priceId ??
      null;

    console.log("Webhook received:", {
      sessionId: session.id,
      reportId,
      customerEmail,
      priceId,
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

      if (reportId && customerEmail) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", customerEmail)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("reports")
            .update({ user_id: profile.id })
            .eq("id", reportId)
            .is("user_id", null);
        }
      }
    } else {
      console.log("No reportId in metadata - skipping report update");
    }

    if (priceId === STRIPE_PRODUCTS.oneOff.bundle && reportId) {
      const { error: bundleReportError } = await supabase
        .from("reports")
        .update({
          has_bundle: true,
          bundle_statement_used: false,
        })
        .eq("id", reportId);

      if (bundleReportError) {
        console.error("checkout.session.completed bundle report update:", bundleReportError);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }

    if (priceId) {
      const { oneOff, topUp } = STRIPE_PRODUCTS;

      const isOneOffPurchase =
        priceId === oneOff.fullReport ||
        priceId === oneOff.statement ||
        priceId === oneOff.bundle;

      if (isOneOffPurchase) {
        // Paid product unlock — credits not used for these checkouts.
      } else if (customerEmail) {
        const { data: topUpProfile, error: topUpProfileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", customerEmail)
          .maybeSingle();

        if (topUpProfileError) {
          console.error(
            "checkout.session.completed top-up profile lookup:",
            topUpProfileError,
          );
          return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        const topUpUserId = topUpProfile?.id;

        if (topUpUserId) {
          let topUpAmount: number | null = null;
          if (priceId === topUp.small) {
            topUpAmount = TOPUP_CREDITS.small;
          } else if (priceId === topUp.medium) {
            topUpAmount = TOPUP_CREDITS.medium;
          } else if (priceId === topUp.large) {
            topUpAmount = TOPUP_CREDITS.large;
          }

          if (topUpAmount !== null) {
            try {
              await addCredits(topUpUserId, topUpAmount, "topup");
            } catch (err) {
              console.error("checkout.session.completed addCredits topup:", err);
              return NextResponse.json(
                { error: "Credits error" },
                { status: 500 },
              );
            }
          }
        }
      }
    }
  }

  if (event.type === "customer.subscription.created") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;
    const priceId = subscription.items.data[0]?.price.id;
    const plan = planFromStripePriceId(priceId ?? "");

    console.log("subscription.created event:", {
      customerId,
      priceId,
      plan,
    });

    if (plan) {
      const credits = SUBSCRIPTION_CREDITS[plan];

      const customer = (await stripe.customers.retrieve(
        customerId,
      )) as Stripe.Customer;

      const customerEmail = customer.email;

      console.log("customer email:", customerEmail);

      const { data: profile } = customerEmail
        ? await supabase
            .from("profiles")
            .select("id")
            .eq("email", customerEmail)
            .maybeSingle()
        : { data: null };

      const userId = profile?.id;

      console.log("found userId:", userId);

      if (userId) {
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({
            subscription_tier: plan,
            stripe_customer_id: customerId,
          })
          .eq("id", userId);

        if (profileUpdateError) {
          console.error(
            "customer.subscription.created profile update:",
            profileUpdateError,
          );
          return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        try {
          await addCredits(userId, credits, "subscription");
        } catch (err) {
          console.error("customer.subscription.created addCredits:", err);
          return NextResponse.json({ error: "Credits error" }, { status: 500 });
        }

        const firstItem = subscription.items.data[0];
        const periodEndUnix = firstItem?.current_period_end;
        const currentPeriodEnd =
          periodEndUnix != null
            ? new Date(periodEndUnix * 1000).toISOString()
            : null;
        const status = mapSubscriptionStatus(subscription.status);

        const annualPriceIds = [
          STRIPE_PRODUCTS.subscriptions.starterAnnual,
          STRIPE_PRODUCTS.subscriptions.proAnnual,
          STRIPE_PRODUCTS.subscriptions.agencyAnnual,
        ];

        const billingInterval = annualPriceIds.includes(
          (priceId ?? "") as typeof annualPriceIds[number]
        )
          ? "annual"
          : "monthly";

        const insert: TablesInsert<"subscriptions"> = {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          plan,
          status,
          billing_interval: billingInterval,
          ...(currentPeriodEnd ? { current_period_end: currentPeriodEnd } : {}),
        };

        const { error: subInsertError } = await supabase
          .from("subscriptions")
          .insert(insert);

        if (subInsertError) {
          console.error(
            "customer.subscription.created subscriptions insert:",
            subInsertError,
          );
          return NextResponse.json({ error: "Database error" }, { status: 500 });
        }
      }
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

    const { data: tierProfile, error: tierProfileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (tierProfileError) {
      console.error("subscription.updated tier profile lookup:", tierProfileError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const userIdForSubscription = tierProfile?.id;
    const isStripeSubscriptionActive =
      subscription.status === "active" || subscription.status === "trialing";
    const prevAttrs = event.data.previous_attributes as
      | Record<string, unknown>
      | undefined;

    const shouldGrantSubscriptionCredits =
      prevAttrs !== undefined &&
      prevAttrs !== null &&
      (prevAttrs.status !== undefined ||
        prevAttrs.items !== undefined ||
        prevAttrs.current_period_end !== undefined);

    if (
      userIdForSubscription &&
      planName &&
      isStripeSubscriptionActive
    ) {
      const oldTier = shouldGrantSubscriptionCredits
        ? await getSubscriptionTier(userIdForSubscription)
        : undefined;

      const { error: tierUpdateError } = await supabase
        .from("profiles")
        .update({ subscription_tier: planName })
        .eq("id", userIdForSubscription);

      if (tierUpdateError) {
        console.error("subscription.updated subscription_tier:", tierUpdateError);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      if (shouldGrantSubscriptionCredits) {
        try {
          await addCredits(
            userIdForSubscription,
            SUBSCRIPTION_CREDITS[planName],
            "subscription",
          );
        } catch (err) {
          console.error("subscription.updated addCredits:", err);
          return NextResponse.json({ error: "Credits error" }, { status: 500 });
        }

        console.log("subscription.updated credits", {
          userId: userIdForSubscription,
          oldTier,
          newTier: planName,
        });
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
