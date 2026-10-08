import { describe, it, expect } from "vitest";
import { LessonLogic, PRESETS } from './logic.js';

describe('self_attention logic', () => {
  it("Causal Mask triệt tiêu hoàn toàn sự chú ý tới tương lai (trọng số = 0.0)", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[0].state); // GPT causal

    expect(res.isStrictlyCausal).toBe(true);
    // Token 0 ("Deep") không thể nhìn thấy token 1 và token 2
    expect(res.attentionMatrix[0][1]).toBe(0.0);
    expect(res.attentionMatrix[0][2]).toBe(0.0);
    expect(res.attentionMatrix[0][0]).toBe(1.0);

    // Token 1 ("Learning") không thể nhìn thấy token 2
    expect(res.attentionMatrix[1][2]).toBe(0.0);
  });

  it("chế độ BERT song hướng cho phép nhìn thấy cả tương lai", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[1].state); // BERT bidirectional

    expect(res.isStrictlyCausal).toBe(false);
    expect(res.attentionMatrix[0][1]).toBeGreaterThan(0.0);
    expect(res.attentionMatrix[0][2]).toBeGreaterThan(0.0);
  });

  it("mọi hàng trong ma trận Attention đều có tổng xác suất bằng 1.0", () => {
    const logic = new LessonLogic();
    const res = logic.calculate();

    res.attentionMatrix.forEach(row => {
      const sum = row.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 1);
    });
  });
});
