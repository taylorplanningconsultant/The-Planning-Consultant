"use server";

import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function openBillingPortalAction() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", session.user.id)
    .maybeSingle();

  const customerId = profile?.stripe_customer_id?.trim();
  if (!customerId) {
    redirect("/dashboard/billing");
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  if (!baseUrl) {
    redirect("/dashboard/billing");
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/dashboard/billing`,
  });

  if (!portalSession.url) {
    redirect("/dashboard/billing");
  }

  redirect(portalSession.url);
}
