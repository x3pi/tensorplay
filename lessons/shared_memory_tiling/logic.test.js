import { describe, it, expect } from "vitest";
import { LessonLogic, PRESETS } from './logic.js';

describe('shared_memory_tiling logic', () => {
  it("tính toán số lượt đọc DRAM giảm đúng bằng hệ số Tile Size T", () => {
    const logic = new LessonLogic();
    const res = logic.calculate();

    // N = 4, T = 2
    // Naive = 2 * 4^3 = 128
    // Tiled = 128 / 2 = 64
    expect(res.naiveDramReads).toBe(128);
    expect(res.tiledDramReads).toBe(64);
    expect(res.bandwidthReductionFactor).toBe(2);
  });

  it("với chuẩn công nghiệp CUDA (N=1024, Tile=32), băng thông DRAM giảm 32 lần", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[2].state);

    expect(res.bandwidthReductionFactor).toBe(32);
    expect(res.tiledDramReads).toBe(res.naiveDramReads / 32);
  });

  it("trích xuất tile A và tile B chính xác theo từng phase k", () => {
    const logic = new LessonLogic();
    const p0 = logic.calculate();
    expect(p0.tileA).toEqual([[1, 2], [0, 1]]);
    expect(p0.tileB).toEqual([[1, 0], [0, 1]]);

    const p1 = logic.onUserUpdate({ currentPhase: 1 });
    expect(p1.tileA).toEqual([[0, 1], [2, 1]]);
    expect(p1.tileB).toEqual([[2, 1], [1, 2]]);
  });
});
