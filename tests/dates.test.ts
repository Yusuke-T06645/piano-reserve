import { describe, expect, it } from "vitest";
import { isEligibleOpenDate, listUpcomingEligibleDates } from "@/lib/dates";

describe("isEligibleOpenDate", () => {
  it("第1金曜日を開放日と判定する", () => {
    // 2026年9月の第1金曜日は9/4
    expect(isEligibleOpenDate("2026-09-04")).toBe(true);
  });

  it("第3金曜日を開放日と判定する", () => {
    // 2026年9月の第3金曜日は9/18
    expect(isEligibleOpenDate("2026-09-18")).toBe(true);
  });

  it("第2・第4金曜日は開放日ではない", () => {
    expect(isEligibleOpenDate("2026-09-11")).toBe(false);
    expect(isEligibleOpenDate("2026-09-25")).toBe(false);
  });

  it("金曜日以外は開放日ではない", () => {
    expect(isEligibleOpenDate("2026-09-05")).toBe(false); // 土曜日
  });
});

describe("listUpcomingEligibleDates", () => {
  it("開放日はすべて金曜日である", () => {
    const dates = listUpcomingEligibleDates(new Date(2026, 8, 1));
    expect(dates.length).toBeGreaterThan(0);
    for (const d of dates) {
      expect(isEligibleOpenDate(d)).toBe(true);
    }
  });
});
