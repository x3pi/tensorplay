import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, accumulate, clipGradient, NORMAL, SPIKE } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/gradient_accumulation_clipping/logic.js', () => {
  it('tích lũy 4 micro-batch chia đúng cho gradient trung bình [0.25, 0.25]', () => {
    expect(accumulate(NORMAL, true)).toEqual([0.25, 0.25]);
    const r = new LessonLogic().applyPreset(pick('accumulate_ok'));
    expect(r.raw).toEqual([0.25, 0.25]);
    expect(r.microGB).toBe(2);
    expect(r.effectiveGB).toBe(8);
    expect(r.verdict.type).toBe('success');
  });

  it('quên chia: gradient [1, 1] gấp 4 lần', () => {
    const r = new LessonLogic().applyPreset(pick('forgot_divide'));
    expect(r.raw).toEqual([1, 1]);
    expect(r.rawNorm).toBeCloseTo(1.4142, 4);
    expect(r.verdict.type).toBe('danger');
  });

  it('đột biến không cắt: gradient [3.15, 1.125], chuẩn 3.3449, bước nhảy gấp ≈ 9.5 lần bình thường', () => {
    const r = new LessonLogic().applyPreset(pick('spike_unclipped'));
    expect(r.raw).toEqual([3.15, 1.125]);
    expect(r.rawNorm).toBeCloseTo(3.3449, 4);
    expect(r.stepNorm / r.normalStepNorm).toBeCloseTo(9.46, 2);
    expect(r.verdict.type).toBe('danger');
  });

  it('cắt theo chuẩn giữ nguyên hướng (cosine = 1), chuẩn về đúng 1', () => {
    const r = new LessonLogic().applyPreset(pick('spike_norm_clip'));
    expect(r.clipped[0]).toBeCloseTo(0.9417, 4);
    expect(r.clipped[1]).toBeCloseTo(0.3363, 4);
    expect(r.clippedNorm).toBeCloseTo(1.0, 4);
    expect(r.cosine).toBeCloseTo(1, 6);
    expect(r.verdict.type).toBe('success');
  });

  it('cắt theo giá trị làm lệch hướng: [1, 1], cosine ≈ 0.9037 (≈ 25.5°)', () => {
    const r = new LessonLogic().applyPreset(pick('spike_value_clip'));
    expect(r.clipped).toEqual([1, 1]);
    expect(r.cosine).toBeCloseTo(0.9037, 4);
    expect(r.angleDeg).toBeCloseTo(25.4, 0);
    expect(r.verdict.type).toBe('warning');
  });

  it('gradient nhỏ hơn ngưỡng không bị cắt dù bật cắt theo chuẩn', () => {
    expect(clipGradient([0.25, 0.25], 'norm', 1)).toEqual([0.25, 0.25]);
    const same = clipGradient(accumulate(SPIKE, true), 'none');
    expect(same[0]).toBeCloseTo(3.15, 12);
    expect(same[1]).toBeCloseTo(1.125, 12);
  });
});
