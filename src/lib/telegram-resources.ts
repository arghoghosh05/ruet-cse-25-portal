import { getFirebaseAdmin } from "../../lib/firebase-admin";

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

function isTelegramMessage(value: unknown): value is TelegramMessage {
  if (typeof value !== "object" || value === null || !("chat" in value)) return false;
  const message = value as Partial<TelegramMessage>;
  return Number.isSafeInteger(message.message_id) &&
    typeof message.chat === "object" && message.chat !== null &&
    Number.isSafeInteger(message.chat.id) && typeof message.chat.type === "string" &&
    (message.text === undefined || typeof message.text === "string") &&
    (message.from === undefined ||
      (typeof message.from === "object" && message.from !== null &&
        Number.isSafeInteger(message.from.id) && message.from.id > 0)) &&
    (message.document === undefined ||
      (typeof message.document === "object" && message.document !== null &&
        typeof message.document.file_id === "string" &&
        message.document.file_id.length > 0 &&
        message.document.file_id.length <= 512 &&
        (message.document.file_name === undefined ||
          typeof message.document.file_name === "string") &&
        (message.document.mime_type === undefined ||
          typeof message.document.mime_type === "string")));
}

export function isTelegramUpdate(value: unknown): value is TelegramUpdate {
  if (typeof value !== "object" || value === null || !("update_id" in value)) return false;
  const update = value as Partial<TelegramUpdate>;
  if (!Number.isSafeInteger(update.update_id) || (update.update_id ?? -1) < 0) return false;
  if (update.message !== undefined && !isTelegramMessage(update.message)) return false;
  if (update.callback_query !== undefined) {
    const callback = update.callback_query;
    if (
      typeof callback !== "object" || callback === null ||
      typeof callback.id !== "string" ||
      typeof callback.from !== "object" || callback.from === null ||
      !Number.isSafeInteger(callback.from.id) || callback.from.id <= 0 ||
      (callback.data !== undefined &&
        (typeof callback.data !== "string" || callback.data.length > 256)) ||
      (callback.message !== undefined && !isTelegramMessage(callback.message))
    ) return false;
  }
  return true;
}

type InlineKeyboard = {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
};

interface UploadSession {
  id: string;
  telegramUserId: number;
  telegramChatId: number;
  stage: UploadStage;
  semester: Semester | null;
  category: Category | null;
  ctNumber: number | null;
  title: string | null;
  updatedAt?: string;
}

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

function getDb() {
  return getFirebaseAdmin().db;
}

function uploadSessionRef(userId: number) {
  return getDb().collection("telegram_upload_sessions").doc(String(userId));
}

