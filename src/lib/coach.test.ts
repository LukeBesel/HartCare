import { describe, it, expect } from "vitest";
import { coachReply } from "@/lib/coach";

describe("coachReply", () => {
  it("returns a plan for a workout request", () => {
    expect(coachReply("Build me a workout plan").toLowerCase()).toContain("plan");
  });

  it("mentions oz for a hydration request", () => {
    expect(coachReply("What should my water intake be?").toLowerCase()).toContain("oz");
  });

  it("includes the wellness disclaimer for an unknown message", () => {
    expect(coachReply("hello there").toLowerCase()).toContain("not medical advice");
  });
});
