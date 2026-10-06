import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, loss, analyticGrad, numericGrad, relativeError, W0 } from './gradient_check.logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('examples/hw1_autograd_engine/gradient_check.logic.js', () => {
  it('f(w0) = 2.25 và gradient giải tích đúng = [-3, -6]', () => {
    expect(loss(W0)).toBe(2.25);
    expect(analyticGrad(W0)).toEqual([-3, -6]);
  });

  it('Ba phiên bản bug cho gradient sai', () => {
    expect(analyticGrad(W0, 'forget2')).toEqual([-1.5, -3]);
    expect(analyticGrad(W0, 'forgetx')).toEqual([-3, -3]);
    expect(analyticGrad(W0, 'sign')).toEqual([3, 6]);
  });

  it('Sai phân tiến với ε = 0.1 cho [-2.9, -5.6]; sai phân trung tâm gần như chính xác', () => {
    const fwd = numericGrad(W0, 0.1, 'forward');
    expect(fwd[0]).toBeCloseTo(-2.9, 10);
    expect(fwd[1]).toBeCloseTo(-5.6, 10);
    const ctr = numericGrad(W0, 0.1, 'central');
    expect(ctr[0]).toBeCloseTo(-3, 10);
    expect(ctr[1]).toBeCloseTo(-6, 10);
  });

  it('Code đúng qua kiểm tra; mọi bug đều bị phát hiện', () => {
    const logic = new LessonLogic();
    expect(logic.applyPreset(pick('ok')).passed).toBe(true);
    for (const id of ['forget2', 'forgetx', 'sign']) {
      const r = logic.applyPreset(pick(id));
      expect(r.passed).toBe(false);
      expect(r.verdict.type).toBe('danger');
    }
  });

  it('float32 với ε = 1e-8: w + ε bị làm tròn về w → gradient số = 0 (báo động giả)', () => {
    const r = new LessonLogic().applyPreset(pick('f32_tiny'));
    expect(r.numeric).toEqual([0, 0]);
    expect(r.passed).toBe(false);
    expect(r.verdict.type).toBe('warning');
  });

  it('Một bước GD lr 0.1: đúng → f = 0; quên 2 → 0.5625; sai dấu → 9', () => {
    const logic = new LessonLogic();
    let r = logic.applyPreset(pick('ok'));
    expect(r.wNext).toEqual([0.8, 1.1]);
    expect(r.fNext).toBe(0);
    expect(logic.applyPreset(pick('forget2')).fNext).toBe(0.5625);
    expect(logic.applyPreset(pick('sign')).fNext).toBe(9);
  });

  it('relativeError: giống hệt → 0, ngược dấu → 1', () => {
    expect(relativeError([1, 2], [1, 2])).toBe(0);
    expect(relativeError([1, 2], [-1, -2])).toBe(1);
  });
});
