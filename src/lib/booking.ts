import { config, generateDaySlots } from "./config";
import { isDateBookable } from "./availability";
import { hoursUntil, isPastCutoff, monthKey } from "./dates";
import { getStore } from "./store";
import type { Reservation } from "./store/types";
import {
  notifyCancelled,
  notifyRescheduled,
  notifyReservationConfirmed,
  notifyWaitlistJoined,
  notifyWaitlistPromoted,
} from "./notifications";
import type { ReservationFormInput } from "./validation";

export class BookingError extends Error {
  constructor(
    message: string,
    public code:
      | "DATE_NOT_BOOKABLE"
      | "PAST_CUTOFF"
      | "MONTHLY_LIMIT"
      | "PENALTY_ACTIVE"
      | "SLOT_FULL"
      | "NOT_FOUND"
      | "ALREADY_PROCESSED"
      | "CHANGE_WINDOW_CLOSED"
  ) {
    super(message);
  }
}

/** 「1人あたり月1回まで」等の予約上限と、無断キャンセルによる利用制限をチェックする */
export async function assertCanBook(email: string, date: string): Promise<void> {
  const store = getStore();

  const penaltyUntil = await store.getLatestPenaltyUntil(email);
  if (penaltyUntil && new Date(penaltyUntil).getTime() > Date.now()) {
    throw new BookingError(
      `無断キャンセルが続いたため、${new Date(penaltyUntil).toLocaleDateString("ja-JP")}まで新規のご予約を制限させていただいております。`,
      "PENALTY_ACTIVE"
    );
  }

  const monthlyCount = await store.countMonthlyReservationsByEmail(email, monthKey(date));
  if (monthlyCount >= config.monthlyBookingLimitPerEmail) {
    throw new BookingError(
      `お一人様、月${config.monthlyBookingLimitPerEmail}回までのご利用となっております。`,
      "MONTHLY_LIMIT"
    );
  }
}

export type CreateReservationParams = Omit<ReservationFormInput, "joinWaitlistIfFull">;

function resolveSlotEnd(slotStart: string): string {
  const slot = generateDaySlots().find((s) => s.start === slotStart);
  if (!slot) throw new BookingError("指定された時間枠が見つかりません。", "DATE_NOT_BOOKABLE");
  return slot.end;
}

export async function createReservation(
  input: CreateReservationParams
): Promise<{ reservation: Reservation } | { waitlisted: true }> {
  const store = getStore();

  if (!(await isDateBookable(input.date))) {
    throw new BookingError("この日は開放日ではありません。", "DATE_NOT_BOOKABLE");
  }
  if (isPastCutoff(input.date, input.slotStart)) {
    throw new BookingError("この枠は受付を締め切りました。", "PAST_CUTOFF");
  }

  await assertCanBook(input.email, input.date);

  return store.withSlotLock(input.date, input.slotStart, async () => {
    const activeCount = await store.countActiveReservations(input.date, input.slotStart);
    if (activeCount >= config.capacityPerSlot) {
      throw new BookingError("この枠は満席です。", "SLOT_FULL");
    }
    const reservation = await store.createReservation({
      date: input.date,
      slotStart: input.slotStart,
      slotEnd: resolveSlotEnd(input.slotStart),
      name: input.name,
      email: input.email,
      phone: input.phone,
      ageCategory: input.ageCategory,
      guardianName: input.guardianName,
      notes: input.notes,
      agreedToTerms: true,
      agreedToNoise: true,
    });
    await notifyReservationConfirmed(reservation);
    return { reservation };
  });
}

export async function joinWaitlist(input: CreateReservationParams) {
  const store = getStore();
  const entry = await store.addWaitlistEntry({
    date: input.date,
    slotStart: input.slotStart,
    slotEnd: resolveSlotEnd(input.slotStart),
    name: input.name,
    email: input.email,
    phone: input.phone,
    ageCategory: input.ageCategory,
    guardianName: input.guardianName,
  });
  await notifyWaitlistJoined(entry);
  return entry;
}

