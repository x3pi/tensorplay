import { describe, it, expect } from 'vitest';
import {
  LessonLogic,
  PRESETS,
  logSumExp,
  safeSoftmax,
  naiveSoftmax,
  crossEntropyLSE,
  crossEntropyNaive,
  crossEntropyGrad
} from './cross_entropy_logsumexp.logic.js';

describe('examples/hw0_tensor_memory/cross_entropy_logsumexp.logic.js', () => {
  it('Trường hợp logit vừa phải [2, 1], nhãn y=1: Naive và LSE cho cùng kết quả', () => {
    const z = [2.0, 1.0];
    const y = 1;

    const lseVal = logSumExp(z);
    expect(lseVal).toBeCloseTo(2.3133, 4);

    const lossL = crossEntropyLSE(z, y);
    const lossN = crossEntropyNaive(z, y);
    expect(lossL).toBeCloseTo(1.3133, 4);
    expect(lossN).toBeCloseTo(1.3133, 4);

    const p = safeSoftmax(z);
    expect(p[0] + p[1]).toBeCloseTo(1.0, 6);
    expect(p[0]).toBeGreaterThan(p[1]);

    const grad = crossEntropyGrad(z, y);
    expect(grad[0] + grad[1]).toBeCloseTo(0.0, 6);
    expect(grad[0]).toBeCloseTo(p[0], 4);
    expect(grad[1]).toBeCloseTo(p[1] - 1, 4);
  });

  it('Trường hợp chênh lệch cực đại [0, -1000], nhãn y=1: Naive ra Infinity, LSE ra 1000.0', () => {
    const z = [0.0, -1000.0];
    const y = 1;

    const pNaive = naiveSoftmax(z);
    expect(pNaive[1]).toBe(0);

    const lossN = crossEntropyNaive(z, y);
    expect(lossN).toBe(Infinity);

    const lseVal = logSumExp(z);
    expect(lseVal).toBe(0.0);

    const lossL = crossEntropyLSE(z, y);
    expect(lossL).toBe(1000.0);

    const grad = crossEntropyGrad(z, y);
    expect(grad[0]).toBeCloseTo(1.0, 4);
    expect(grad[1]).toBeCloseTo(-1.0, 4);
    expect(grad[0] + grad[1]).toBeCloseTo(0.0, 6);
  });

  it('Trường hợp tràn số siêu lớn [1000, 999], nhãn y=0: Naive hỏng, LSE tính mượt mà', () => {
    const z = [1000.0, 999.0];
    const y = 0;

    const lossN = crossEntropyNaive(z, y);
    expect(Number.isNaN(lossN)).toBe(true);

    const lossL = crossEntropyLSE(z, y);
    expect(lossL).toBeCloseTo(0.3133, 4);
  });

  it('LessonLogic hoạt động chuẩn xác với các presets và thay đổi mode', () => {
    const logic = new LessonLogic();
    const stDefault = logic.calculate();

    expect(stDefault.state.mode).toBe('lse');
    expect(stDefault.verdict.type).toBe('success');

    // Chuyển sang preset underflow
    const underflowPreset = PRESETS.find(p => p.id === 'underflow');
    logic.applyPreset(underflowPreset.state);
    const stUnderflowLSE = logic.calculate();
    expect(stUnderflowLSE.lossLSE).toBe(1000.0);
    expect(stUnderflowLSE.verdict.type).toBe('success');

    // Bật mode naive khi đang underflow -> lập tức cảnh báo danger
    logic.onUserUpdate({ mode: 'naive' });
    const stUnderflowNaive = logic.calculate();
    expect(stUnderflowNaive.lossNaive).toBe(Infinity);
    expect(stUnderflowNaive.verdict.type).toBe('danger');
    expect(stUnderflowNaive.verdict.text).toContain('Underflow');

    // Chuyển sang preset overflow
    const overflowPreset = PRESETS.find(p => p.id === 'overflow');
    logic.applyPreset(overflowPreset.state);
    logic.onUserUpdate({ mode: 'naive' });
    const stOverflowNaive = logic.calculate();
    expect(stOverflowNaive.verdict.type).toBe('danger');
    expect(stOverflowNaive.verdict.text).toContain('tràn số');
  });
});
