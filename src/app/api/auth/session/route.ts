import { NextResponse, type NextRequest } from "next/server";
import {
  createFirebaseSession,
  firebaseSessionCookieName,
} from "../../../../lib/firebase-session";

export const runtime = "nodejs";
const maxRequestBytes = 16_384;

class RequestTooLargeError extends Error {}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

async function readJsonBody(request: NextRequest): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("A request body is required.");
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxRequestBytes) {
        await reader.cancel();
        throw new RequestTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bodyBytes)) as unknown;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    if (error instanceof RequestTooLargeError) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("idToken" in body) ||
    typeof body.idToken !== "string" ||
    body.idToken.length > 12_000
  ) {
    return NextResponse.json({ error: "A valid Firebase ID token is required." }, { status: 400 });
  }

  try {
    const { sessionCookie, expiresIn } = await createFirebaseSession(body.idToken);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(firebaseSessionCookieName, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000,
    });
    return response;
  } catch (error) {
    console.error("Firebase session creation failed:", error);
    return NextResponse.json({ error: "Sign-in could not be completed." }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(firebaseSessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
