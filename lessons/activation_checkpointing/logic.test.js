import { describe, it, expect } from 'vitest';
import {
  LessonLogic,
  PRESETS,
  peakMemory,
  optimalK,
  computeOverhead
} from './logic.js';

describe('lessons/activation_checkpointing/logic.js', () => {
  it('Kiểm chứng công thức bộ nhớ đỉnh L=16 với các giá trị k: [17, 10, 8, 10, 17]', () => {
    const L = 16;
    const ks = [1, 2, 4, 8, 16];
    const mems = ks.map(k => peakMemory(L, k, true));
    expect(mems).toEqual([17, 10, 8, 10, 17]);

    // Không checkpoint phải lưu toàn bộ 16 activation
    expect(peakMemory(L, 4, false)).toBe(16);
  });

  it('Tìm k tối ưu khớp giải tích k* = round(sqrt(L))', () => {
    expect(optimalK(16)).toBe(4);
    expect(optimalK(25)).toBe(5);
    expect(optimalK(64)).toBe(8);

    // Kiểm tra k=4 cho đỉnh bộ nhớ nhỏ nhất trong số các k nguyên dương
    const L = 16;
    const peakOpt = peakMemory(L, optimalK(L), true);
    for (let k = 1; k <= L; k++) {
      expect(peakMemory(L, k, true)).toBeGreaterThanOrEqual(peakOpt);
    }
  });

  it('Kiểm chứng chi phí thời gian tính toán (+33.33%)', () => {
    const withoutCp = computeOverhead(false);
    expect(withoutCp.total).toBe(3);
    expect(withoutCp.ratio).toBe(1.0);
    expect(withoutCp.overheadPct).toBe(0);

    const withCp = computeOverhead(true);
    expect(withCp.total).toBe(4);
    expect(withCp.ratio).toBeCloseTo(4 / 3, 4);
    expect(withCp.overheadPct).toBeCloseTo(33.33, 2);
  });

  it('LessonLogic hoạt động chuẩn xác với các presets', () => {
    const logic = new LessonLogic();
    const stDefault = logic.calculate();

    // Default preset: optimal (L=16, k=4, budget=10)
    expect(stDefault.peakMem).toBe(8);
    expect(stDefault.isOOM).toBe(false);
    expect(stDefault.verdict.type).toBe('success');
    expect(stDefault.savedPercent).toBe(50); // Tiết kiệm 50% RAM

    // Preset no_checkpoint (L=16, budget=10) -> OOM
    const presetNoCp = PRESETS.find(p => p.id === 'no_checkpoint');
    logic.applyPreset(presetNoCp.state);
    const stNoCp = logic.calculate();
    expect(stNoCp.peakMem).toBe(16);
    expect(stNoCp.isOOM).toBe(true);
    expect(stNoCp.verdict.type).toBe('danger');
    expect(stNoCp.verdict.text).toContain('OUT OF MEMORY');

    // Preset too_dense (k=1) -> 17 GB
    const presetDense = PRESETS.find(p => p.id === 'too_dense');
    logic.applyPreset(presetDense.state);
    const stDense = logic.calculate();
    expect(stDense.peakMem).toBe(17);
    expect(stDense.isOOM).toBe(true);
  });
});
