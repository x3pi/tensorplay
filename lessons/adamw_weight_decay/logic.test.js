import { describe, it, expect } from 'vitest';
import {
  LessonLogic,
  PRESETS,
  stepSgdL2,
  stepAdamL2,
  stepAdamW,
  simulateTrajectory
} from './logic.js';

describe('lessons/adamw_weight_decay/logic.js', () => {
  it('Bước 1 với w=1.0, g=0, lr=0.1, lambda=0.1: AdamW ra 0.99, Adam+L2 nổ lực kéo ra 0.90', () => {
    const w0 = 1.0;
    const g = 0.0;
    const lr = 0.1;
    const lamb = 0.1;

    const resSgd = stepSgdL2(w0, g, lr, lamb);
    expect(resSgd.wNew).toBeCloseTo(0.99, 4);

    const resAdamW = stepAdamW(w0, g, lr, lamb, 0, 0, 1);
    expect(resAdamW.wNew).toBeCloseTo(0.99, 4);
    expect(resAdamW.decayStep).toBeCloseTo(0.01, 4);

    const resAdamL2 = stepAdamL2(w0, g, lr, lamb, 0, 0, 1);
    expect(resAdamL2.wNew).toBeCloseTo(0.90, 4);
    expect(resAdamL2.step).toBeCloseTo(0.10, 4);
  });

  it('Hiện tượng liệt hệ số lambda trong Adam+L2: đổi lambda=0.01 vẫn ra 0.90', () => {
    const w0 = 1.0;
    const g = 0.0;
    const lr = 0.1;
    const lambSmall = 0.01;

    // Adam + L2: lambda bị triệt tiêu do m_hat / sqrt(v_hat) = 1.0
    const resAdamL2 = stepAdamL2(w0, g, lr, lambSmall, 0, 0, 1);
    expect(resAdamL2.wNew).toBeCloseTo(0.90, 4);

    // AdamW: điều hòa đúng tỉ lệ với lambda
    const resAdamW = stepAdamW(w0, g, lr, lambSmall, 0, 0, 1);
    expect(resAdamW.wNew).toBeCloseTo(0.999, 4);
  });

  it('Mô phỏng quỹ đạo 5 bước: AdamW khớp SGD chuẩn, Adam+L2 suy giảm cực nhanh', () => {
    const trajAdamW = simulateTrajectory('adamw', 5, { w0: 1.0, gData: 0.0, lr: 0.1, lamb: 0.1 });
    const trajSgd = simulateTrajectory('sgd_l2', 5, { w0: 1.0, gData: 0.0, lr: 0.1, lamb: 0.1 });
    const trajAdamL2 = simulateTrajectory('adam_l2', 5, { w0: 1.0, gData: 0.0, lr: 0.1, lamb: 0.1 });

    // Khi g=0, AdamW và SGD+L2 cho quỹ đạo tương đương
    expect(trajAdamW[1].w).toBeCloseTo(0.99, 4);
    expect(trajAdamW[5].w).toBeCloseTo(0.9510, 3);
    expect(trajAdamW[5].w).toBeCloseTo(trajSgd[5].w, 3);

    // Adam+L2 teo rất nhanh
    expect(trajAdamL2[1].w).toBeCloseTo(0.90, 4);
    expect(trajAdamL2[5].w).toBeCloseTo(0.5080, 3);
    expect(trajAdamL2[5].w).toBeLessThan(0.60);
  });

  it('LessonLogic hoạt động chuẩn xác với các presets', () => {
    const logic = new LessonLogic();
    const stDefault = logic.calculate();

    expect(stDefault.state.optimizer).toBe('adamw');
    expect(stDefault.verdict.type).toBe('success');

    // Chuyển sang preset Adam+L2 cũ
    const presetFail = PRESETS.find(p => p.id === 'adam_l2_fail');
    logic.applyPreset(presetFail.state);
    const stFail = logic.calculate();
    expect(stFail.verdict.type).toBe('danger');
    expect(stFail.step1Details.wNew).toBeCloseTo(0.90, 4);

    // Chuyển sang preset SGD baseline
    const presetSgd = PRESETS.find(p => p.id === 'sgd_baseline');
    logic.applyPreset(presetSgd.state);
    const stSgd = logic.calculate();
    expect(stSgd.verdict.type).toBe('warning');
  });
});
