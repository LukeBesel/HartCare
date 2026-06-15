import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "@/lib/store";

describe("useStore", () => {
  beforeEach(() => {
    useStore.getState().resetDemo();
  });

  it("add returns an id and prepends the row", () => {
    const id = useStore.getState().add("goals", {
      profileId: "x",
      title: "t",
      category: "steps",
      target: 10,
      current: 0,
      unit: "steps",
    });
    expect(id).toBeTruthy();
    const goals = useStore.getState().db.goals;
    expect(goals[0].id).toBe(id);
    expect(goals[0].title).toBe("t");
  });

  it("update merges a patch", () => {
    const id = useStore.getState().add("goals", {
      profileId: "x",
      title: "t",
      category: "steps",
      target: 10,
      current: 0,
      unit: "steps",
    });
    useStore.getState().update("goals", id, { current: 5 });
    const row = useStore.getState().db.goals.find((g) => g.id === id);
    expect(row?.current).toBe(5);
    expect(row?.title).toBe("t");
  });

  it("remove deletes the row", () => {
    const id = useStore.getState().add("goals", {
      profileId: "x",
      title: "t",
      category: "steps",
      target: 10,
      current: 0,
      unit: "steps",
    });
    useStore.getState().remove("goals", id);
    expect(useStore.getState().db.goals.find((g) => g.id === id)).toBeUndefined();
  });

  it("setTier('free') sets the tier and disconnects HartHome", () => {
    useStore.getState().setTier("free");
    const sub = useStore.getState().db.subscription;
    expect(sub.tier).toBe("free");
    expect(sub.hartHomeConnected).toBe(false);
  });

  it("hydrate replaces a collection", () => {
    useStore.getState().hydrate({ goals: [] });
    expect(useStore.getState().db.goals).toEqual([]);
  });
});
