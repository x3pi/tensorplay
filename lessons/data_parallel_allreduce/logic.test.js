import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, sampleGrads, aggregate, shardsOf, ringAllReduce, ringTrafficGB, naiveTrafficGB } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/data_parallel_allreduce/logic.js', () => {
  it('gradient từng mẫu [-1, -4, 0, -16], trung bình cả batch -5.25', () => {
    expect(sampleGrads()).toEqual([-1, -4, 0, -16]);
    const r = new LessonLogic().applyPreset(pick('correct_equal'));
    expect(r.full).toBeCloseTo(-5.25, 10);
    expect(r.shardMeans).toEqual([-2.5, -8]);
    expect(r.agg).toBeCloseTo(-5.25, 10);
    expect(r.correct).toBe(true);
    expect(r.wFull).toBeCloseTo(1.525, 6);
  });

  it('quên chia cho số GPU: gradient gấp đôi (-10.5), w nhảy sai ra 2.05', () => {
    const r = new LessonLogic().applyPreset(pick('forgot_divide'));
    expect(r.agg).toBeCloseTo(-10.5, 10);
    expect(r.correct).toBe(false);
    expect(r.wAgg).toBeCloseTo(2.05, 6);
    expect(r.verdict.type).toBe('danger');
  });

  it('shard 3+1: trung bình các trung bình ≈ -8.833 (sai), có trọng số -5.25 (đúng)', () => {
    const bad = new LessonLogic().applyPreset(pick('unequal_naive'));
    expect(bad.agg).toBeCloseTo(-8.8333, 4);
    expect(bad.correct).toBe(false);
    const good = new LessonLogic().applyPreset(pick('unequal_weighted'));
    expect(good.agg).toBeCloseTo(-5.25, 10);
    expect(good.correct).toBe(true);
    const g = sampleGrads();
    const sh = shardsOf('unequal').map(ix => ix.map(i => g[i]));
    expect(aggregate(sh, [3, 1], 'weighted')).toBeCloseTo(-5.25, 10);
  });

  it('ring all-reduce cho kết quả bằng tổng trên mọi GPU, mỗi GPU gửi 2(N-1) chunk', () => {
    const vecs = [[1, 2, 3, 4], [2, 4, 6, 8], [3, 6, 9, 12], [4, 8, 12, 16]];
    const r = ringAllReduce(vecs);
    r.result.forEach(row => expect(row).toEqual([10, 20, 30, 40]));
    expect(r.steps).toBe(6);
    r.sentChunksPerGpu.forEach(c => expect(c).toBe(6));
  });

  it('lưu lượng ring = 2(N-1)/N * S: 4 GPU với 14 GB là 21 GB, gần như phẳng khi N tăng', () => {
    expect(ringTrafficGB(4)).toBeCloseTo(21, 10);
    expect(naiveTrafficGB(4)).toBe(42);
    expect(ringTrafficGB(8)).toBeCloseTo(24.5, 10);
    expect(naiveTrafficGB(8)).toBe(98);
    expect(ringTrafficGB(1024)).toBeLessThan(2 * 14);
  });

  it('mô phỏng ring đúng với 2, 4, 8 GPU', () => {
    for (const logN of [1, 2, 3]) {
      const r = new LessonLogic().onUserUpdate({ logN });
      expect(r.ringCorrect).toBe(true);
    }
  });
});
