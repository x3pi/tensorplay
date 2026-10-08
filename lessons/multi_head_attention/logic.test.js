import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, softmax, multiHead, X } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/multi_head_attention/logic.js', () => {
  it('1 đầu: "pin" nhìn [Robot, nhặt, pin] với trọng số [0.2119, 0.2119, 0.5761]', () => {
    const res = new LessonLogic().applyPreset(pick('single_head'));
    expect(res.perHead).toHaveLength(1);
    expect(res.perHead[0].weights).toEqual([0.2119, 0.2119, 0.5761]);
    expect(res.verdict.type).toBe('warning');
  });

  it('2 đầu: đầu 1 nhìn Robot (vai trò), đầu 2 nhìn nhặt (chủ đề), hai mẫu chú ý khác nhau', () => {
    const res = new LessonLogic().applyPreset(pick('two_heads'));
    expect(res.perHead[0].weights).toEqual([0.4223, 0.1554, 0.4223]);
    expect(res.perHead[1].weights).toEqual([0.1554, 0.4223, 0.4223]);
    expect(res.distinctPatterns).toBe(2);
    expect(res.concat).toEqual([0.8446, 0.1554, 0.1554, 0.8446]);
    expect(res.verdict.type).toBe('success');
  });

  it('số tham số và kích thước KV cache mỗi token không đổi theo số đầu', () => {
    const counts = [1, 2, 4].map(h => new LessonLogic().onUserUpdate({ heads: h }));
    counts.forEach(c => {
      expect(c.params).toBe(64);      // 4 ma trận 4x4
      expect(c.kvPerToken).toBe(8);   // 2 * d_model
    });
  });

  it('mọi đầu đều có trọng số cộng lại bằng 1 và đầu ra concat luôn d_model = 4 chiều', () => {
    for (const h of [1, 2, 4]) {
      for (let q = 0; q < 3; q++) {
        const { perHead, concat } = multiHead(X, h, q);
        perHead.forEach(ph => expect(ph.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10));
        expect(concat).toHaveLength(4);
      }
    }
  });

  it('softmax đều khi mọi điểm bằng nhau', () => {
    softmax([1, 1, 1]).forEach(w => expect(w).toBeCloseTo(1 / 3, 10));
  });
});
