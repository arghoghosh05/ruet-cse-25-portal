import { createClient } from "@supabase/supabase-js";

const semesters = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"] as const;
const categories = ["ct", "final", "notes", "books"] as const;
const categoryLabels: Record<Category, string> = {
  ct: "CT questions",
  final: "Semester final questions",
  notes: "Handnotes",
  books: "Books",
};

type Semester = (typeof semesters)[number];
type Category = (typeof categories)[number];
type UploadStage = "semester" | "category" | "ct" | "title" | "document";

type TelegramDocument = {
  file_id: string;
  file_name?: string;
  mime_type?: string;
};

type TelegramMessage = {
  message_id: number;
  from?: { id: number };
  chat: { id: number; type: string };
  text?: string;
  document?: TelegramDocument;
};

type TelegramCallback = {
  id: string;
  from: { id: number };
  data?: string;
  message?: TelegramMessage;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallback;
};

type InlineKeyboard = {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
};

type UploadSession = {
  telegram_user_id: number;
  telegram_chat_id: number;
  stage: UploadStage;
  semester: Semester | null;
  category: Category | null;
  ct_number: number | null;
  title: string | null;
};

const semesterLabel = (semester: Semester) => `Semester ${semester}`;
const isSemester = (value: string): value is Semester =>
  semesters.includes(value as Semester);
const isCategory = (value: string): value is Category =>
  categories.includes(value as Category);

function getAdminUserIds() {
  return new Set(
    (process.env.TELEGRAM_ADMIN_USER_IDS ?? "")
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isSafeInteger(id) && id > 0),
  );
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Telegram resource bot database configuration is missing.");
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function callTelegram<T>(method: string, payload: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Telegram bot token is not configured.");

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  const result = (await response.json()) as {
    ok: boolean;
    result?: T;
    description?: string;
  };
  if (!response.ok || !result.ok || result.result === undefined) {
    throw new Error(`Telegram ${method} request failed: ${result.description ?? response.status}`);
  }
  return result.result;
}

function semesterKeyboard(prefix: "sem" | "upsem"): InlineKeyboard {
  return {
    inline_keyboard: [
      semesters.slice(0, 4).map((semester) => ({
        text: semesterLabel(semester),
        callback_data: `${prefix}:${semester}`,
      })),
      semesters.slice(4).map((semester) => ({
        text: semesterLabel(semester),
        callback_data: `${prefix}:${semester}`,
      })),
    ],
  };
}

function homeKeyboard(isAdmin: boolean): InlineKeyboard {
  const rows = [[{ text: "Browse resources", callback_data: "home:browse" }]];
  if (isAdmin) rows.push([{ text: "Upload a resource", callback_data: "home:upload" }]);
  return { inline_keyboard: rows };
}

function categoryKeyboard(semester: Semester, prefix: "cat" | "upcat"): InlineKeyboard {
  return {
    inline_keyboard: [
      [{ text: categoryLabels.ct, callback_data: `${prefix}:${semester}:ct` }],
      [{ text: categoryLabels.final, callback_data: `${prefix}:${semester}:final` }],
      [{ text: categoryLabels.notes, callback_data: `${prefix}:${semester}:notes` }],
      [{ text: categoryLabels.books, callback_data: `${prefix}:${semester}:books` }],
      [{
        text: prefix === "upcat" ? "Cancel upload" : "Back to semesters",
        callback_data: prefix === "upcat" ? "upload:cancel" : "home:browse",
      }],
    ],
  };
}

