import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, route, LOGITS, topK } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/moe_routing/logic.js', () => {
  it('top-1 không cân bằng: số token mỗi chuyên gia [5, 1, 1, 1], aux ≈ 1.486', () => {
    const r = new LessonLogic().applyPreset(pick('collapse_top1'));
    expect(r.counts).toEqual([5, 1, 1, 1]);
    expect(r.aux).toBeCloseTo(1.4859, 4);
    expect(r.imbalance).toBe(2.5);
  });

  it('dung lượng 1.0: mỗi chuyên gia nhận tối đa ceil(8/4) = 2, chuyên gia 0 bỏ 3 token', () => {
    const r = new LessonLogic().applyPreset(pick('collapse_top1'));
    expect(r.cap).toBe(2);
    expect(r.load).toEqual([2, 1, 1, 1]);
    expect(r.dropped.length).toBe(3);
    expect(r.dropped.map(d => d[0])).toEqual([3, 4, 7]); // các token đến muộn
    expect(r.verdict.type).toBe('danger');
  });

  it('dung lượng 2.5 đủ chứa 5 token nên không bỏ ai, nhưng chuyên gia khác gần như trống', () => {
    const r = new LessonLogic().applyPreset(pick('roomy_capacity'));
    expect(r.cap).toBe(5);
    expect(r.dropped.length).toBe(0);
    expect(r.verdict.type).toBe('success');
  });

  it('thêm bias cân bằng: mỗi chuyên gia đúng 2 token, aux = 1.0, không bỏ token', () => {
    const r = new LessonLogic().applyPreset(pick('balanced_top1'));
    expect(r.counts).toEqual([2, 2, 2, 2]);
    expect(r.aux).toBeCloseTo(1.0, 6);
    expect(r.dropped.length).toBe(0);
    expect(r.verdict.type).toBe('success');
  });

  it('top-2: 16 lượt gọi phân [7, 4, 2, 3], dung lượng 4, bỏ 3; aux ≈ 1.243', () => {
    const r = new LessonLogic().applyPreset(pick('top2'));
    expect(r.counts).toEqual([7, 4, 2, 3]);
    expect(r.counts.reduce((a, b) => a + b, 0)).toBe(16);
    expect(r.cap).toBe(4);
    expect(r.dropped.length).toBe(3);
    expect(r.aux).toBeCloseTo(1.243, 3);
  });

  it('tham số: dense 128, MoE 4 chuyên gia 512 tổng; mỗi token dùng k × 128', () => {
    const r = new LessonLogic().applyPreset(pick('top2'));
    expect([r.denseParams, r.moeTotalParams, r.activeParams]).toEqual([128, 512, 256]);
  });

  it('topK chọn đúng thứ tự giảm dần và mỗi hàng xác suất cộng lại bằng 1', () => {
    expect(topK([0.1, 0.5, 0.4], 2)).toEqual([1, 2]);
    route(LOGITS, 1, 1, false).P.forEach(row => expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12));
  });
});
