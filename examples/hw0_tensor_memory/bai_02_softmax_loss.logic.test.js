import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS } from './bai_02_softmax_loss.logic.js';

describe('examples/hw0_tensor_memory/bai_02_softmax_loss.logic.js', () => {
  it('Tính toán Softmax bình thường chính xác với logits nhỏ', () => {
    const logic = new LessonLogic();
    const res = logic.calculate();
    expect(res.p0).toBeCloseTo(0.731, 2);
    expect(res.p1).toBeCloseTo(0.269, 2);
    expect(res.loss).toBeCloseTo(0.313, 2);
    expect(res.isOverflow).toBe(false);
  });

  it('Logits lớn = 1000 gây tràn số NaN khi không bật Safe Mode', () => {
    const logic = new LessonLogic();
    const preset = PRESETS.find(p => p.id === 'headlight_glare');
    const res = logic.applyPreset(preset.state);
    expect(res.isOverflow).toBe(true);
    expect(isNaN(res.p0)).toBe(true);
    expect(isNaN(res.loss)).toBe(true);
  });

  it('Safe Softmax trung hòa số mũ lớn về [0.5, 0.5] hoàn hảo không NaN', () => {
    const logic = new LessonLogic();
    const preset = PRESETS.find(p => p.id === 'safe_glare');
    const res = logic.applyPreset(preset.state);
    expect(res.isOverflow).toBe(false);
    expect(res.p0).toBe(0.5);
    expect(res.p1).toBe(0.5);
    expect(res.loss).toBeCloseTo(0.693, 2); // -log(0.5) = ln(2) approx 0.693
  });

  it('Khoảng cách 10 đơn vị ở mức 1000 vẫn phân biệt độ tin cậy tuyệt đối', () => {
    const logic = new LessonLogic();
    const preset = PRESETS.find(p => p.id === 'large_gap');
    const res = logic.applyPreset(preset.state);
    expect(res.p0).toBeGreaterThan(0.999);
    expect(res.p1).toBeLessThan(0.001);
  });
});
