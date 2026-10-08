import { describe, it, expect } from "vitest";
import { LessonLogic, PRESETS } from './logic.js';

describe('batch_norm_dynamics logic', () => {
  it("chuẩn hóa batch về mean xấp xỉ 0 và var xấp xỉ 1 ở training mode", () => {
    const logic = new LessonLogic();
    const res = logic.calculate();

    expect(res.meanB).toBe(5.0);
    expect(res.varB).toBe(5.0);
    expect(res.outMean).toBeCloseTo(0.0, 1);
    expect(res.outVar).toBeCloseTo(1.0, 1);
  });

  it("áp dụng tham số học gamma và beta chính xác", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[1].state); // gamma = 2, beta = 1

    expect(res.outMean).toBeCloseTo(1.0, 1);
    expect(res.outVar).toBeCloseTo(4.0, 1); // 2^2 = 4
  });

  it("ở inference mode, dùng running stats cố định thay vì stats của batch", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[2].state);

    expect(res.mode).toBe("inference");
    expect(res.testOutput).toBeCloseTo((4.0 - 5.0) / Math.sqrt(5.0), 2);
  });
});
