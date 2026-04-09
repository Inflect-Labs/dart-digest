import { describe, it, expect } from "vitest";
import { parseLast, getDateRange } from "../config.js";

describe("parseLast", () => {
  it("parses 'day' as 1", () => expect(parseLast("day")).toBe(1));
  it("parses '3d' as 3", () => expect(parseLast("3d")).toBe(3));
  it("parses 'week' as 7", () => expect(parseLast("week")).toBe(7));
  it("parses 'fortnight' as 14", () => expect(parseLast("fortnight")).toBe(14));
  it("parses 'month' as 30", () => expect(parseLast("month")).toBe(30));
  it("parses '10d' as 10", () => expect(parseLast("10d")).toBe(10));
});

describe("getDateRange", () => {
  it("returns provided since and until unchanged", () => {
    expect(getDateRange("2026-01-01", "2026-01-31")).toEqual({
      since: "2026-01-01",
      until: "2026-01-31",
    });
  });

  it("computes since from daysBack when not provided", () => {
    const range = getDateRange(undefined, "2026-04-09", 7);
    expect(range.since).toBe("2026-04-02");
    expect(range.until).toBe("2026-04-09");
  });

  it("defaults until to today", () => {
    const today = new Date().toISOString().slice(0, 10);
    const range = getDateRange(undefined, undefined, 7);
    expect(range.until).toBe(today);
  });
});
