import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, rotate, ropeScore, addScore } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/rope_rotary/logic.js', () => {
  it('xoay [1, 0] đi 90° ra [0, 1], đi 180° ra [-1, 0]', () => {
    expect(rotate([1, 0], Math.PI / 2)).toEqual([0, 1]);
    expect(rotate([1, 0], Math.PI)).toEqual([-1, 0]);
  });

  it('RoPE với θ = 90°: điểm = cos(90° × (m - n)): hiệu 0,1,2,3 -> 1, 0, -1, 0', () => {
    expect([0, 1, 2, 3].map(d => ropeScore(d, 0, 90))).toEqual([1, 0, -1, 0]);
    expect(ropeScore(3, 1, 90)).toBe(-1);
  });

  it('RoPE bất biến khi dịch cả hai vị trí; cộng PE thì không', () => {
    for (const s of [1, 2, 5, 11]) {
      expect(ropeScore(3 + s, 1 + s, 45)).toBeCloseTo(ropeScore(3, 1, 45), 9);
    }
    expect(addScore(3, 1, 45)).toBeCloseTo(2.4142, 4);
    expect(addScore(5, 3, 45)).toBeCloseTo(1, 9);
    const r = new LessonLogic().applyPreset(pick('shift_invariance'));
    expect(r.ropeInvariant).toBe(true);
    expect(r.addInvariant).toBe(false);
    expect(r.rope1).toBeCloseTo(0, 6);
    expect(r.verdict.type).toBe('success');
  });

  it('điểm RoPE đối xứng theo hiệu vị trí (m,n) và (n,m) cho cùng điểm với q = k', () => {
    expect(ropeScore(4, 1, 30)).toBeCloseTo(ropeScore(1, 4, 30), 9);
    expect(ropeScore(4, 1, 30)).toBeCloseTo(0, 9);
  });

  it('đường cong cos theo khoảng cách ở 45°: 1, 0.7071, 0, -0.7071, -1', () => {
    const r = new LessonLogic().applyPreset(pick('eighth_turn'));
    expect(r.curve.slice(0, 5).map(c => c.score)).toEqual([1, 0.7071, 0, -0.7071, -1]);
  });
});
