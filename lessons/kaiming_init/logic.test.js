import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, layerGain, energyProfile, classify } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/kaiming_init/logic.js', () => {
  it('Hệ số mỗi tầng với n = 4, ReLU: 0.02 / 0.5 / 1 / 2', () => {
    expect(layerGain(4, 0.01, 'relu')).toBeCloseTo(0.02, 12);
    expect(layerGain(4, 0.25, 'relu')).toBe(0.5);
    expect(layerGain(4, 0.5, 'relu')).toBe(1);
    expect(layerGain(4, 1, 'relu')).toBe(2);
  });

  it('Kaiming + ReLU, 10 tầng: năng lượng giữ nguyên 1', () => {
    const r = new LessonLogic().calculate();
    expect(r.finalEnergy).toBe(1);
    expect(r.status).toBe('healthy');
    expect(r.verdict.type).toBe('success');
  });

  it('Xavier + ReLU, 10 tầng: 0.5^10 ≈ 0.000977 < 1e-3 → tiêu biến', () => {
    const r = new LessonLogic().applyPreset(pick('xavier_relu'));
    expect(r.finalEnergy).toBeCloseTo(0.0009765625, 12);
    expect(r.status).toBe('vanishing');
    expect(r.firstBadLayer).toBe(10);
  });

  it('σ² = 1 + ReLU, 10 tầng: 2^10 = 1024 > 1e3 → bùng nổ', () => {
    const r = new LessonLogic().applyPreset(pick('big_relu'));
    expect(r.finalEnergy).toBe(1024);
    expect(r.status).toBe('exploding');
  });

  it('Xavier + tuyến tính cũng cân bằng (g = 1)', () => {
    const r = new LessonLogic().applyPreset(pick('xavier_linear'));
    expect(r.gain).toBe(1);
    expect(r.status).toBe('healthy');
  });

  it('Mạng nông (3 tầng) với Xavier + ReLU vẫn tạm ổn → warning', () => {
    const r = new LessonLogic().applyPreset({ ...pick('xavier_relu'), depth: 3 });
    expect(r.finalEnergy).toBe(0.125);
    expect(r.verdict.type).toBe('warning');
  });

  it('energyProfile và classify', () => {
    expect(energyProfile(2, 3)).toEqual([1, 2, 4, 8]);
    expect(classify(1e-4)).toBe('vanishing');
    expect(classify(1e4)).toBe('exploding');
    expect(classify(1)).toBe('healthy');
  });
});
