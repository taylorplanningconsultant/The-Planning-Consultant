import { createServiceClient } from "@/lib/supabase/server";
import { CREDIT_COSTS } from "@/lib/stripe/products";

type CreditSpendType = "report" | "statement" | "bundle";

type ProfileCreditsRow = {
  credits_balance: number | null;
};

type ProfileTierRow = {
  subscription_tier: string | null;
};

type CreditLedgerInsert = {
  user_id: string;
  amount: number;
  source: "subscription" | "topup" | "bundle";
};

type CreditUsageInsert = {
  user_id: string;
  type: CreditSpendType;
  credits_used: number;
  report_id: string | null;
  statement_id: string | null;
};

export async function getCreditsBalance(userId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  const row = data as ProfileCreditsRow | null;
  const balance = row?.credits_balance;
  return typeof balance === "number" && !Number.isNaN(balance) ? balance : 0;
}

export async function hasEnoughCredits(
  userId: string,
  type: "report" | "statement" | "bundle",
): Promise<boolean> {
  const balance = await getCreditsBalance(userId);
  return balance >= CREDIT_COSTS[type];
}

export async function deductCredits(
  userId: string,
  type: "report" | "statement" | "bundle",
  reportId?: string,
  statementId?: string,
): Promise<boolean> {
  const cost = CREDIT_COSTS[type];
  const supabase = createServiceClient();
  const balance = await getCreditsBalance(userId);

  if (balance < cost) {
    return false;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits_balance: balance - cost })
    .eq("id", userId);

  if (updateError) throw updateError;

  const usage: CreditUsageInsert = {
    user_id: userId,
    type,
    credits_used: cost,
    report_id: reportId ?? null,
    statement_id: statementId ?? null,
  };

  const { error: usageError } = await supabase
    .from("usage")
    .insert(usage);

  if (usageError) throw usageError;

  return true;
}

export async function addCredits(
  userId: string,
  amount: number,
  source: "subscription" | "topup" | "bundle",
): Promise<void> {
  const supabase = createServiceClient();
  const currentBalance = await getCreditsBalance(userId);

  let newBalance: number;
  if (source === "subscription") {
    const caps: Record<"starter" | "pro" | "agency", number> = {
      starter: 30,
      pro: 120,
      agency: 320,
    };
    const tier = await getSubscriptionTier(userId);
    const cap =
      tier === "starter" || tier === "pro" || tier === "agency"
        ? caps[tier]
        : 999999;
    newBalance = Math.min(currentBalance + amount, cap);
  } else {
    newBalance = currentBalance + amount;
  }

  const ledger: CreditLedgerInsert = {
    user_id: userId,
    amount,
    source,
  };

  const { error: insertError } = await supabase.from("credits").insert(ledger);

  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits_balance: newBalance })
    .eq("id", userId);

  if (updateError) throw updateError;
}

export async function getSubscriptionTier(
  userId: string,
): Promise<"free" | "starter" | "pro" | "agency"> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  const row = data as ProfileTierRow | null;
  const tier = row?.subscription_tier;
  if (
    tier === "free" ||
    tier === "starter" ||
    tier === "pro" ||
    tier === "agency"
  ) {
    return tier;
  }

  return "free";
}
