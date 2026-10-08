import { describe, it, expect } from "vitest";
import { LessonLogic, PRESETS } from './logic.js';

describe('conv2d_im2col logic', () => {
  it("ma trận Im2col mở cuộn chính xác 4 patch từ ảnh 3x3", () => {
    const logic = new LessonLogic();
    const res = logic.calculate();

    // Image:
    // [1, 2, 0]
    // [0, 1, 1]
    // [2, 0, 1]
    // Patch 0 (top-left): [1, 2, 0, 1]
    // Patch 1 (top-right): [2, 0, 1, 1]
    // Patch 2 (bottom-left): [0, 1, 2, 0]
    // Patch 3 (bottom-right): [1, 1, 0, 1]
    expect(res.im2colMatrix[0]).toEqual([1, 2, 0, 1]);
    expect(res.im2colMatrix[1]).toEqual([2, 0, 1, 1]);
    expect(res.im2colMatrix[2]).toEqual([0, 1, 2, 0]);
    expect(res.im2colMatrix[3]).toEqual([1, 1, 0, 1]);
  });

  it("kết quả nhân ma trận Im2col * W khớp 100% với Conv2D tích chập truyền thống", () => {
    const logic = new LessonLogic();
    const res = logic.calculate();

    expect(res.isGemmExactMatch).toBe(true);
    // Với kernel [1, 0, 0, 1]:
    // p0: 1*1 + 2*0 + 0*0 + 1*1 = 2
    // p1: 2*1 + 0*0 + 1*0 + 1*1 = 3
    // p2: 0*1 + 1*0 + 2*0 + 0*1 = 0
    // p3: 1*1 + 1*0 + 0*0 + 1*1 = 2
    expect(res.gemmOutputs).toEqual([2, 3, 0, 2]);
    expect(res.directConvOutputs).toEqual([2, 3, 0, 2]);
  });

  it("kiểm thử preset cạnh ngang (Sobel Mini)", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[1].state);
    expect(res.isGemmExactMatch).toBe(true);
  });
});
