import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpDbPath = path.join(os.tmpdir(), `piano-reserve-test-noshow-${Date.now()}.json`);
process.env.LOCAL_DB_PATH = tmpDbPath;
process.env.RESEND_API_KEY = "";
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

let getStore: typeof import("../src/lib/store").getStore;
let assertCanBook: typeof import("../src/lib/booking").assertCanBook;

beforeAll(async () => {
  getStore = (await import("../src/lib/store")).getStore;
  const booking = await import("../src/lib/booking");
  assertCanBook = booking.assertCanBook;
});

afterAll(() => {
  fs.rmSync(tmpDbPath, { force: true });
});

describe("ノーショー(無断キャンセル)のペナルティ", () => {
  it("設定回数未満のノーショーでは予約を制限しない", async () => {
    const store = getStore();
    const email = "one-strike@example.com";
    await store.addNoShowStrike({ email, reservationId: "RSV-TEST1", date: "2026-09-04" });
    await expect(assertCanBook(email, "2026-10-02")).resolves.toBeUndefined();
  });

  it("設定回数(既定2回)に達すると一定期間予約できなくなる", async () => {
    const store = getStore();
    const email = "two-strikes@example.com";
    await store.addNoShowStrike({ email, reservationId: "RSV-TEST2", date: "2026-09-04" });
    await store.addNoShowStrike({ email, reservationId: "RSV-TEST3", date: "2026-09-18" });

    await expect(assertCanBook(email, "2026-10-02")).rejects.toMatchObject({ code: "PENALTY_ACTIVE" });
  });
});
