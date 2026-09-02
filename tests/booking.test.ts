import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// LocalJsonStoreはモジュール内で `process.env.LOCAL_DB_PATH` を読むため、
// テスト用の一時ファイルを指定してから動的importする(本番データに影響を与えないため)。
const tmpDbPath = path.join(os.tmpdir(), `piano-reserve-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
process.env.LOCAL_DB_PATH = tmpDbPath;
process.env.RESEND_API_KEY = ""; // ConsoleMailer(モック送信)を使う
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

let createReservation: typeof import("../src/lib/booking").createReservation;
let cancelReservation: typeof import("../src/lib/booking").cancelReservation;
let joinWaitlist: typeof import("../src/lib/booking").joinWaitlist;
let BookingError: typeof import("../src/lib/booking").BookingError;
let getStore: typeof import("../src/lib/store").getStore;

beforeAll(async () => {
  const booking = await import("../src/lib/booking");
  createReservation = booking.createReservation;
  cancelReservation = booking.cancelReservation;
  joinWaitlist = booking.joinWaitlist;
  BookingError = booking.BookingError;
  const storeModule = await import("../src/lib/store");
  getStore = storeModule.getStore;
});

afterAll(() => {
  fs.rmSync(tmpDbPath, { force: true });
});

// 直近の開放日(第1・第3金曜)を取得するヘルパー
async function anyEligibleFutureDate(): Promise<string> {
  const { listUpcomingEligibleDates } = await import("../src/lib/dates");
  const dates = listUpcomingEligibleDates();
  return dates[0];
}

const baseInput = (overrides: Partial<Record<string, string | boolean | undefined>> = {}) => ({
  date: "",
  slotStart: "16:00",
  name: "テスト太郎",
  email: "test@example.com",
  phone: undefined,
  ageCategory: "adult" as const,
  guardianName: undefined,
  notes: undefined,
  agreedToTerms: true as const,
  agreedToNoise: true as const,
  ...overrides,
});

describe("createReservation", () => {
  it("同じ枠への同時リクエストは1件しか成功しない(二重予約防止)", async () => {
    const date = await anyEligibleFutureDate();
    const attempts = Array.from({ length: 5 }).map((_, i) =>
      createReservation(
        baseInput({ date, slotStart: "16:10", email: `concurrent${i}@example.com` })
      ).catch((e) => e)
    );
    const results = await Promise.all(attempts);
    const succeeded = results.filter((r) => r && "reservation" in r);
    const failed = results.filter((r) => r instanceof BookingError && r.code === "SLOT_FULL");
    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(4);
  });

  it("月の予約上限を超えるとエラーになる", async () => {
    const date = await anyEligibleFutureDate();
    const email = "monthly-limit@example.com";
    await createReservation(baseInput({ date, slotStart: "16:20", email }));

    await expect(
      createReservation(baseInput({ date, slotStart: "16:30", email }))
    ).rejects.toMatchObject({ code: "MONTHLY_LIMIT" });
  });

  it("満席の枠はキャンセル待ちに登録できる", async () => {
    const date = await anyEligibleFutureDate();
    await createReservation(baseInput({ date, slotStart: "16:40", email: "first@example.com" }));
    const entry = await joinWaitlist(baseInput({ date, slotStart: "16:40", email: "waiter@example.com" }));
    expect(entry.email).toBe("waiter@example.com");
  });
});

describe("cancelReservation とキャンセル待ちの自動繰り上げ", () => {
  it("キャンセルすると次のキャンセル待ちが自動的に繰り上がる", async () => {
    const date = await anyEligibleFutureDate();
    const slotStart = "16:50";
    const created = await createReservation(baseInput({ date, slotStart, email: "occupant@example.com" }));
    if (!("reservation" in created)) throw new Error("expected a reservation, got waitlisted");
    const { reservation } = created;
    const waitlisted = await joinWaitlist(baseInput({ date, slotStart, email: "next-in-line@example.com" }));

    await cancelReservation(reservation.id, "user");

    const store = getStore();
    const all = await store.listReservations({ date });
    const promoted = all.find((r) => r.email === "next-in-line@example.com");
    expect(promoted).toBeTruthy();
    expect(promoted?.status).toBe("confirmed");

    const waitlist = await store.listWaitlist(date, slotStart);
    expect(waitlist.find((w) => w.id === waitlisted.id)).toBeUndefined();
  });
});
