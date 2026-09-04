import { config } from "./config";
import { buildCheckinUrl, buildManageUrl, generateQrBuffer } from "./qr";
import { getMailer } from "./email";
import { templates } from "./email";
import type { EmailMessage } from "./email";
import type { Reservation, WaitlistEntry } from "./store/types";

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

async function qrAttachment(checkinToken: string) {
  const url = buildCheckinUrl(checkinToken, getBaseUrl());
  const buffer = await generateQrBuffer(url);
  return { filename: "checkin-qr.png", content: buffer, contentType: "image/png", cid: "qrcode" };
}

/**
 * メール送信は予約処理そのものを失敗させてはいけないベストエフォートの副作用のため、
 * 失敗してもここで握りつぶし、原因調査ができるようログにだけ残す(サーバーログに出力される)。
 */
async function safeSend(message: EmailMessage) {
  try {
    await getMailer().send(message);
  } catch (err) {
    console.error(`[email] 送信に失敗しました(to: ${message.to}, subject: ${message.subject})`, err);
  }
}

export async function notifyReservationConfirmed(r: Reservation) {
  const manageUrl = buildManageUrl(r.manageToken, getBaseUrl());
  const { subject, html, text } = templates.reservationConfirmedEmail(r, manageUrl);
  await safeSend({ to: r.email, subject, html, text, attachments: [await qrAttachment(r.checkinToken)] });
  await notifyAdminNewBooking(r);
}

export async function notifyReminder(r: Reservation) {
  const manageUrl = buildManageUrl(r.manageToken, getBaseUrl());
  const { subject, html, text } = templates.reminderEmail(r, manageUrl);
  await safeSend({ to: r.email, subject, html, text, attachments: [await qrAttachment(r.checkinToken)] });
}

export async function sendManageLink(r: Reservation) {
  const manageUrl = buildManageUrl(r.manageToken, getBaseUrl());
  const { subject, html, text } = templates.manageLinkEmail(r, manageUrl);
  await safeSend({ to: r.email, subject, html, text });
}

export async function notifyRescheduled(r: Reservation) {
  const manageUrl = buildManageUrl(r.manageToken, getBaseUrl());
  const { subject, html, text } = templates.rescheduledEmail(r, manageUrl);
  await safeSend({ to: r.email, subject, html, text, attachments: [await qrAttachment(r.checkinToken)] });
}

export async function notifyCancelled(r: Reservation) {
  const { subject, html, text } = templates.cancelledEmail(r);
  await safeSend({ to: r.email, subject, html, text });
  await notifyAdminCancellation(r);
}

export async function notifyWaitlistJoined(w: WaitlistEntry) {
  const { subject, html, text } = templates.waitlistJoinedEmail(w);
  await safeSend({ to: w.email, subject, html, text });
}

export async function notifyWaitlistPromoted(r: Reservation) {
  const manageUrl = buildManageUrl(r.manageToken, getBaseUrl());
  const { subject, html, text } = templates.waitlistPromotedEmail(r, manageUrl);
  await safeSend({ to: r.email, subject, html, text, attachments: [await qrAttachment(r.checkinToken)] });
  await notifyAdminNewBooking(r);
}

export async function notifyAdminNewBooking(r: Reservation) {
  const adminUrl = `${getBaseUrl()}/admin`;
  const { subject, html, text } = templates.adminNewBookingEmail(r, adminUrl);
  await safeSend({ to: config.adminNotifyEmail, subject, html, text });
}

export async function notifyAdminCancellation(r: Reservation) {
  const { subject, html, text } = templates.adminCancellationEmail(r);
  await safeSend({ to: config.adminNotifyEmail, subject, html, text });
}
