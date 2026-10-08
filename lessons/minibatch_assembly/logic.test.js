import { describe, it, expect } from "vitest";
import { LessonLogic, PRESETS } from './logic.js';

describe('minibatch_assembly logic', () => {
  it("tính toán chính xác kích thước tensor và FLOPs theo batch size", () => {
    const logic = new LessonLogic();
    const res = logic.onUserUpdate({ batchSize: 2, featureDim: 4, hiddenDim: 4, numLayers: 3 });

    expect(res.numElementsX).toBe(8); // 2 * 4
    expect(res.numElementsW).toBe(16); // 4 * 4
    expect(res.numElementsZ).toBe(8); // 2 * 4
    expect(res.layerFlops).toBe(64); // 2 * 2 * 4 * 4
    expect(res.totalFlops).toBe(192); // 64 * 3
  });

  it("dung lượng Activation Buffer tăng tuyến tính theo Batch Size", () => {
    const logic = new LessonLogic();
    const resB1 = logic.applyPreset(PRESETS[0].state); // B = 1
    const resB4 = logic.applyPreset(PRESETS[1].state); // B = 4

    expect(resB4.totalActivationBytes).toBe(resB1.totalActivationBytes * 4);
  });

  it("cảnh báo OOM khi vượt ngưỡng VRAM tối đa", () => {
    const logic = new LessonLogic();
    // gpuMaxVramKb = 16 KB
    // B = 16 => numElementsZ = 16 * 4 = 64 per layer => 64 * 3 = 192 floats => 768 Bytes (chưa OOM)
    // Nếu tăng hiddenDim lên 2048:
    const res = logic.onUserUpdate({ batchSize: 16, hiddenDim: 1024, numLayers: 4, gpuMaxVramKb: 100 });
    // 16 * 1024 * 4 * 4 = 262,144 Bytes = 256 KB > 100 KB
    expect(res.isOOM).toBe(true);
  });

  it("preset 'Lô Cực Đại B = 16' thật sự minh họa OOM (768 B > 0.5 KB), còn B = 4 thì không", () => {
    const logic = new LessonLogic();
    const big = logic.applyPreset(PRESETS.find(p => p.id === 'batch_large_oom').state);
    expect(big.totalActivationBytes).toBe(768);
    expect(big.isOOM).toBe(true);
    const ok = logic.applyPreset(PRESETS.find(p => p.id === 'batch_sweet_spot').state);
    expect(ok.isOOM).toBe(false);
  });
});
