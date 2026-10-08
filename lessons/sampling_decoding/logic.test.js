import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, softmaxT, filterAndRenormalize, pickToken, LOGITS } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/sampling_decoding/logic.js', () => {
  it('T = 1: P = [0.6364, 0.2341, 0.0861, 0.0317, 0.0117]', () => {
    const p = softmaxT(LOGITS, 1);
    [0.6364, 0.2341, 0.0861, 0.0317, 0.0117].forEach((v, i) => expect(p[i]).toBeCloseTo(v, 4));
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });

  it('nhiệt độ thấp làm nhọn (T = 0.5: 0.8647), nhiệt độ cao làm phẳng (T = 2: 0.4287)', () => {
    expect(softmaxT(LOGITS, 0.5)[0]).toBeCloseTo(0.8647, 4);
    expect(softmaxT(LOGITS, 2)[0]).toBeCloseTo(0.4287, 4);
  });

  it('top-p 0.9 ở T = 1 giữ 3 token và chuẩn hóa lại [0.6652, 0.2447, 0.0900]', () => {
    const f = filterAndRenormalize(softmaxT(LOGITS, 1), 0, 0.9);
    expect(f.keep).toEqual([true, true, true, false, false]);
    [0.6652, 0.2447, 0.09, 0, 0].forEach((v, i) => expect(f.probs[i]).toBeCloseTo(v, 3));
    expect(f.keptMass).toBeCloseTo(0.9567, 4);
  });

  it('top-k 2 giữ 2 token [0.7311, 0.2689]', () => {
    const f = filterAndRenormalize(softmaxT(LOGITS, 1), 2, 1);
    expect(f.probs[0]).toBeCloseTo(0.7311, 4);
    expect(f.probs[1]).toBeCloseTo(0.2689, 4);
  });

  it('bốc bằng nghịch đảo CDF: u = 0.5 -> "đi thẳng", u = 0.8 -> "rẽ trái", u = 0.95 -> "dừng"', () => {
    const p = softmaxT(LOGITS, 1);
    expect(pickToken(p, 0.5)).toBe(0);
    expect(pickToken(p, 0.8)).toBe(1);
    expect(pickToken(p, 0.95)).toBe(2);
    expect(pickToken(p, 0.985)).toBe(3);
  });

  it('T = 2 không lọc: đuôi xấu 15.4%/bước, sinh 50 token gần như chắc chắn dính (> 99.9%)', () => {
    const r = new LessonLogic().applyPreset(pick('hot_t2'));
    expect(r.badAfter).toBeCloseTo(0.1537, 4);
    expect(r.in50).toBeGreaterThan(0.999);
    expect(r.verdict.type).toBe('danger');
    expect(r.chosenToken).toBe('nổ');
  });

  it('top-p 0.9 ở T = 2 cắt token cuối, đuôi xấu giảm còn ≈ 10.2%', () => {
    const r = new LessonLogic().applyPreset(pick('hot_top_p'));
    expect(r.nKept).toBe(4);
    expect(r.badAfter).toBeLessThan(r.badBefore);
    expect(r.badAfter).toBeCloseTo(0.1015, 3);
  });

  it('top-k 2 cắt sạch đuôi xấu; greedy luôn trả token 0', () => {
    const k = new LessonLogic().applyPreset(pick('top_k_2'));
    expect(k.badAfter).toBe(0);
    expect(k.verdict.type).toBe('success');
    const g = new LessonLogic().applyPreset(pick('greedy'));
    expect(g.chosen).toBe(0);
    expect(g.finalProbs).toEqual([1, 0, 0, 0, 0]);
  });

  it('bốc thuần T = 1: đuôi 4.33%/bước nhưng 50 token vẫn dính 89.1% -> cảnh báo, không tô xanh', () => {
    const r = new LessonLogic().applyPreset(pick('plain_t1'));
    expect(r.badAfter).toBeCloseTo(0.0433, 4);
    expect(r.in50).toBeCloseTo(0.891, 3);
    expect(r.verdict.type).toBe('warning');
  });
});
