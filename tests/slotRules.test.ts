import { describe, expect, it } from "vitest";
import { isEligibleOpenDate, listUpcomingEligibleDates } from "@/lib/dates";
import { freeMinutesInDay } from "@/lib/availability";
import { reservationFormSchema } from "@/lib/validation";
import { maxGroupsPerDay } from "@/lib/config";

describe("開放日から除外する日(config.excludedDates)", () => {
  it("2027年1月1日(第1金曜)は開放日として扱わない", () => {
    expect(isEligibleOpenDate("2027-01-01")).toBe(false);
  });

  it("開放日一覧にも表示しない", () => {
    const dates = listUpcomingEligibleDates(new Date("2026-10-15T00:00:00Z"));
    expect(dates).toContain("2026-12-18");
    expect(dates).not.toContain("2027-01-01");
  });

  it("11月・12月の開放日はそのまま開放日である", () => {
    for (const d of ["2026-11-06", "2026-11-20", "2026-12-04", "2026-12-18"]) {
      expect(isEligibleOpenDate(d)).toBe(true);
    }
  });
});

describe("20分×1日3組の時間枠", () => {
  const base = {
    date: "2026-11-06",
    name: "テスト太郎",
    email: "test@example.com",
    ageCategory: "adult" as const,
    agreedToTerms: true as const,
    agreedToNoise: true as const,
  };
  const valid = (slotStart: string, slotEnd: string) =>
    reservationFormSchema.safeParse({ ...base, slotStart, slotEnd }).success;

  it("1日の最大組数は3組", () => {
    expect(maxGroupsPerDay()).toBe(3);
  });

  it("①②③の時間枠は予約できる", () => {
    expect(valid("16:00", "16:20")).toBe(true);
    expect(valid("16:20", "16:40")).toBe(true);
    expect(valid("16:40", "17:00")).toBe(true);
  });

  it("枠をまたぐ時間・20分を超える時間・5分だけの予約はできない", () => {
    expect(valid("16:10", "16:30")).toBe(false);
    expect(valid("16:00", "16:40")).toBe(false);
    expect(valid("16:40", "16:45")).toBe(false);
  });

  it("予約がない日は3枠(60分)すべて空いている", () => {
    expect(
      freeMinutesInDay({ openTime: "16:00", closeTime: "17:00", granularityMinutes: 20, busyRanges: [] })
    ).toBe(60);
  });

  it("16:45〜17:00 の既存予約がある日は ③ が埋まり、①② の2枠(40分)だけ空いている", () => {
    expect(
      freeMinutesInDay({
        openTime: "16:00",
        closeTime: "17:00",
        granularityMinutes: 20,
        busyRanges: [{ start: "16:45", end: "17:00", kind: "reserved" }],
      })
    ).toBe(40);
  });
});
