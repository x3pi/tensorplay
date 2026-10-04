import { describe, it, expect } from "vitest";
import { LessonLogic, PRESETS } from "./bai_05_reverse_vs_forward_ad.logic.js";

describe("bai_05_reverse_vs_forward_ad logic", () => {
  it("với M = 1 (Deep Learning), Reverse-mode vượt trội gấp hàng nghìn lần", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[0].state); // N = 10,000, M = 1

    expect(res.forwardPasses).toBe(10000);
    expect(res.reversePasses).toBe(1);
    expect(res.speedup).toBeGreaterThan(5000);
  });

  it("với Robot Kinematics (N = 6, M = 6), hai chế độ có chi phí tương đương", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[2].state); // N = 6, M = 6

    expect(res.forwardPasses).toBe(6);
    expect(res.reversePasses).toBe(6);
    expect(res.speedup).toBeCloseTo(0.9, 0);
  });

  it("đạo hàm giải tích đúng cho hàm mini f = x1*x2 + x2*x3", () => {
    const logic = new LessonLogic();
    const res = logic.calculate();

    // x1=2, x2=3, x3=4
    // f = 2*3 + 3*4 = 6 + 12 = 18
    expect(res.fVal).toBe(18);
    expect(res.df_dx1).toBe(3);
    expect(res.df_dx2).toBe(6);
    expect(res.df_dx3).toBe(3);
  });
});
