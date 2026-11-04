import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.redirect(
    new URL(
      "/submit-profile?error=Email sign-in links are no longer supported. Continue with Google to enroll.",
      request.url,
    ),
  );
}
