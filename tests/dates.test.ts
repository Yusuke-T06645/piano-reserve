import { describe, expect, it } from "vitest";
import { isEligibleOpenDate, isPastCutoff, hoursUntil, listUpcomingEligibleDates } from "@/lib/dates";

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

// 締切・空き状況の判定はJST(UTC+9)基準のルールだが、Vercel等の実行環境はUTCで動くことが多い。
// サーバーのタイムゾーン設定に関係なく、常にJST基準で正しく判定できることを保証する回帰テスト。
describe("isPastCutoff / hoursUntil (JSTタイムゾーン非依存)", () => {
  it("当日の枠がとっくに終わっている時刻(JST)では締切済みと判定する", () => {
    // 2026-09-04T13:05:00Z = JST 2026-09-04 22:05(当日16:00枠はとっくに終了済み)
    const now = new Date("2026-09-04T13:05:00Z");
    expect(isPastCutoff("2026-09-04", "16:00", now)).toBe(true);
    expect(hoursUntil("2026-09-04", "16:00", now)).toBeCloseTo(-6.083, 2);
  });

  it("翌日の枠は締切(3時間前)より十分前なら締切前と判定する", () => {
    // 2026-09-04T13:05:00Z = JST 2026-09-04 22:05。翌日16:00JSTの3時間前(13:00JST)までまだ十分ある
    const now = new Date("2026-09-04T13:05:00Z");
    expect(isPastCutoff("2026-09-05", "16:00", now)).toBe(false);
  });

  it("UTC日付をまたぐJST深夜0時台でも、当日として正しく判定する", () => {
    // 2026-09-04T15:30:00Z = JST 2026-09-05 00:30(UTC上はまだ9/4だが、JSTでは既に9/5)
    const now = new Date("2026-09-04T15:30:00Z");
    // 9/5 16:00JSTの締切(13:00JST)にはまだ十分手前
    expect(isPastCutoff("2026-09-05", "16:00", now)).toBe(false);
  });
});
