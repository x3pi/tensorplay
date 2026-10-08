import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS } from './logic.js';

describe('lessons/softmax_stability/logic.js', () => {
  it('Tính toán Softmax bình thường chính xác với logits nhỏ và T=1.0', () => {
    const logic = new LessonLogic();
    const res = logic.calculate();
    expect(res.p0).toBeCloseTo(0.731, 2);
    expect(res.p1).toBeCloseTo(0.269, 2);
    expect(res.isOverflow).toBe(false);
  });

  it('Nhiệt độ thấp T=0.2 (Cold) biến Softmax thành ArgMax quyết đoán gần như 100%', () => {
    const logic = new LessonLogic();
    const preset = PRESETS.find(p => p.id === 'cold_temp');
    const res = logic.applyPreset(preset.state);
    expect(res.p0).toBeGreaterThan(0.99);
    expect(res.p1).toBeLessThan(0.01);
  });

  it('Nhiệt độ cao T=5.0 (Hot) san phẳng phân phối xác suất về xấp xỉ 50% - 50%', () => {
    const logic = new LessonLogic();
    const preset = PRESETS.find(p => p.id === 'hot_temp');
    const res = logic.applyPreset(preset.state);
    expect(Math.abs(res.p0 - res.p1)).toBeLessThan(0.12);
  });

  it('Logits lớn = 1000 gây tràn số NaN khi không bật Safe Mode', () => {
    const logic = new LessonLogic();
    const preset = PRESETS.find(p => p.id === 'headlight_glare');
    const res = logic.applyPreset(preset.state);
    expect(res.isOverflow).toBe(true);
    expect(isNaN(res.p0)).toBe(true);
  });

  it('Safe Softmax trung hòa số mũ lớn về [0.5, 0.5] hoàn hảo không NaN', () => {
    const logic = new LessonLogic();
    const preset = PRESETS.find(p => p.id === 'safe_glare');
    const res = logic.applyPreset(preset.state);
    expect(res.isOverflow).toBe(false);
    expect(res.p0).toBe(0.5);
    expect(res.p1).toBe(0.5);
  });

  it('Khoảng cách 10 đơn vị ở mức 1000 vẫn phân biệt độ tin cậy tuyệt đối', () => {
    const logic = new LessonLogic();
    const preset = PRESETS.find(p => p.id === 'large_gap');
    const res = logic.applyPreset(preset.state);
    expect(res.p0).toBeGreaterThan(0.999);
    expect(res.p1).toBeLessThan(0.001);
  });
});