async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: InlineKeyboard,
) {
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

async function editMessage(
  callback: TelegramCallback,
  text: string,
  replyMarkup?: InlineKeyboard,
) {
  if (!callback.message) return;
  await callTelegram("editMessageText", {
    chat_id: callback.message.chat.id,
    message_id: callback.message.message_id,
    text,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

async function answerCallback(callback: TelegramCallback, text?: string) {
  await callTelegram("answerCallbackQuery", {
    callback_query_id: callback.id,
    ...(text ? { text } : {}),
  });
}

async function showHome(chatId: number, userId: number) {
  await sendMessage(
    chatId,
    "RUET CSE ’25 resources\nBrowse CT questions, semester finals, handnotes, and books by semester.",
    homeKeyboard(getAdminUserIds().has(userId)),
  );
}

async function showResourceList(
  callback: TelegramCallback,
  semester: Semester,
  category: Category,
  ctNumber: number | null,
  offset: number,
) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("telegram_resources")
    .select("id, title, file_name, created_at")
    .eq("semester", semester)
    .eq("category", category)
    .order("created_at", { ascending: false })
    .range(offset, offset + 7);

  if (category === "ct") query = query.eq("ct_number", ctNumber);

  const { data, error } = await query;
  if (error) throw new Error("Unable to load Telegram resources.");

  const buttons = (data ?? []).map((resource) => [{
    text: resource.title.slice(0, 60),
    callback_data: `file:${resource.id}`,
  }]);
  if (data?.length === 8) {
    buttons.push([{
      text: "More resources",
      callback_data: `list:${semester}:${category}:${ctNumber ?? 0}:${offset + 8}`,
    }]);
  }
  buttons.push([{ text: "Back to resource types", callback_data: `sem:${semester}` }]);

  const categoryLabel = category === "ct"
    ? `CT ${ctNumber} questions`
    : categoryLabels[category];
  const heading = `${semesterLabel(semester)} · ${categoryLabel}`;
  const text = data?.length
    ? `${heading}\nChoose a resource to receive it in this chat.`
    : `${heading}\nNo resources have been added here yet.`;
  await editMessage(callback, text, { inline_keyboard: buttons });
}

async function handleCallback(callback: TelegramCallback) {
  const data = callback.data ?? "";
  const senderId = callback.from.id;
  const chat = callback.message?.chat;

  if (!chat || chat.type !== "private") {
    await answerCallback(callback, "Open the bot in a private chat to use resources.");
    return;
  }

  if (data === "home:browse") {
    await answerCallback(callback);
    await editMessage(callback, "Choose a semester:", semesterKeyboard("sem"));
    return;
  }

  if (data === "home:upload") {
    if (!getAdminUserIds().has(senderId)) {
      await answerCallback(callback, "Uploads are limited to authorized resource managers.");
      return;
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("telegram_resource_upload_sessions").upsert({
      telegram_user_id: senderId,
      telegram_chat_id: chat.id,
      stage: "semester",
      semester: null,
      category: null,
      ct_number: null,
      title: null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error("Unable to start a resource upload.");
    await answerCallback(callback);
    await editMessage(callback, "Choose the semester for this resource:", semesterKeyboard("upsem"));
    return;
  }

  if (data === "upload:cancel" && getAdminUserIds().has(senderId)) {
    await deleteUploadSession(senderId);
    await answerCallback(callback);
    await editMessage(callback, "Upload cancelled. Choose a semester to browse resources:", semesterKeyboard("sem"));
    return;
  }

  const [action, first, second, third, fourth] = data.split(":");
  if (action === "sem" && first && isSemester(first)) {
    await answerCallback(callback);
    await editMessage(callback, `Choose a resource type for ${semesterLabel(first)}:`, categoryKeyboard(first, "cat"));
    return;
  }

  if (action === "upsem" && first && isSemester(first) && getAdminUserIds().has(senderId)) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("telegram_resource_upload_sessions").upsert({
      telegram_user_id: senderId,
      telegram_chat_id: chat.id,
      stage: "category",
      semester: first,
      category: null,
      ct_number: null,
      title: null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error("Unable to save the upload semester.");
    await answerCallback(callback);
    await editMessage(callback, `Choose a resource type for ${semesterLabel(first)}:`, categoryKeyboard(first, "upcat"));
    return;
  }

  if (action === "cat" && first && isSemester(first) && second && isCategory(second)) {
    await answerCallback(callback);
    if (second === "ct") {
      await editMessage(callback, `Choose a CT for ${semesterLabel(first)}:`, {
        inline_keyboard: [
          [1, 2].map((ct) => ({ text: `CT ${ct}`, callback_data: `browsect:${first}:${ct}` })),
          [3, 4].map((ct) => ({ text: `CT ${ct}`, callback_data: `browsect:${first}:${ct}` })),
          [{ text: "Back to resource types", callback_data: `sem:${first}` }],
        ],
      });
    } else {
      await showResourceList(callback, first, second, null, 0);
    }
    return;
  }

  if (action === "browsect" && first && isSemester(first) && second && /^[1-4]$/.test(second)) {
    await answerCallback(callback);
    await showResourceList(callback, first, "ct", Number(second), 0);
    return;
  }

  if (action === "upcat" && first && isSemester(first) && second && isCategory(second) && getAdminUserIds().has(senderId)) {
    const supabase = getSupabaseAdmin();
    const nextStage: UploadStage = second === "ct" ? "ct" : "title";
    const { error } = await supabase.from("telegram_resource_upload_sessions").upsert({
      telegram_user_id: senderId,
      telegram_chat_id: chat.id,
      stage: nextStage,
      semester: first,
      category: second,
      ct_number: null,
      title: null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error("Unable to save the resource type.");
    await answerCallback(callback);
    if (second === "ct") {
      await editMessage(callback, "Choose the CT number:", {
        inline_keyboard: [
          [1, 2].map((ct) => ({ text: `CT ${ct}`, callback_data: `upct:${ct}` })),
          [3, 4].map((ct) => ({ text: `CT ${ct}`, callback_data: `upct:${ct}` })),
        ],
      });
    } else {
      await editMessage(callback, "Send a short title for this resource.");
    }
    return;
  }

  if (action === "upct" && first && /^[1-4]$/.test(first) && getAdminUserIds().has(senderId)) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("telegram_resource_upload_sessions")
      .update({ stage: "title", ct_number: Number(first), updated_at: new Date().toISOString() })
      .eq("telegram_user_id", senderId)
      .eq("stage", "ct")
      .select("telegram_user_id")
      .maybeSingle();
    if (error) throw new Error("Unable to save the CT number.");
    if (!data) {
      await answerCallback(callback, "That upload has expired. Start again with /upload.");
      return;
    }
    await answerCallback(callback);
    await editMessage(callback, `CT ${first} selected. Send a short title for this resource.`);
    return;
  }

  if (action === "list" && first && isSemester(first) && second && isCategory(second) && third && /^\d+$/.test(third) && fourth && /^\d+$/.test(fourth)) {
    const ctNumber = Number(third);
    const offset = Number(fourth);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 10000) {
      await answerCallback(callback, "That resource page is unavailable.");
      return;
    }
    await answerCallback(callback);
    await showResourceList(callback, first, second, second === "ct" ? ctNumber : null, offset);
    return;
  }

  if (action === "file" && first && /^[0-9a-f-]{36}$/i.test(first)) {
    const supabase = getSupabaseAdmin();
    const { data: resource, error } = await supabase
      .from("telegram_resources")
      .select("title, file_id, semester, category, ct_number")
      .eq("id", first)
      .maybeSingle();
    if (error) throw new Error("Unable to load the requested resource.");
    if (!resource) {
      await answerCallback(callback, "This resource is no longer available.");
      return;
    }

    await answerCallback(callback, "Sending resource…");
    const caption = `${semesterLabel(resource.semester as Semester)} · ${
      resource.category === "ct"
        ? `CT ${resource.ct_number} questions`
        : categoryLabels[resource.category as Category]
    }\n${resource.title}`;
    await callTelegram("sendDocument", {
      chat_id: chat.id,
      document: resource.file_id,
      caption: caption.slice(0, 1000),
    });
    return;
  }

  await answerCallback(callback, "That menu has expired. Use /start to open the resources menu.");
}

async function getUploadSession(userId: number) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("telegram_resource_upload_sessions")
    .select("telegram_user_id, telegram_chat_id, stage, semester, category, ct_number, title")
    .eq("telegram_user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Unable to load the resource upload session.");
  return data as UploadSession | null;
}

async function deleteUploadSession(userId: number) {
  const { error } = await getSupabaseAdmin()
    .from("telegram_resource_upload_sessions")
    .delete()
    .eq("telegram_user_id", userId);
  if (error) throw new Error("Unable to clear the resource upload session.");
}

async function handleMessage(message: TelegramMessage) {
  const senderId = message.from?.id;
  if (!senderId || message.chat.type !== "private") return;

  const isAdmin = getAdminUserIds().has(senderId);
  const text = message.text?.trim() ?? "";
  if (text === "/start" || text === "/resources") {
    await deleteUploadSession(senderId);
    await showHome(message.chat.id, senderId);
    return;
  }
  if (text === "/cancel") {
    await deleteUploadSession(senderId);
    await sendMessage(message.chat.id, "Upload cancelled.", homeKeyboard(isAdmin));
    return;
  }
  if (text === "/upload") {
    if (!isAdmin) {
      await sendMessage(message.chat.id, "Uploads are limited to authorized resource managers.");
      return;
    }
    const { error } = await getSupabaseAdmin().from("telegram_resource_upload_sessions").upsert({
      telegram_user_id: senderId,
      telegram_chat_id: message.chat.id,
      stage: "semester",
      semester: null,
      category: null,
      ct_number: null,
      title: null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error("Unable to start a resource upload.");
    await sendMessage(message.chat.id, "Choose the semester for this resource:", semesterKeyboard("upsem"));
    return;
  }

  const session = await getUploadSession(senderId);
  if (!session) {
    await sendMessage(message.chat.id, "Use /start to browse resources.");
    return;
  }
  if (!isAdmin) {
    await deleteUploadSession(senderId);
    await sendMessage(message.chat.id, "Uploads are limited to authorized resource managers.");
    return;
  }

  if (session.stage === "title") {
    const title = text.replace(/\s+/g, " ").trim();
    if (!title || title.length > 160 || title.startsWith("/")) {
      await sendMessage(message.chat.id, "Send a title between 1 and 160 characters, or /cancel.");
      return;
    }
    const { error } = await getSupabaseAdmin()
      .from("telegram_resource_upload_sessions")
      .update({ title, stage: "document", updated_at: new Date().toISOString() })
      .eq("telegram_user_id", senderId);
    if (error) throw new Error("Unable to save the resource title.");
    await sendMessage(message.chat.id, "Now upload the resource as a document (PDF, image, or office file). Use /cancel to stop.");
    return;
  }

  if (session.stage === "document" && message.document) {
    if (!session.semester || !session.category || !session.title ||
        (session.category === "ct" && !session.ct_number)) {
      await deleteUploadSession(senderId);
      await sendMessage(message.chat.id, "That upload session is incomplete. Start again with /upload.");
      return;
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("telegram_resources").insert({
      semester: session.semester,
      category: session.category,
      ct_number: session.category === "ct" ? session.ct_number : null,
      title: session.title,
      file_id: message.document.file_id,
      file_name: message.document.file_name?.slice(0, 255) ?? null,
      mime_type: message.document.mime_type?.slice(0, 128) ?? null,
      uploaded_by: senderId,
    });
    if (error) throw new Error("Unable to save the uploaded resource.");
    await deleteUploadSession(senderId);
    await sendMessage(message.chat.id, `Added “${session.title}” to ${semesterLabel(session.semester)} ${categoryLabels[session.category]}.`, homeKeyboard(true));
    return;
  }

  if (session.stage === "document") {
    await sendMessage(message.chat.id, "Please upload the file using Telegram’s document attachment option, or /cancel.");
    return;
  }

  await sendMessage(message.chat.id, "Finish the current upload or use /cancel to start over.");
}

async function processUpdate(update: TelegramUpdate) {
  if (update.callback_query) {
    await handleCallback(update.callback_query);
  } else if (update.message) {
    await handleMessage(update.message);
  }
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const supabase = getSupabaseAdmin();
  const { error: duplicateError } = await supabase
    .from("telegram_resource_updates")
    .insert({ update_id: update.update_id });
  if (duplicateError?.code === "23505") return;
  if (duplicateError) throw new Error("Unable to record the Telegram update.");

  try {
    await processUpdate(update);
  } catch (error) {
    await supabase.from("telegram_resource_updates").delete().eq("update_id", update.update_id);
    throw error;
  }

  await supabase
    .from("telegram_resource_updates")
    .delete()
    .lt("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
}

export function isValidTelegramWebhookSecret(received: string | null) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || expected.length < 32 || expected.length > 256 ||
      !received || received.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ received.charCodeAt(index);
  }
  return difference === 0;
}
