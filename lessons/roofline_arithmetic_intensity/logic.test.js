import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, intensityGemm, intensityElementwise, attainableTflops, decodeStep, RIDGE } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/roofline_arithmetic_intensity/logic.js', () => {
  it('điểm gấp = 200 / 2 = 100 FLOP/byte', () => {
    expect(RIDGE).toBe(100);
  });

  it('elementwise: AI = 1/6, chỉ đạt 0.333 TFLOP/s (≈ 0.17% đỉnh)', () => {
    const r = new LessonLogic().applyPreset(pick('elementwise'));
    expect(intensityElementwise()).toBeCloseTo(1 / 6, 12);
    expect(r.attain).toBeCloseTo(0.333, 3);
    expect(r.efficiency).toBeCloseTo(0.0017, 4);
    expect(r.memoryBound).toBe(true);
  });

  it('giải mã batch 1: AI ≈ 0.9995, đạt ≈ 2 TFLOP/s (1% đỉnh)', () => {
    const r = new LessonLogic().applyPreset(pick('decode_b1'));
    expect(r.ai).toBeCloseTo(0.9995, 4);
    expect(r.attain).toBeCloseTo(1.999, 3);
    expect(r.efficiency).toBeCloseTo(0.01, 3);
  });

  it('batch 64: AI ≈ 62.06 vẫn nghẽn băng thông; batch 128: AI ≈ 120.47 vượt điểm gấp', () => {
    expect(intensityGemm(64)).toBeCloseTo(62.06, 2);
    expect(intensityGemm(128)).toBeCloseTo(120.47, 2);
    expect(new LessonLogic().applyPreset(pick('decode_b64')).memoryBound).toBe(true);
    const r = new LessonLogic().applyPreset(pick('decode_b128'));
    expect(r.memoryBound).toBe(false);
    expect(r.attain).toBe(200);
    expect(r.verdict.type).toBe('success');
  });

  it('GEMM vuông n = b: AI = n / 3', () => {
    expect(intensityGemm(4096, 4096)).toBeCloseTo(4096 / 3, 6);
    expect(attainableTflops(4096 / 3)).toBe(200);
  });

  it('mô hình 7B: một bước giải mã mất 7 ms ở batch 1 (143 token/s), 9143 token/s ở batch 64', () => {
    const a = decodeStep(1);
    expect(a.time * 1e3).toBeCloseTo(7, 6);
    expect(a.tokensPerSec).toBeCloseTo(142.857, 2);
    expect(a.bound).toBe('memory');
    const b = decodeStep(64);
    expect(b.time * 1e3).toBeCloseTo(7, 6);
    expect(b.tokensPerSec).toBeCloseTo(9142.857, 2);
    const c = decodeStep(128);
    expect(c.bound).toBe('compute');
    expect(c.time * 1e3).toBeCloseTo(8.96, 6);
  });
});
