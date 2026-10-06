import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, applyDropout, backwardDropout, DEFAULT_H } from './dropout.logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('examples/hw2_modules_conv/dropout.logic.js', () => {
  it('Inverted Dropout p=0.5: hệ số scale = 2, nơ-ron sống được nhân 2', () => {
    const res = applyDropout([4, 2, 6, 4], [1, 0, 1, 0], 0.5, 'train', 'inverted');
    expect(res.scaleFactor).toBe(2);
    expect(res.out).toEqual([8, 0, 12, 0]);
    expect(res.expectedMean).toBe(4);
    expect(res.actualMean).toBe(5);
  });

  it('Naive Dropout quên scale: giữ nguyên giá trị không nhân 2, kì vọng giảm một nửa', () => {
    const res = applyDropout([4, 2, 6, 4], [1, 0, 1, 0], 0.5, 'train', 'naive');
    expect(res.scaleFactor).toBe(1);
    expect(res.out).toEqual([4, 0, 6, 0]);
    expect(res.expectedMean).toBe(2); // 4 * (1 - 0.5)
  });

  it('Eval Mode: không drop nơ-ron nào, out = h', () => {
    const res = applyDropout([4, 2, 6, 4], [0, 0, 0, 0], 0.5, 'eval', 'inverted');
    expect(res.out).toEqual([4, 2, 6, 4]);
    expect(res.scaleFactor).toBe(1);
  });

  it('Backward Dropout: nơ-ron bị drop nhận gradient = 0, nơ-ron sống nhận gradient * scaleFactor', () => {
    const grad = backwardDropout([1, 1, 1, 1], [1, 0, 1, 0], 0.5, 'train', 'inverted');
    expect(grad).toEqual([2, 0, 2, 0]);
  });

  it('Backward khi Eval: truyền thẳng gradient nguyên bản', () => {
    const grad = backwardDropout([1, 2, 3, 4], [1, 0, 1, 0], 0.5, 'eval', 'inverted');
    expect(grad).toEqual([1, 2, 3, 4]);
  });

  it('LessonLogic calculate trả về đúng kết quả và verdict cho preset', () => {
    const logic = new LessonLogic();
    const r1 = logic.applyPreset(pick('inverted_half'));
    expect(r1.verdict.type).toBe('success');
    expect(r1.activeCount).toBe(2);

    const r2 = logic.applyPreset(pick('naive_half'));
    expect(r2.verdict.type).toBe('danger');

    const r3 = logic.applyPreset(pick('eval_mode'));
    expect(r3.verdict.type).toBe('success');
    expect(r3.out).toEqual(DEFAULT_H);
  });

  it('generateRandomMask tạo mask với độ dài đúng', () => {
    const logic = new LessonLogic();
    logic.generateRandomMask();
    expect(logic.state.mask.length).toBe(4);
    expect(logic.state.mask.every(m => m === 0 || m === 1)).toBe(true);
  });
});
