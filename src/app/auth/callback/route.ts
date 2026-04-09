import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("callback: code exchange", { error: error?.message, hasSession: !!data.session });

    if (!error && data.session?.user) {
      const { user } = data.session;
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : NaN;
      const lastSignInAt = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : NaN;
      const isNewSignUp =
        Number.isFinite(createdAt) &&
        Number.isFinite(lastSignInAt) &&
        Math.abs(lastSignInAt - createdAt) <= 3_600_000;
      console.log("callback: signup check", {
        isNewSignUp,
        createdAt,
        lastSignInAt,
        diff: Math.abs(lastSignInAt - createdAt),
      });

      if (isNewSignUp && user.email) {
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
    }
  }

  const redirectPath = next ?? "/dashboard";
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}
