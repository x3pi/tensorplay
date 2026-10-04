import { describe, it, expect } from 'vitest';
import { dot, safeSoftmax, relu, clamp, offset2D } from './math.js';

describe('shared/math.js', () => {
  it('dot() calculates dot product accurately', () => {
    expect(dot([1, 1, 0, 0], [1, 1, -1, -1])).toBe(2);
    expect(dot([1, 1, 1, 1], [1, 1, -1, -1])).toBe(0);
    expect(dot([0.5, 2], [4, -1])).toBe(0);
  });

  it('safeSoftmax() handles huge logits without FP32 overflow (NaN/Infinity)', () => {
    // Normal case
    const normal = safeSoftmax([2, 0]);
    expect(normal[0]).toBeCloseTo(0.8808, 3);
    expect(normal[1]).toBeCloseTo(0.1192, 3);

    // Extreme case (1000 would overflow standard Math.exp)
    const extreme = safeSoftmax([1000, 1000]);
    expect(extreme).toEqual([0.5, 0.5]);

    const largeDiff = safeSoftmax([1000, 990]);
    expect(largeDiff[0]).toBeGreaterThan(0.999);
    expect(largeDiff[1]).toBeLessThan(0.001);
  });

  it('relu() activates positive values and zeroes negative values', () => {
    expect(relu(3.5)).toBe(3.5);
    expect(relu(-2.5)).toBe(0);
    expect(relu(0)).toBe(0);
  });

  it('clamp() keeps numbers within boundaries', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('offset2D() computes exact 1D row-major indexing', () => {
    expect(offset2D(0, 0, 2)).toBe(0);
    expect(offset2D(0, 1, 2)).toBe(1);
    expect(offset2D(1, 0, 2)).toBe(2);
    expect(offset2D(1, 1, 2)).toBe(3);
    expect(() => offset2D(0, 2, 2)).toThrow();
  });
});
