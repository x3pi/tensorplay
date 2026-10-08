import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, layerNorm, batchNorm, residualGradient, DEFAULT_X } from './layernorm_residual.logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('examples/hw2_modules_conv/layernorm_residual.logic.js', () => {
  it('LayerNorm chuẩn hóa theo hàng: cả [1,3] và [2,6] đều ra [-1, 1]', () => {
    const { out } = layerNorm(DEFAULT_X);
    expect(out).toEqual([[-1, 1], [-1, 1]]);
  });

  it('BatchNorm chuẩn hóa theo cột: [[1,3],[2,6]] ra [[-1,-1],[1,1]]', () => {
    const { out } = batchNorm(DEFAULT_X);
    expect(out).toEqual([[-1, -1], [1, 1]]);
  });

  it('BatchNorm batch=1 sụp về 0 (phương sai = 0), LayerNorm thì không', () => {
    const bn = new LessonLogic().applyPreset(pick('bn_batch1'));
    expect(bn.degenerate).toBe(true);
    expect(bn.out).toEqual([[0, 0]]);
    expect(bn.verdict.type).toBe('danger');

    const ln = new LessonLogic().applyPreset({ norm: 'ln', batchSize: 1 });
    expect(ln.degenerate).toBe(false);
    expect(ln.out).toEqual([[-1, 1]]);
  });

  it('đầu ra mẫu 1 của LayerNorm không đổi theo batch, của BatchNorm thì đổi', () => {
    const ln = new LessonLogic().applyPreset(pick('ln_batch2'));
    expect(ln.batchIndependent).toBe(true);
    expect(ln.shift).toBe(0);

    const bn = new LessonLogic().applyPreset(pick('bn_batch2'));
    expect(bn.batchIndependent).toBe(false);
    expect(bn.rowAtB1).toEqual([0, 0]);
    expect(bn.rowAtB2).toEqual([-1, -1]);
  });

  it('residual giữ gradient: 6 tầng, f\'=0.1 -> 1.1^6 ≈ 1.7716 so với 1e-6', () => {
    expect(residualGradient(6, 0.1, true)).toBeCloseTo(1.771561, 5);
    expect(residualGradient(6, 0.1, false)).toBeCloseTo(1e-6, 12);
    const res = new LessonLogic().applyPreset(pick('deep_no_residual'));
    expect(res.gradActive).toBeCloseTo(1e-6, 12);
  });
});
