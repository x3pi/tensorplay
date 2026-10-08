import { describe, it, expect } from "vitest";
import { LessonLogic, PRESETS } from "./bai_06_activation_valves.logic.js";

describe("bai_06_activation_valves logic", () => {
  it("van ReLU mở khi z > 0 (output = z, grad = 1)", () => {
    const logic = new LessonLogic();
    const res = logic.onUserUpdate({ z: 2.5 });
    expect(res.isValveOpen).toBe(true);
    expect(res.reluOut).toBe(2.5);
    expect(res.reluGrad).toBe(1.0);
  });

  it("van ReLU đóng sập khi z <= 0 (output = 0, grad = 0, chặn gradient)", () => {
    const logic = new LessonLogic();
    const res = logic.onUserUpdate({ z: -1.5 });
    expect(res.isValveOpen).toBe(false);
    expect(res.reluOut).toBe(0.0);
    expect(res.reluGrad).toBe(0.0);
  });

  it("khởi tạo W = 0 dẫn tới đối xứng hoàn toàn giữa 2 nơ-ron", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[0].state);
    expect(res.isSymmetric).toBe(true);
    expect(res.w1).toBe(res.w2);
    expect(res.gradW1).toBe(res.gradW2);

    // Cập nhật SGD vẫn không phá vỡ được đối xứng
    const stepRes = logic.stepSGD();
    expect(stepRes.isSymmetric).toBe(true);
    expect(stepRes.w1).toBe(stepRes.w2);
  });

  it("khởi tạo ngẫu nhiên phá vỡ đối xứng", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[1].state);
    expect(res.isSymmetric).toBe(false);
    expect(res.w1).not.toBe(res.w2);
  });
});
