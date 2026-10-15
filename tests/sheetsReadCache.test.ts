import { beforeEach, describe, expect, it, vi } from "vitest";

// googleapis をモックし、Sheets API の呼び出し回数を数える
const valuesGet = vi.fn();
const spreadsheetsGet = vi.fn();
const valuesClear = vi.fn();
const valuesUpdate = vi.fn();

vi.mock("googleapis", () => ({
  google: {
    auth: { JWT: class {} },
    sheets: () => ({
      spreadsheets: {
        get: spreadsheetsGet,
        batchUpdate: vi.fn(),
        values: { get: valuesGet, clear: valuesClear, update: valuesUpdate },
      },
    }),
  },
}));

process.env.GOOGLE_SHEET_ID = "test-sheet";

const { GoogleSheetsStore } = await import("@/lib/store/sheetsStore");

describe("GoogleSheetsStore の読み取り回数", () => {
  beforeEach(() => {
    valuesGet.mockReset();
    spreadsheetsGet.mockResolvedValue({
      data: { sheets: ["Reservations", "Waitlist", "BlackoutDates", "NoShowStrikes"].map((title) => ({ properties: { title } })) },
    });
    valuesGet.mockResolvedValue({ data: { values: [] } });
  });

  it("開放日一覧の表示のように同じタブを続けて読んでも、Sheets APIの読み取りは1回にまとめる", async () => {
    const store = new GoogleSheetsStore();
    await Promise.all(["2026-11-06", "2026-11-20", "2026-12-04", "2026-12-18"].map((date) => store.listReservations({ date })));
    await store.listReservations({ date: "2026-11-06" });
    expect(valuesGet).toHaveBeenCalledTimes(1);
  });

  it("予約の重複チェックは常に最新を読む", async () => {
    const store = new GoogleSheetsStore();
    await store.listReservations({ date: "2026-11-06" });
    const before = valuesGet.mock.calls.length;
    await store.countActiveReservations("2026-11-06", "16:00", "16:20");
    await store.countActiveReservations("2026-11-06", "16:00", "16:20");
    expect(valuesGet.mock.calls.length - before).toBe(2);
  });

  it("読み取りクォータ超過(429)は再試行して表示できる", async () => {
    valuesGet
      .mockRejectedValueOnce(Object.assign(new Error("Quota exceeded"), { status: 429 }))
      .mockResolvedValueOnce({ data: { values: [["RSV-1", "2026-11-20", "16:45", "17:00"]] } });
    const store = new GoogleSheetsStore();
    // 直前のテストのキャッシュを使わないよう、まだ読んでいない別タブで確認する
    const blackout = await store.listBlackoutDates();
    expect(blackout[0].date).toBe("RSV-1");
    expect(valuesGet).toHaveBeenCalledTimes(2);
  }, 10000);
});
