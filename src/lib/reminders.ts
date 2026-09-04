import { addDaysIso } from "./dates";
import { getStore } from "./store";
import { notifyReminder } from "./notifications";

/**
 * 翌日に開催される「確定」予約に対して、リマインドメールをまだ送っていなければ送信する。
 * Vercel Cron 等から毎日1回実行することを想定(/api/cron/reminders)。
 */
export async function sendDueReminders(now: Date = new Date()): Promise<number> {
  const targetDate = addDaysIso(now, 1);

  const store = getStore();
  const reservations = await store.listReservations({ date: targetDate, status: "confirmed" });
  let count = 0;
  for (const r of reservations) {
    if (r.reminderSentAt) continue;
    await notifyReminder(r);
    await store.updateReservation(r.id, { reminderSentAt: new Date().toISOString() });
    count++;
  }
  return count;
}
