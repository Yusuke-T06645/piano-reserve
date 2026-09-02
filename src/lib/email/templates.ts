import { config } from "../config";
import { formatJapaneseDate } from "../dates";
import type { Reservation, WaitlistEntry } from "../store/types";

function wrap(bodyHtml: string): string {
  return `<!doctype html>
<html lang="ja"><body style="font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; color:#1F2A44; background:#F4F1EA; padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #E5E1D8;">
    <p style="font-size:12px;letter-spacing:0.08em;color:#6B7280;margin:0 0 4px;">${config.orgName}</p>
    <h1 style="font-size:18px;margin:0 0 20px;color:#1F2A44;">${config.siteName}</h1>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #E5E1D8;margin:28px 0 16px;" />
    <p style="font-size:12px;color:#9AA0A6;">本メールは自動送信されています。お問い合わせは ${config.supportEmail} までご連絡ください。</p>
  </div>
</body></html>`;
}

export function reservationConfirmedEmail(r: Reservation, manageUrl: string) {
  const html = wrap(`
    <p>${r.name} 様</p>
    <p>グランドピアノ開放のご予約を承りました。当日は本メールに記載のQRコードを受付でご提示ください。</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#6B7280;">予約番号</td><td style="padding:6px 0;font-weight:bold;">${r.id}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280;">日時</td><td style="padding:6px 0;font-weight:bold;">${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd}</td></tr>
    </table>
    <p style="text-align:center;margin:24px 0;">
      <img src="cid:qrcode" alt="チェックイン用QRコード" style="width:220px;height:220px;" />
    </p>
    <p>ご予約内容の確認・キャンセル・変更は、下記のページから行えます。</p>
    <p><a href="${manageUrl}" style="color:#2E6F73;">予約内容の確認・キャンセル・変更はこちら</a></p>
    <p style="font-size:13px;color:#6B7280;">※ご都合が悪くなった場合は、無断キャンセルとならないよう、上記ページから早めのキャンセルにご協力をお願いいたします。</p>
  `);
  return {
    subject: `【${config.siteShortName}】ご予約が確定しました（${formatJapaneseDate(r.date)} ${r.slotStart}〜）`,
    html,
    text: `${r.name}様\n\nご予約が確定しました。\n予約番号: ${r.id}\n日時: ${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd}\n\n予約内容の確認・キャンセル・変更: ${manageUrl}`,
  };
}

export function reminderEmail(r: Reservation, manageUrl: string) {
  const html = wrap(`
    <p>${r.name} 様</p>
    <p>明日はグランドピアノ開放のご利用日です。当日は受付にてQRコードをご提示ください。</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#6B7280;">日時</td><td style="padding:6px 0;font-weight:bold;">${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd}</td></tr>
    </table>
    <p style="text-align:center;margin:24px 0;">
      <img src="cid:qrcode" alt="チェックイン用QRコード" style="width:220px;height:220px;" />
    </p>
    <p>キャンセルの場合は、お手数ですが下記ページから前日までにご連絡ください。</p>
    <p><a href="${manageUrl}" style="color:#2E6F73;">予約内容の確認・キャンセルはこちら</a></p>
  `);
  return {
    subject: `【${config.siteShortName}】明日のご予約のご案内（${formatJapaneseDate(r.date)}）`,
    html,
    text: `${r.name}様\n\n明日はご予約日です。\n日時: ${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd}\nキャンセルはこちら: ${manageUrl}`,
  };
}

export function rescheduledEmail(r: Reservation, manageUrl: string) {
  const html = wrap(`
    <p>${r.name} 様</p>
    <p>ご予約日時を変更いたしました。当日は本メールに記載のQRコードを受付でご提示ください(QRコードはお手元の以前のメールと同じものが引き続き有効です)。</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#6B7280;">予約番号</td><td style="padding:6px 0;font-weight:bold;">${r.id}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280;">変更後の日時</td><td style="padding:6px 0;font-weight:bold;">${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd}</td></tr>
    </table>
    <p style="text-align:center;margin:24px 0;">
      <img src="cid:qrcode" alt="チェックイン用QRコード" style="width:220px;height:220px;" />
    </p>
    <p><a href="${manageUrl}" style="color:#2E6F73;">予約内容の確認・キャンセル・変更はこちら</a></p>
  `);
  return {
    subject: `【${config.siteShortName}】ご予約日時を変更しました（${formatJapaneseDate(r.date)} ${r.slotStart}〜）`,
    html,
    text: `${r.name}様\n\nご予約日時を変更しました。\n予約番号: ${r.id}\n変更後の日時: ${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd}\n\n詳細: ${manageUrl}`,
  };
}

