import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session?.user) {
      const { user } = data.session;
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : NaN;
      const lastSignInAt = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : NaN;
      const isNewSignUp =
        Number.isFinite(createdAt) &&
        Number.isFinite(lastSignInAt) &&
        Math.abs(lastSignInAt - createdAt) <= 10_000;

      if (isNewSignUp && user.email) {
        void fetch(new URL("/api/email/welcome", requestUrl.origin), {
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
    }
  }

  const redirectPath = next ?? "/dashboard";
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}
