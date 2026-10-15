import { describe, expect, it } from "vitest";
import { parseCell } from "@/lib/store/sheetsStore";

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
