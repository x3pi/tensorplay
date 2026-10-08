import { describe, it, expect } from "vitest";
import { LessonLogic, PRESETS } from './logic.js';

describe('cuda_threads logic', () => {
  it("tính toán gridDim.x đúng bằng hàm trần ceil(N / blockDim)", () => {
    const logic = new LessonLogic();
    // N = 10, blockDim = 4 => ceil(10/4) = 3 blocks (12 threads)
    const res = logic.calculate();
    expect(res.gridDim).toBe(3);
    expect(res.totalThreadsLaunched).toBe(12);
  });

  it("tính đúng global index idx = blockIdx * blockDim + threadIdx", () => {
    const logic = new LessonLogic();
    const res = logic.calculate();

    // Block 1, Thread 2 => idx = 1 * 4 + 2 = 6
    const t6 = res.threads.find(t => t.blockIdx === 1 && t.threadIdx === 2);
    expect(t6.globalIdx).toBe(6);
    expect(t6.isValid).toBe(true);
  });

  it("phát hiện chính xác lỗi Out-of-Bounds nếu tắt Boundary Guard", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[2].state); // N = 10, blockDim = 4, hasBoundaryGuard = false

    expect(res.hasCrash).toBe(true);
    expect(res.oobCount).toBe(2); // idx 10 và 11 vượt biên
  });
});