/** 利用者本人 or 管理者によるキャンセル。空きが出た場合はキャンセル待ちの先頭を自動繰り上げする。 */
export async function cancelReservation(reservationId: string, by: "user" | "admin") {
  const store = getStore();
  const reservation = await store.getReservation(reservationId);
  if (!reservation) throw new BookingError("予約が見つかりません。", "NOT_FOUND");
  if (reservation.status === "cancelled") throw new BookingError("既にキャンセル済みです。", "ALREADY_PROCESSED");
  if (reservation.status === "attended")
    throw new BookingError("チェックイン済みの予約はキャンセルできません。", "ALREADY_PROCESSED");

  const updated = await store.updateReservation(reservationId, {
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    cancelledBy: by,
  });
  await notifyCancelled(updated);
  await promoteWaitlistIfAny(updated.date, updated.slotStart, updated.slotEnd);
  return updated;
}

/**
 * 利用者本人によるセルフサービスの日時変更。
 * 変更期限(config.selfServiceChangeDeadlineHours)を過ぎている場合はWeb上での変更を受け付けず、
 * キャンセルのみ案内する(要件: キャンセル・予約変更手続き)。
 */
export async function rescheduleReservation(
  reservationId: string,
  newDate: string,
  newSlotStart: string
): Promise<Reservation> {
  const store = getStore();
  const reservation = await store.getReservation(reservationId);
  if (!reservation) throw new BookingError("予約が見つかりません。", "NOT_FOUND");
  if (reservation.status !== "confirmed") {
    throw new BookingError("この予約は変更できない状態です。", "ALREADY_PROCESSED");
  }
  if (hoursUntil(reservation.date, reservation.slotStart) < config.selfServiceChangeDeadlineHours) {
    throw new BookingError(
      `ご利用${config.selfServiceChangeDeadlineHours}時間前を過ぎているため、Web上での日時変更はできません。恐れ入りますが${config.supportEmail}までご連絡ください。`,
      "CHANGE_WINDOW_CLOSED"
    );
  }
  if (!(await isDateBookable(newDate))) {
    throw new BookingError("変更先の日は開放日ではありません。", "DATE_NOT_BOOKABLE");
  }
  if (isPastCutoff(newDate, newSlotStart)) {
    throw new BookingError("変更先の枠は受付を締め切りました。", "PAST_CUTOFF");
  }

  return store.withSlotLock(newDate, newSlotStart, async () => {
    const activeCount = await store.countActiveReservations(newDate, newSlotStart);
    const isSameSlot = newDate === reservation.date && newSlotStart === reservation.slotStart;
    if (!isSameSlot && activeCount >= config.capacityPerSlot) {
      throw new BookingError("変更先の枠は満席です。", "SLOT_FULL");
    }
    const updated = await store.updateReservation(reservationId, {
      date: newDate,
      slotStart: newSlotStart,
      slotEnd: resolveSlotEnd(newSlotStart),
    });
    await notifyRescheduled(updated);
    if (!isSameSlot) {
      await promoteWaitlistIfAny(reservation.date, reservation.slotStart, reservation.slotEnd);
    }
    return updated;
  });
}

async function promoteWaitlistIfAny(date: string, slotStart: string, slotEnd: string) {
  const store = getStore();
  return store.withSlotLock(date, slotStart, async () => {
    const activeCount = await store.countActiveReservations(date, slotStart);
    if (activeCount >= config.capacityPerSlot) return; // 既に埋まっている
    const waitlist = await store.listWaitlist(date, slotStart);
    const next = waitlist[0];
    if (!next) return;
    const reservation = await store.createReservation({
      date,
      slotStart,
      slotEnd,
      name: next.name,
      email: next.email,
      phone: next.phone,
      ageCategory: next.ageCategory,
      guardianName: next.guardianName,
      agreedToTerms: true,
      agreedToNoise: true,
    });
    await store.markWaitlistPromoted(next.id, reservation.id);
    await notifyWaitlistPromoted(reservation);
  });
}
