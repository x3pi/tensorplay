import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, bytesPerParam, trafficGB } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/zero_fsdp/logic.js', () => {
  it('byte/tham số với N = 8: DP 16, ZeRO-1 5.5, ZeRO-2 3.75, ZeRO-3 2', () => {
    expect(bytesPerParam('dp', 8)).toBe(16);
    expect(bytesPerParam('zero1', 8)).toBe(5.5);
    expect(bytesPerParam('zero2', 8)).toBe(3.75);
    expect(bytesPerParam('zero3', 8)).toBe(2);
  });

  it('mô hình 7B trên 8 GPU: 112 / 38.5 / 26.25 / 14 GB mỗi GPU', () => {
    const r = new LessonLogic().applyPreset(pick('dp_7b'));
    expect(r.table.map(t => t.gb)).toEqual([112, 38.5, 26.25, 14]);
    expect(r.fits).toBe(false);
    expect(r.verdict.type).toBe('danger');
    expect(new LessonLogic().applyPreset(pick('zero1_7b')).fits).toBe(true);
  });

  it('70B trên 64 GPU: chỉ ZeRO-3 (17.5 GB) vừa GPU 80 GB', () => {
    const r = new LessonLogic().applyPreset(pick('zero3_70b'));
    expect(r.table.map(t => t.gb)).toEqual([1120, 293.125, 155.313, 17.5]);
    expect(r.table.map(t => t.fits)).toEqual([false, false, false, true]);
    expect(r.savings).toBe(64);
  });

  it('truyền thông: ZeRO-3 gấp 1.5 lần DP; 7B 8 GPU: 24.5 GB và 36.75 GB', () => {
    expect(trafficGB('dp', 8, 7)).toBeCloseTo(24.5, 10);
    expect(trafficGB('zero3', 8, 7)).toBeCloseTo(36.75, 10);
    expect(new LessonLogic().applyPreset(pick('zero3_7b')).trafficRatio).toBe(1.5);
    expect(new LessonLogic().applyPreset(pick('zero2_7b')).trafficRatio).toBe(1);
  });

  it('thêm GPU làm giảm bộ nhớ mỗi GPU của ZeRO-3 theo 1/N nhưng DP thì không đổi', () => {
    const mem = (stage, logN) => new LessonLogic().onUserUpdate({ stage, logN }).perGpuGB;
    expect(mem('dp', 1)).toBe(mem('dp', 6));
    expect(mem('zero3', 1)).toBeCloseTo(8 * mem('zero3', 4), 6);
  });

  it('N = 1 thì mọi giai đoạn bằng DP (không có gì để chia)', () => {
    for (const s of ['zero1', 'zero2', 'zero3']) expect(bytesPerParam(s, 1)).toBe(16);
  });
});
