import { describe, it, expect } from 'vitest';
import { computeStep } from './logic.js';

describe('{{SLUG}} logic', () => {
  it('computes correctly', () => {
    expect(computeStep(2)).toBe(4);
    expect(computeStep(0)).toBe(0);
  });
});
