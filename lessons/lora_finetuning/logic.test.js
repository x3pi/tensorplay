import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, outer, loraParams, TOTAL_PARAMS } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/lora_finetuning/logic.js', () => {
  it('ΔW = B A là ma trận hạng 1: [[0,1,0,1],[0,0,0,0],[0,2,0,2],[0,0,0,0]]', () => {
    expect(outer([1, 0, 2, 0], [0, 1, 0, 1])).toEqual([[0, 1, 0, 1], [0, 0, 0, 0], [0, 2, 0, 2], [0, 0, 0, 0]]);
  });

  it('khởi tạo B = 0: ΔW = 0, đầu ra bằng mô hình gốc [1, 2, 3, 4]', () => {
    const r = new LessonLogic().applyPreset(pick('init_zero'));
    expect(r.toy.yMerged).toEqual([1, 2, 3, 4]);
    expect(r.toy.delta.flat().every(v => v === 0)).toBe(true);
    expect(r.toy.rank).toBe(0);
  });

  it('sau khi học: y = W x + B (A x) = [1+6, 2, 3+12, 4] = [7, 2, 15, 4], hợp nhất cho cùng kết quả', () => {
    const r = new LessonLogic().applyPreset(pick('trained_r8'));
    expect(r.toy.yLora).toEqual([7, 2, 15, 4]);
    expect(r.toy.yMerged).toEqual([7, 2, 15, 4]);
    expect(r.mergeIdentical).toBe(true);
  });

  it('r = 8, d = 4096: 65 536 tham số mỗi ma trận (0.39%), 4 194 304 tham số tổng (0.0638%)', () => {
    expect(loraParams(4096, 8)).toBe(65536);
    const r = new LessonLogic().applyPreset(pick('trained_r8'));
    expect(r.perMatrix).toBe(65536);
    expect(r.matrixRatio).toBeCloseTo(0.3906, 4);
    expect(r.trainable).toBe(4194304);
    expect(r.pct).toBeCloseTo(0.0638, 3);
  });

  it('bộ nhớ: trọng số FP16 13.147 GB + 67.1 MB trạng thái LoRA ≈ 13.21 GB so với 105.2 GB tinh chỉnh toàn phần (~8 lần)', () => {
    const r = new LessonLogic().applyPreset(pick('trained_r8'));
    expect(r.trainableMB).toBeCloseTo(67.109, 3);
    expect(r.baseGB).toBeCloseTo(13.147, 3);
    expect(r.totalGB).toBeCloseTo(13.214, 3);
    expect(r.fullFtGB).toBeCloseTo(105.176, 3);
    expect(r.saving).toBeCloseTo(7.96, 2);
  });

  it('số tham số học tăng tuyến tính theo r, vẫn nhỏ hơn 1% mô hình ở r = 64', () => {
    expect(new LessonLogic().applyPreset(pick('rank1')).trainable).toBe(524288);
    const r64 = new LessonLogic().applyPreset(pick('rank64'));
    expect(r64.trainable).toBe(33554432);
    expect(r64.trainable / TOTAL_PARAMS).toBeLessThan(0.01);
  });
});
