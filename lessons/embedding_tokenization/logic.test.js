import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, bpe, TEXT, D_MODEL } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/embedding_tokenization/logic.js', () => {
  it('BPE trên "aaabdaaabac" cho độ dài chuỗi 11 → 9 → 7 → 5 và V = 4 → 5 → 6 → 7', () => {
    const { history } = bpe(TEXT, 3);
    expect(history.map(h => h.tokens.length)).toEqual([11, 9, 7, 5]);
    expect(history.map(h => h.vocabSize)).toEqual([4, 5, 6, 7]);
  });

  it('các lần gộp đúng thứ tự: aa, aa+a, aaa+b', () => {
    const { history } = bpe(TEXT, 3);
    expect(history[1].merged).toMatchObject({ left: 'a', right: 'a', result: 'aa', count: 4 });
    expect(history[2].merged).toMatchObject({ left: 'aa', right: 'a', result: 'aaa', count: 2 });
    expect(history[3].merged).toMatchObject({ left: 'aaa', right: 'b', result: 'aaab', count: 2 });
    expect(history[3].tokens).toEqual(['aaab', 'd', 'aaab', 'a', 'c']);
  });

  it('ghép lại các token luôn ra đúng văn bản gốc (không mất thông tin)', () => {
    for (let m = 0; m <= 3; m++) {
      const r = new LessonLogic().onUserUpdate({ merges: m });
      expect(r.roundTrip).toBe(true);
    }
  });

  it('chi phí attention N^2 giảm 121 → 25, bảng embedding V*d tăng 16 → 28', () => {
    const a = new LessonLogic().applyPreset(pick('chars'));
    const b = new LessonLogic().applyPreset(pick('full_bpe'));
    expect([a.attnCost, b.attnCost]).toEqual([121, 25]);
    expect([a.embedElems, b.embedElems]).toEqual([16, 28]);
    expect(b.verdict.type).toBe('success');
  });

  it('tra embedding: token id 6 với d = 4 bắt đầu ở offset 24', () => {
    const r = new LessonLogic().applyPreset(pick('full_bpe'));
    expect(r.lookupToken).toBe('aaab');
    expect(r.lookupId).toBe(6);
    expect(r.lookupOffset).toBe(6 * D_MODEL);
    expect(r.lookupRow).toEqual([24, 25, 26, 27]);
  });

  it('bảng từ vựng thực tế 50 000 x 4096 FP16 ≈ 409.6 MB', () => {
    const r = new LessonLogic().calculate();
    expect(r.realTableParams).toBe(204800000);
    expect(r.realTableMB).toBeCloseTo(409.6, 6);
  });
});
