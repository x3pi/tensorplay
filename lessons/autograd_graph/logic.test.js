import { describe, it, expect } from "vitest";
import { LessonLogic, PRESETS } from './logic.js';

describe('autograd_graph logic', () => {
  it("tính toán chính xác Forward Pass và MSE Loss", () => {
    const logic = new LessonLogic();
    const res = logic.calculate();

    // x = 2.0, w = 1.5, b = 0.5 => p = 3.0, z = 3.5
    // y = 4.0 => diff = 3.5 - 4.0 = -0.5
    // loss = 0.5 * (-0.5)^2 = 0.125
    expect(res.p).toBe(3.0);
    expect(res.z).toBe(3.5);
    expect(res.diff).toBe(-0.5);
    expect(res.loss).toBe(0.125);
  });

  it("tính toán chính xác Backward Pass Adjoint gradients", () => {
    const logic = new LessonLogic();
    const res = logic.calculate();

    // dL/dz = diff = -0.5
    // dL/dw = dL/dz * x = -0.5 * 2.0 = -1.0
    // dL/db = dL/dz * 1.0 = -0.5
    // dL/dx = dL/dz * w = -0.5 * 1.5 = -0.75
    expect(res.gradZ).toBe(-0.5);
    expect(res.gradW).toBe(-1.0);
    expect(res.gradB).toBe(-0.5);
    expect(res.gradX).toBe(-0.75);
  });

  it("preset dự đoán chuẩn có Loss = 0 và Gradient = 0", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[1].state);
    expect(res.loss).toBe(0);
    expect(res.gradW).toBe(0);
    expect(res.gradB).toBe(0);
  });

  it("cập nhật Gradient Descent làm giảm Loss", () => {
    const logic = new LessonLogic();
    const res = logic.calculate();
    expect(res.lossReduced).toBe(true);
    expect(res.lossNew).toBeLessThan(res.loss);
  });
});
