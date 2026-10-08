import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, simulate, lrAt, T } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/lr_schedule_warmup/logic.js', () => {
  it('lịch warmup tuyến tính 4 bước rồi giữ lr_max', () => {
    const o = { lrMax: 0.6, warmup: true, decay: false };
    expect([0, 1, 2, 3, 4, 5].map(t => lrAt(t, o))).toEqual([0.15, 0.3, 0.44999999999999996, 0.6, 0.6, 0.6]);
  });

  it('cosine decay về đúng 0 ở bước cuối (sau bước T-1 gần 0)', () => {
    const o = { lrMax: 0.6, warmup: true, decay: true };
    expect(lrAt(4, o)).toBeCloseTo(0.6, 10);
    expect(lrAt(T - 1, o)).toBeLessThan(0.03);
  });

  it('không warmup: w bị phóng tới |w| ≈ 3.267 ở 3 bước đầu', () => {
    const r = new LessonLogic().applyPreset(pick('constant'));
    expect(r.unstableStart).toBe(true);
    expect(r.peak).toBeCloseTo(3.267, 3);
    expect(r.ws.slice(0, 4)).toEqual([1, -1.52, 2.248, -3.2672]);
    expect(r.verdict.type).toBe('danger');
  });

  it('có warmup: đỉnh |w| vẫn là 1.0 nhưng cuối còn dao động ±0.086', () => {
    const r = new LessonLogic().applyPreset(pick('warmup_only'));
    expect(r.unstableStart).toBe(false);
    expect(r.peak).toBeCloseTo(1.0, 6);
    expect(r.wiggle).toBeCloseTo(0.086, 3);
    expect(r.verdict.type).toBe('warning');
  });

  it('warmup + cosine decay: |w| cuối gần 0 (< 0.01)', () => {
    const r = new LessonLogic().applyPreset(pick('warmup_cosine'));
    expect(r.finalAbs).toBeLessThan(0.01);
    expect(r.verdict.type).toBe('success');
  });

  it('lr 0.4 ổn định ngay từ đầu vì 0.4 < 2/4 (không cần warmup)', () => {
    const r = new LessonLogic().applyPreset(pick('safe_small_lr'));
    expect(r.unstableStart).toBe(false);
    expect(simulate({ lrMax: 0.4, warmup: false, decay: false }).ws.length).toBe(T + 1);
  });
});
