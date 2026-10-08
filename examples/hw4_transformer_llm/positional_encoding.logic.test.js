import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, positionalEncoding, softmax } from './positional_encoding.logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('examples/hw4_transformer_llm/positional_encoding.logic.js', () => {
  it('mã vị trí tần số pi/2 cho 4 vector tròn trị', () => {
    expect(positionalEncoding(0)).toEqual([0, 1]);
    expect(positionalEncoding(1)).toEqual([1, 0]);
    expect(positionalEncoding(2)).toEqual([0, -1]);
    expect(positionalEncoding(3)).toEqual([-1, 0]);
  });

  it('softmax của [0,1,1] cho trọng số [0.1554, 0.4223, 0.4223]', () => {
    const w = softmax([0, 1, 1]);
    expect(w[0]).toBeCloseTo(0.1554, 4);
    expect(w[1]).toBeCloseTo(0.4223, 4);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it('không có mã vị trí: "cắn" nhận cùng đầu ra ở hai câu đảo thứ tự (hoán vị bất biến)', () => {
    const res = new LessonLogic().applyPreset(pick('no_pe'));
    expect(res.orderBlind).toBe(true);
    expect(res.A.out).toEqual(res.B.out);
    expect(res.A.out[0]).toBeCloseTo(0.5777, 4);
    expect(res.A.out[1]).toBeCloseTo(0.8446, 4);
    expect(res.verdict.type).toBe('danger');
  });

  it('có mã vị trí: hai câu cho đầu ra khác nhau', () => {
    const res = new LessonLogic().applyPreset(pick('with_pe'));
    expect(res.orderBlind).toBe(false);
    expect(res.A.out[0]).toBeCloseTo(1.0, 4);
    expect(res.A.out[1]).toBeCloseTo(0.8446, 4);
    expect(res.B.out[1]).toBeCloseTo(1.6351, 4);
    expect(res.diff).toBeGreaterThan(0.5);
  });

  it('mọi hàng trọng số attention cộng lại bằng 1', () => {
    const res = new LessonLogic().applyPreset(pick('pe_query_dog'));
    expect(res.A.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 3);
    expect(res.B.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 3);
  });
});
