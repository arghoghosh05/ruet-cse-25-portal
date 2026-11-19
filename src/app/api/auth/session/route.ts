import { NextResponse } from "next/server";
import { createSessionFromIdToken, destroySession } from "../../../../lib/firebase/session";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Missing or invalid ID token" }, { status: 400 });
    }

    const result = await createSessionFromIdToken(idToken);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to create session" }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to logout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
