import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, roundToFormat, maxValue, minSubnormal, trainingBytesPerParam } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/mixed_precision/logic.js', () => {
  it('hằng số FP16: max = 65504, subnormal nhỏ nhất = 2^-24', () => {
    expect(maxValue('fp16')).toBe(65504);
    expect(minSubnormal('fp16')).toBe(Math.pow(2, -24));
  });

  it('làm tròn FP16 đúng các mốc IEEE: 1.0005 -> 1.000977, 65519 giữ 65504, 65520 -> Infinity', () => {
    expect(roundToFormat(1.0005, 'fp16')).toBeCloseTo(1.0009765625, 10);
    expect(roundToFormat(65519, 'fp16')).toBe(65504);
    expect(roundToFormat(65520, 'fp16')).toBe(Infinity);
    expect(roundToFormat(-70000, 'fp16')).toBe(-Infinity);
  });

  it('gradient 1e-8 chưa scale bị FP16 làm tròn thành 0 (tiêu biến)', () => {
    const res = new LessonLogic().applyPreset(pick('fp16_tiny_grad'));
    expect(res.stored).toBe(0);
    expect(res.underflow).toBe(true);
    expect(res.verdict.type).toBe('danger');
  });

  it('Loss Scale 1024 cứu gradient 1e-8: sai số tương đối dưới 1%', () => {
    const res = new LessonLogic().applyPreset(pick('fp16_scaled'));
    expect(res.underflow).toBe(false);
    expect(res.overflow).toBe(false);
    expect(res.relError).toBeLessThan(0.01);
    expect(res.recovered).toBeCloseTo(1e-8, 10);
    expect(res.verdict.type).toBe('success');
  });

  it('Scale 2^16 với gradient 1.0 gây tràn FP16 và gợi ý giảm S', () => {
    const res = new LessonLogic().applyPreset(pick('fp16_overscaled'));
    expect(res.overflow).toBe(true);
    expect(res.advice).toContain('giảm S');
  });

  it('BF16 giữ gradient 1e-8 không cần scale (dải mũ như FP32), sai số dưới 0.5%', () => {
    const res = new LessonLogic().applyPreset(pick('bf16_noscale'));
    expect(res.stored).toBeGreaterThan(0);
    expect(res.relError).toBeLessThan(0.005);
  });

  it('mixed precision không tiết kiệm bộ nhớ trạng thái tham số: 16 byte/param cả hai (tiết kiệm nằm ở activation)', () => {
    expect(trainingBytesPerParam(false)).toBe(16);
    expect(trainingBytesPerParam(true)).toBe(16);
  });
});
