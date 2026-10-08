import type { NextRequest } from "next/server";
import { isAdminIdentity } from "./lib/admin-auth";
import { updateSession } from "../utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request, isAdminIdentity);
}

export const config = {
  matcher: [
    "/((?!api/telegram/webhook|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
