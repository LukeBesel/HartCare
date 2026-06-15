import { describe, it, expect } from "vitest";
import {
  todayISO,
  isoDaysAgo,
  isoDaysFromNow,
  sum,
  round,
  clamp,
} from "@/lib/utils";

describe("date helpers", () => {
  it("todayISO returns a YYYY-MM-DD shape", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("isoDaysAgo is before today, isoDaysFromNow is after", () => {
    const today = todayISO();
    expect(isoDaysAgo(3) < today).toBe(true);
    expect(isoDaysFromNow(3) > today).toBe(true);
    expect(isoDaysAgo(3) < isoDaysFromNow(3)).toBe(true);
  });
});

describe("math helpers", () => {
  it("sum adds numbers", () => {
    expect(sum([1, 2, 3])).toBe(6);
    expect(sum([])).toBe(0);
  });

  it("round respects decimal places", () => {
    expect(round(1.2345, 2)).toBe(1.23);
    expect(round(1.5)).toBe(2);
  });

  it("clamp bounds a value", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});
