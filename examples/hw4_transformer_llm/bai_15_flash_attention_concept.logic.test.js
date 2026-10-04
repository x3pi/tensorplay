import { describe, it, expect } from "vitest";
import { LessonLogic, PRESETS } from "./bai_15_flash_attention_concept.logic.js";

describe("bai_15_flash_attention_concept logic", () => {
  it("lưu lượng HBM của FlashAttention tỷ lệ tuyến tính O(N) thay vì O(N^2)", () => {
    const logic = new LessonLogic();
    const r8 = logic.applyPreset(PRESETS[0].state); // N = 8
    const r32 = logic.applyPreset(PRESETS[1].state); // N = 32

    // Với FlashAttention: tỷ lệ tăng là 32 / 8 = 4 lần
    expect(r32.flashHbmBytes / r8.flashHbmBytes).toBe(4);

    // Với Standard Attention: tỷ lệ tăng là (32/8)^2 = 16 lần!
    expect(r32.standardHbmBytes / r8.standardHbmBytes).toBe(16);
  });

  it("thuật toán Online Softmax cập nhật chính xác running max và running sum", () => {
    const logic = new LessonLogic();
    const res = logic.calculate();

    expect(res.onlineSoftmax.m1).toBe(4.0);
    expect(res.onlineSoftmax.m_new).toBe(5.0);
    expect(res.onlineSoftmax.alpha).toBeCloseTo(0.368, 2);
    expect(res.onlineSoftmax.l_new).toBeCloseTo(1.553, 2);
  });
});
