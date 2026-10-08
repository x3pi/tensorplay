import { describe, it, expect } from "vitest";
import { LessonLogic, PRESETS } from './logic.js';

describe('kv_cache_anatomy logic', () => {
  it("khi có KV-Cache, mỗi bước sinh token chỉ tính đúng 1 token mới", () => {
    const logic = new LessonLogic();
    const res = logic.calculate();

    expect(res.hasCache).toBe(true);
    expect(res.tokensComputedThisStep).toBe(1);
    expect(res.latencyThisStepMs).toBe(10);
  });

  it("khi tắt KV-Cache, số token phải tính tăng tỷ lệ thuận với độ dài chuỗi", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[1].state); // hasCache: false, seqLen = 3

    expect(res.hasCache).toBe(false);
    expect(res.tokensComputedThisStep).toBe(3);
    expect(res.latencyThisStepMs).toBe(30);
  });

  it("dung lượng VRAM tăng tuyến tính theo số token được lưu trong cache", () => {
    const logic = new LessonLogic();
    const r1 = logic.onUserUpdate({ currentStep: 0 }); // 1 token
    const bytes1 = r1.totalCacheBytes;

    const r3 = logic.onUserUpdate({ currentStep: 2 }); // 3 tokens
    expect(r3.totalCacheBytes).toBe(bytes1 * 3);
  });
});
