import { describe, expect, it } from "vitest";
import { parseCell, withSheetsRetry } from "@/lib/store/sheetsStore";

describe("parseCell", () => {
  it("真偽値の文字列を大文字小文字を問わず boolean に戻す", () => {
    expect(parseCell("TRUE")).toBe(true);
    expect(parseCell("FALSE")).toBe(false);
    expect(parseCell("true")).toBe(true);
    expect(parseCell("false")).toBe(false);
  });

  it("真偽値以外はそのまま返す", () => {
    expect(parseCell("RSV-1234")).toBe("RSV-1234");
    expect(parseCell("2026-10-14")).toBe("2026-10-14");
  });
});

describe("withSheetsRetry", () => {
  it("読み取りクォータ超過(429)は再試行して成功させる", async () => {
    let calls = 0;
    const result = await withSheetsRetry(async () => {
      calls++;
      if (calls < 3) throw Object.assign(new Error("Quota exceeded"), { status: 429 });
      return "ok";
    }, [1, 1, 1]);
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  it("再試行しても失敗し続ける場合はエラーを返す", async () => {
    let calls = 0;
    await expect(
      withSheetsRetry(async () => {
        calls++;
        throw Object.assign(new Error("Backend Error"), { response: { status: 503 } });
      }, [1, 1])
    ).rejects.toThrow("Backend Error");
    expect(calls).toBe(3);
  });

  it("権限エラー等(403)は再試行しない", async () => {
    let calls = 0;
    await expect(
      withSheetsRetry(async () => {
        calls++;
        throw Object.assign(new Error("Forbidden"), { code: 403 });
      }, [1, 1])
    ).rejects.toThrow("Forbidden");
    expect(calls).toBe(1);
  });
});