async function saveUploadSession(session: UploadSession) {
  await uploadSessionRef(session.telegramUserId).set({
    ...session,
    updatedAt: new Date().toISOString(),
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
  let query = getDb().collection("telegram_resources")
    .where("semester", "==", semester)
    .where("category", "==", category)
    .orderBy("createdAt", "desc")
    .offset(offset)
    .limit(9);
  if (category === "ct") query = query.where("ctNumber", "==", ctNumber) as typeof query;

  const snapshot = await query.get();
  const resources = snapshot.docs.slice(0, 8).map((resource) => ({
    id: resource.id,
    title: typeof resource.get("title") === "string" ? resource.get("title") as string : "Untitled resource",
  }));
  const buttons = resources.map((resource) => [{
    text: resource.title.slice(0, 60),
    callback_data: `file:${resource.id}`,
  }]);
  if (snapshot.size > 8) {
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
  const text = resources.length
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
    await saveUploadSession({
      id: String(senderId),
      telegramUserId: senderId,
      telegramChatId: chat.id,
      stage: "semester",
      semester: null,
      category: null,
      ctNumber: null,
      title: null,
    });
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
    await saveUploadSession({
      id: String(senderId),
      telegramUserId: senderId,
      telegramChatId: chat.id,
      stage: "category",
      semester: first,
      category: null,
      ctNumber: null,
      title: null,
    });
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
    const nextStage: UploadStage = second === "ct" ? "ct" : "title";
    await saveUploadSession({
      id: String(senderId),
      telegramUserId: senderId,
      telegramChatId: chat.id,
      stage: nextStage,
      semester: first,
      category: second,
      ctNumber: null,
      title: null,
    });
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
    const sessionRef = uploadSessionRef(senderId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists || sessionSnap.get("stage") !== "ct") {
      await answerCallback(callback, "That upload has expired. Start again with /upload.");
      return;
    }
    await sessionRef.update({
      stage: "title",
      ctNumber: Number(first),
      updatedAt: new Date().toISOString(),
    });
    await answerCallback(callback);
    await editMessage(callback, `CT ${first} selected. Send a short title for this resource.`);
    return;
  }

  if (action === "list" && first && isSemester(first) && second && isCategory(second) && third && /^\d+$/.test(third) && fourth && /^\d+$/.test(fourth)) {
    const ctNumber = Number(third);
    const offset = Number(fourth);
    if (
      !Number.isSafeInteger(offset) || offset < 0 || offset > 10000 ||
      (second === "ct" && (!Number.isInteger(ctNumber) || ctNumber < 1 || ctNumber > 4))
    ) {
      await answerCallback(callback, "That resource page is unavailable.");
      return;
    }
    await answerCallback(callback);
    await showResourceList(callback, first, second, second === "ct" ? ctNumber : null, offset);
    return;
  }

  if (action === "file" && first && /^[A-Za-z0-9_-]{1,150}$/.test(first)) {
    const resourceSnap = await getDb().collection("telegram_resources").doc(first).get();
    if (!resourceSnap.exists) {
      await answerCallback(callback, "This resource is no longer available.");
      return;
    }
    const resource = resourceSnap.data();
    if (!resource || !isSemester(String(resource.semester)) ||
        typeof resource.category !== "string" || !isCategory(resource.category) ||
        typeof resource.fileId !== "string" ||
        typeof resource.title !== "string") {
      throw new Error("The requested resource record is invalid.");
    }

    await answerCallback(callback, "Sending resource…");
    const caption = `${semesterLabel(resource.semester)} · ${
      resource.category === "ct"
        ? `CT ${resource.ctNumber} questions`
        : categoryLabels[resource.category]
    }\n${resource.title}`;
    await callTelegram("sendDocument", {
      chat_id: chat.id,
      document: resource.fileId,
      caption: caption.slice(0, 1000),
    });
    return;
  }

  await answerCallback(callback, "That menu has expired. Use /start to open the resources menu.");
}

async function getUploadSession(userId: number) {
  const snapshot = await uploadSessionRef(userId).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (
    !data ||
    !Number.isSafeInteger(data.telegramUserId) ||
    !Number.isSafeInteger(data.telegramChatId) ||
    !["semester", "category", "ct", "title", "document"].includes(data.stage)
  ) {
    throw new Error("The Telegram upload session is invalid.");
  }
  return {
    id: snapshot.id,
    telegramUserId: data.telegramUserId as number,
    telegramChatId: data.telegramChatId as number,
    stage: data.stage as UploadStage,
    semester: isSemester(String(data.semester)) ? data.semester as Semester : null,
    category: isCategory(String(data.category)) ? data.category as Category : null,
    ctNumber: Number.isInteger(data.ctNumber) ? data.ctNumber as number : null,
    title: typeof data.title === "string" ? data.title : null,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined,
  } satisfies UploadSession;
}

async function deleteUploadSession(userId: number) {
  await uploadSessionRef(userId).delete();
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
    await saveUploadSession({
      id: String(senderId),
      telegramUserId: senderId,
      telegramChatId: message.chat.id,
      stage: "semester",
      semester: null,
      category: null,
      ctNumber: null,
      title: null,
    });
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
    await uploadSessionRef(senderId).update({
      title,
      stage: "document",
      updatedAt: new Date().toISOString(),
    });
    await sendMessage(message.chat.id, "Now upload the resource as a document (PDF, image, or office file). Use /cancel to stop.");
    return;
  }

  if (session.stage === "document" && message.document) {
    if (!session.semester || !session.category || !session.title ||
        (session.category === "ct" && !session.ctNumber)) {
      await deleteUploadSession(senderId);
      await sendMessage(message.chat.id, "That upload session is incomplete. Start again with /upload.");
      return;
    }
    const resourceRef = getDb().collection("telegram_resources").doc();
    await resourceRef.create({
      semester: session.semester,
      category: session.category,
      ctNumber: session.category === "ct" ? session.ctNumber : null,
      title: session.title,
      fileId: message.document.file_id.slice(0, 512),
      fileName: message.document.file_name?.slice(0, 255) ?? null,
      mimeType: message.document.mime_type?.slice(0, 128) ?? null,
      uploadedBy: senderId,
      createdAt: new Date().toISOString(),
    });
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
  if (!Number.isSafeInteger(update.update_id) || update.update_id < 0) {
    throw new Error("Invalid Telegram update ID.");
  }
  const updateRef = getDb().collection("telegram_updates").doc(String(update.update_id));
  const claimed = await getDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(updateRef);
    if (snapshot.get("status") === "complete") return false;
    const leaseUntil = snapshot.get("leaseUntil");
    if (
      snapshot.exists &&
      typeof leaseUntil === "string" &&
      Date.parse(leaseUntil) > Date.now()
    ) {
      throw new Error("Telegram update is already being processed.");
    }
    transaction.set(updateRef, {
      status: "processing",
      leaseUntil: new Date(Date.now() + 60_000).toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return true;
  });
  if (!claimed) return;

  try {
    await processUpdate(update);
  } catch (error) {
    await updateRef.delete();
    throw error;
  }

  await updateRef.set({
    status: "complete",
    completedAt: new Date().toISOString(),
    leaseUntil: null,
  }, { merge: true });
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
