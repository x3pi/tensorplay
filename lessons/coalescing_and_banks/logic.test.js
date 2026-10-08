import { describe, it, expect } from "vitest";
import { LessonLogic, PRESETS } from './logic.js';

describe('coalescing_and_banks logic', () => {
  it("stride = 1 cho 100% hiệu suất bus và 0 bank conflicts", () => {
    const logic = new LessonLogic();
    const res = logic.calculate();

    expect(res.numTransactions).toBe(1);
    expect(res.busEfficiencyPercent).toBe(100);
    expect(res.maxBankConflictWay).toBe(1); // 1-way = song song hoàn toàn
    expect(res.isFullyCoalesced).toBe(true);
  });

  it("stride = 32 (quét cột) làm vỡ thành 32 giao dịch và hiệu suất rơi xuống 3.1%", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[2].state);

    expect(res.numTransactions).toBe(32);
    expect(res.busEfficiencyPercent).toBe(3.1);
    expect(res.maxBankConflictWay).toBe(32); // 32 luồng đâm vào cùng 1 bank
    expect(res.isFullyCoalesced).toBe(false);
  });

  it("stride = 2 tạo ra 2-way bank conflict", () => {
    const logic = new LessonLogic();
    const res = logic.applyPreset(PRESETS[1].state);

    expect(res.numTransactions).toBe(2);
    expect(res.busEfficiencyPercent).toBe(50);
    expect(res.maxBankConflictWay).toBe(2);
  });
});
