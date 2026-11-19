import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Pass through response with Next.js standard headers
  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: [
    "/((?!api/telegram/webhook|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