export function manageLinkEmail(r: Reservation, manageUrl: string) {
  const html = wrap(`
    <p>${r.name} 様</p>
    <p>ご予約内容の確認・キャンセル・変更用のリンクをお送りします。</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#6B7280;">予約番号</td><td style="padding:6px 0;font-weight:bold;">${r.id}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280;">日時</td><td style="padding:6px 0;font-weight:bold;">${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd}</td></tr>
    </table>
    <p><a href="${manageUrl}" style="color:#2E6F73;">予約内容の確認・キャンセル・変更はこちら</a></p>
    <p style="font-size:13px;color:#6B7280;">※このリンクに心当たりがない場合は、本メールを破棄してください。</p>
  `);
  return {
    subject: `【${config.siteShortName}】予約確認用リンクのご案内`,
    html,
    text: `${r.name}様\n\n予約確認用リンク: ${manageUrl}`,
  };
}

export function cancelledEmail(r: Reservation) {
  const html = wrap(`
    <p>${r.name} 様</p>
    <p>下記のご予約はキャンセルされました。またのご利用をお待ちしております。</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#6B7280;">日時</td><td style="padding:6px 0;font-weight:bold;">${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd}</td></tr>
    </table>
  `);
  return {
    subject: `【${config.siteShortName}】ご予約キャンセルのご連絡`,
    html,
    text: `${r.name}様\n\n以下のご予約をキャンセルしました。\n日時: ${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd}`,
  };
}

export function waitlistJoinedEmail(w: WaitlistEntry) {
  const html = wrap(`
    <p>${w.name} 様</p>
    <p>ご希望の枠は満席のため、キャンセル待ちで承りました。キャンセルが発生した場合、先着順で自動的にご予約が確定し、改めてメールでご案内します。</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#6B7280;">希望日時</td><td style="padding:6px 0;font-weight:bold;">${formatJapaneseDate(w.date)} ${w.slotStart}〜${w.slotEnd}</td></tr>
    </table>
  `);
  return {
    subject: `【${config.siteShortName}】キャンセル待ちを受け付けました`,
    html,
    text: `${w.name}様\n\nキャンセル待ちを受け付けました。\n希望日時: ${formatJapaneseDate(w.date)} ${w.slotStart}〜${w.slotEnd}`,
  };
}

export function waitlistPromotedEmail(r: Reservation, manageUrl: string) {
  const html = wrap(`
    <p>${r.name} 様</p>
    <p>キャンセルが発生したため、キャンセル待ちのご予約が確定しました！当日は受付にてQRコードをご提示ください。</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#6B7280;">予約番号</td><td style="padding:6px 0;font-weight:bold;">${r.id}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280;">日時</td><td style="padding:6px 0;font-weight:bold;">${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd}</td></tr>
    </table>
    <p style="text-align:center;margin:24px 0;">
      <img src="cid:qrcode" alt="チェックイン用QRコード" style="width:220px;height:220px;" />
    </p>
    <p><a href="${manageUrl}" style="color:#2E6F73;">予約内容の確認・キャンセル・変更はこちら</a></p>
  `);
  return {
    subject: `【${config.siteShortName}】キャンセル待ちのご予約が確定しました`,
    html,
    text: `${r.name}様\n\nキャンセル待ちのご予約が確定しました。\n予約番号: ${r.id}\n日時: ${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd}\n詳細: ${manageUrl}`,
  };
}

export function adminNewBookingEmail(r: Reservation, adminUrl: string) {
  const html = wrap(`
    <p>新しいご予約がありました。</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#6B7280;">予約番号</td><td style="padding:6px 0;">${r.id}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280;">日時</td><td style="padding:6px 0;">${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280;">お名前</td><td style="padding:6px 0;">${r.name}</td></tr>
    </table>
    <p><a href="${adminUrl}" style="color:#2E6F73;">管理画面で確認する</a></p>
  `);
  return {
    subject: `【管理者通知】新規予約: ${formatJapaneseDate(r.date)} ${r.slotStart}〜 ${r.name}様`,
    html,
    text: `新規予約: ${r.id} / ${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd} / ${r.name}様`,
  };
}

export function adminCancellationEmail(r: Reservation) {
  const html = wrap(`
    <p>予約のキャンセルがありました。</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#6B7280;">予約番号</td><td style="padding:6px 0;">${r.id}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280;">日時</td><td style="padding:6px 0;">${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280;">お名前</td><td style="padding:6px 0;">${r.name}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280;">キャンセル者</td><td style="padding:6px 0;">${r.cancelledBy === "admin" ? "管理者" : "利用者本人"}</td></tr>
    </table>
  `);
  return {
    subject: `【管理者通知】キャンセル: ${formatJapaneseDate(r.date)} ${r.slotStart}〜 ${r.name}様`,
    html,
    text: `キャンセル: ${r.id} / ${formatJapaneseDate(r.date)} ${r.slotStart}〜${r.slotEnd} / ${r.name}様`,
  };
}
