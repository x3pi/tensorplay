import { describe, it, expect } from 'vitest';
import { LessonLogic } from './logic.js';

describe('lessons/cache_locality/logic.js', () => {
  it('Quét theo hàng (Row-Major) cho tỉ lệ Cache Hit đạt 75% (1 miss kéo theo 3 hits trong cache line 4)', () => {
    const logic = new LessonLogic();
    logic.applyPreset({ scanOrder: 'row' });

    // Quét hết 16 phần tử
    for (let i = 0; i < 16; i++) {
      logic.stepScan();
    }

    const res = logic.calculate();
    expect(res.misses).toBe(4); // 4 cache lines = 4 misses
    expect(res.hits).toBe(12);  // 12 hits
    expect(res.hitRate).toBe(0.75);
    // 12*1 + 4*20 = 92 cycles
    expect(res.estimatedCycles).toBe(92);
  });

  it('Quét theo cột (Col-Major) gây Cache Miss 100% với bộ nhớ nhảy cóc', () => {
    const logic = new LessonLogic();
    logic.applyPreset({ scanOrder: 'col', cacheLineSize: 4 });

    // Quét hết 16 phần tử
    for (let i = 0; i < 16; i++) {
      logic.stepScan();
    }

    const res = logic.calculate();
    // Col major access jumps across rows: misses much higher, cycles much higher
    expect(res.misses).toBeGreaterThan(res.hits);
    expect(res.estimatedCycles).toBeGreaterThan(150);
  });
});
