import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, runOptimization, loss, gradient, START_POINT } from './optimizers.logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('examples/hw2_modules_conv/optimizers.logic.js', () => {
  it('Tọa độ xuất phát và giá trị loss ban đầu', () => {
    expect(START_POINT).toEqual([-4, 1]);
    expect(loss(START_POINT)).toBe(3.6);
    expect(gradient(START_POINT)).toEqual([-0.8, 4]);
  });

  it('SGD 1 bước với lr=0.1: p1 = [-3.92, 0.6], loss = 2.25664', () => {
    const res = runOptimization({ optimizer: 'sgd', lr: 0.1, steps: 1 });
    expect(res.finalP[0]).toBeCloseTo(-3.92, 4);
    expect(res.finalP[1]).toBeCloseTo(0.6, 4);
    expect(res.finalLoss).toBeCloseTo(2.25664, 4);
  });

  it('SGD sau 40 bước tiến chậm, loss khoảng 0.3178', () => {
    const res = runOptimization({ optimizer: 'sgd', lr: 0.1, steps: 40 });
    expect(res.finalLoss).toBeCloseTo(0.3178, 2);
  });

  it('Momentum sau 40 bước lao nhanh, loss < 0.01', () => {
    const res = runOptimization({ optimizer: 'momentum', lr: 0.1, steps: 40 });
    expect(res.finalLoss).toBeLessThan(0.01);
  });

  it('SGD với lr=0.55 bị phân kỳ trên trục y (bùng nổ)', () => {
    const res = runOptimization({ optimizer: 'sgd', lr: 0.55, steps: 20 });
    expect(res.finalLoss).toBeGreaterThan(100);
  });

  it('Adam có bias correction bước 1 chuyển dịch đều cả 2 trục', () => {
    const res = runOptimization({ optimizer: 'adam', lr: 0.1, steps: 1, biasCorrection: true });
    expect(res.finalP[0]).toBeCloseTo(-3.9, 2);
    expect(res.finalP[1]).toBeCloseTo(0.9, 2);
  });

  it('LessonLogic calculate trả về verdict phù hợp cho các preset', () => {
    const logic = new LessonLogic();
    const r1 = logic.applyPreset(pick('sgd_default'));
    expect(r1.verdict.type).toBe('warning');

    const r2 = logic.applyPreset(pick('sgd_diverge'));
    expect(r2.verdict.type).toBe('danger');
    expect(r2.isDiverged).toBe(true);

    const r3 = logic.applyPreset(pick('momentum_fast'));
    expect(r3.verdict.type).toBe('success');
  });
});
