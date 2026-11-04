import * as admin from 'firebase-admin';
import {
  FieldPath,
  FieldValue,
  getFirestore,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';

admin.initializeApp();
const db = getFirestore();

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

function isAlreadyQueued(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error &&
    (error.code === 6 || error.code === 'already-exists');
}

/**
 * Triggered when a notice document is written.
 * If isPublished transitions to true, fan-out email notifications
 * to users who explicitly enabled email notifications.
 */
export const onNoticePublished = onDocumentWritten(
  'notices/{noticeId}',
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    // Only proceed if isPublished just became true
    const wasPublished = before?.isPublished === true;
    const isNowPublished = after?.isPublished === true;

    if (wasPublished || !isNowPublished || !after) {
      logger.info('Skipping email: notice not newly published');
      return;
    }

    const noticeId = event.params.noticeId;
    const { title, body, category } = after as {
      title: string;
      body: string;
      category: string;
      isPublished: boolean;
    };
    if (
      typeof title !== 'string' || title.trim().length === 0 || title.length > 200 ||
      typeof body !== 'string' || body.length > 20_000
    ) {
      logger.error(`Notice ${noticeId} has invalid title or body; email was not queued.`);
      return;
    }

    const appUrl = process.env.APP_URL;
    let appOrigin: string;
    try {
      const parsedUrl = new URL(appUrl ?? '');
      if (parsedUrl.protocol !== 'https:' || parsedUrl.pathname !== '/') {
        throw new Error('APP_URL must be an HTTPS origin without a path.');
      }
      appOrigin = parsedUrl.origin;
    } catch (error) {
      logger.error('APP_URL must be configured as the deployed HTTPS origin.', error);
      throw error;
    }

    logger.info(`Notice ${noticeId} published — sending emails`);

    const usersQuery = db.collection('users')
      .where('emailNotifications', '==', true)
      .orderBy(FieldPath.documentId())
      .limit(500);

    const categoryEmoji: Record<string, string> = {
      Academic: '📚',
      Urgent: '🚨',
      Event: '📅',
      General: '📢',
    };
    const safeCategory = ['Academic', 'Urgent', 'Event', 'General'].includes(category)
      ? category
      : 'General';
    const emoji = categoryEmoji[safeCategory] ?? '📢';
    const safeTitle = escapeHtml(title);
    const safeBody = escapeHtml(body).replace(/\r\n|\r|\n/g, '<br>');
    const safeCategoryLabel = escapeHtml(safeCategory);
    const safeSubjectTitle = title.replace(/[\r\n]/g, ' ').slice(0, 200);
    const encodedNoticeId = Buffer.from(noticeId).toString('hex');
    let cursor: QueryDocumentSnapshot | undefined;
    let queuedCount = 0;
    let batchIndex = 0;
    let pendingEmails: string[] = [];

    const queueBatch = async (emails: string[]) => {
      if (!emails.length) return;
      const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle}</title>
<style>
  body { margin: 0; background: #f3f7f5; font-family: Arial, Helvetica, sans-serif; }
  .wrapper { max-width: 600px; margin: 32px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(32,59,73,.08); }
  .header { background: #203b49; padding: 28px 32px; }
  .header-title { margin: 0; color: #dff5e8; font-size: 13px; font-weight: 800; letter-spacing: .1em; }
  .header-app { margin: 8px 0 0; color: #ffffff; font-size: 20px; font-weight: 700; }
  .body { padding: 28px 32px; }
  .category-pill { display: inline-block; border-radius: 20px; background: #e8f1fb; padding: 5px 10px; color: #4d6f92; font-size: 11px; font-weight: 800; margin-bottom: 16px; }
  .notice-title { margin: 0 0 14px; color: #203b49; font-size: 20px; font-weight: 700; line-height: 1.3; }
  .notice-body { margin: 0 0 24px; color: #6b7e85; font-size: 13px; line-height: 1.7; }
  .cta { display: inline-block; border-radius: 10px; background: #203b49; padding: 12px 22px; color: white; font-size: 12px; font-weight: 700; text-decoration: none; }
  .footer { border-top: 1px solid #e7eeea; padding: 18px 32px; color: #9aadaa; font-size: 10px; line-height: 1.6; }
  .footer a { color: #5b7e6e; }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-title">RUET CSE '25 HUB · NOTICE</p>
      <p class="header-app">New batch update</p>
    </div>
    <div class="body">
      <span class="category-pill">${emoji} ${safeCategoryLabel}</span>
      <h1 class="notice-title">${safeTitle}</h1>
      <p class="notice-body">${safeBody}</p>
      <a class="cta" href="${appOrigin}/notices">View all notices →</a>
    </div>
    <div class="footer">
      <p>You received this email because you enabled notice emails for RUET CSE '25 Hub.
      <a href="${appOrigin}/profile">Manage notification preferences</a></p>
    </div>
  </div>
</body>
</html>`;
      const batchRef = db.collection('mail').doc(`notice-${encodedNoticeId}-${batchIndex}`);
      try {
        await batchRef.create({
          to: emails,
          message: {
            subject: `${emoji} [CSE '25 Hub] ${safeSubjectTitle}`,
            html: htmlBody,
            text: `${title}\n\n${body}\n\nView all notices: ${appOrigin}/notices\n\nManage notifications: ${appOrigin}/profile`,
          },
          createdAt: FieldValue.serverTimestamp(),
        });
        queuedCount += emails.length;
      } catch (error) {
        if (!isAlreadyQueued(error)) throw error;
      }
      batchIndex += 1;
    };

    while (true) {
      const page = cursor
        ? await usersQuery.startAfter(cursor).get()
        : await usersQuery.get();
      if (page.empty) break;
      cursor = page.docs[page.docs.length - 1];
      for (const userDoc of page.docs) {
        const email = userDoc.get('email');
        if (typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          pendingEmails.push(email);
          if (pendingEmails.length === 50) {
            await queueBatch(pendingEmails);
            pendingEmails = [];
          }
        }
      }
      if (page.size < 500) break;
    }
    await queueBatch(pendingEmails);

    logger.info(`Email queued for ${queuedCount} opted-in recipient(s)`);
  },
);
