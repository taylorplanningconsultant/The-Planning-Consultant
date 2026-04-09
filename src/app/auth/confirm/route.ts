import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const nextParam = requestUrl.searchParams.get("next");
  const nextPath = nextParam?.startsWith("/") ? nextParam : "/dashboard";

  if (!tokenHash || !type) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  });

  if (error) {
    redirect("/login?error=confirmation_failed");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    void fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/welcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
      }),
    }).catch(() => {
      // Do not block auth redirect if welcome email fails.
    });
  }

  redirect(nextPath);
}
