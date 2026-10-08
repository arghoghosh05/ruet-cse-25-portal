import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../../utils/supabase/server";

const allowedOtpTypes = new Set<EmailOtpType>(["email", "signup", "magiclink"]);

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const code = request.nextUrl.searchParams.get("code");
  const type = request.nextUrl.searchParams.get("type");
  const flow = request.nextUrl.searchParams.get("flow");
  const roll = request.nextUrl.searchParams.get("roll");
  const validRoll = roll && /^\d{7}$/.test(roll) && Number(roll) >= 2503001 && Number(roll) <= 2503180;
  const nextPath = flow === "setup" && validRoll
    ? `/submit-profile?setup=1&roll=${encodeURIComponent(roll)}`
    : "/submit-profile";

  if (!tokenHash && !code) {
    return NextResponse.redirect(
      new URL("/submit-profile?error=That verification link is invalid or expired. Request a new one.", request.url),
    );
  }

  const supabase = await createClient();
  const { error } = tokenHash && type && allowedOtpTypes.has(type as EmailOtpType)
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("Invalid email verification link.") };

  if (error) {
    return NextResponse.redirect(
      new URL("/submit-profile?error=That verification link is invalid or expired. Request a new one.", request.url),
    );
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
