import { handleTelegramUpdate, isValidTelegramWebhookSecret } from "../../../../lib/telegram-resources";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isValidTelegramWebhookSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 1_000_000) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }

  try {
    const body = await request.text();
    if (body.length > 1_000_000) {
      return Response.json({ error: "Payload too large" }, { status: 413 });
    }
    let update: unknown;
    try {
      update = JSON.parse(body);
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (
      typeof update !== "object" ||
      update === null ||
      !("update_id" in update) ||
      typeof update.update_id !== "number" ||
      !Number.isSafeInteger(update.update_id)
    ) {
      return Response.json({ error: "Invalid Telegram update" }, { status: 400 });
    }

    await handleTelegramUpdate(update as Parameters<typeof handleTelegramUpdate>[0]);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Telegram resource webhook failed:", error);
    return Response.json({ error: "Telegram update processing failed" }, { status: 500 });
  }
}
