import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type AdminIdentityCheck = (
  email: string | undefined,
  appMetadata: object | null | undefined,
) => boolean;

export async function updateSession(
  request: NextRequest,
  isAdminIdentity: AdminIdentityCheck,
) {
  const pendingCookies: Array<(response: NextResponse) => void> = [];
  const pendingHeaders: Record<string, string> = {};

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            pendingCookies.push((response) => {
              response.cookies.set(name, value, options);
            });
          });

          Object.assign(pendingHeaders, headers);
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  if (error) {
    console.error("Failed to refresh the Supabase session in Proxy:", error.message);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "x-ruet-admin-authenticated",
    isAdminIdentity(data?.claims?.email, data?.claims?.app_metadata)
      ? "true"
      : "false",
  );

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  pendingCookies.forEach((applyCookie) => applyCookie(response));
  Object.entries(pendingHeaders).forEach(([name, value]) => {
    response.headers.set(name, value);
  });
  return response;
}
