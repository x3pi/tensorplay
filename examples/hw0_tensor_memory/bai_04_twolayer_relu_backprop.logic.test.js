import { describe, expect, test } from 'vitest';
import { LessonLogic, PRESETS } from './bai_04_twolayer_relu_backprop.logic.js';

const preset = (id) => PRESETS.find(p => p.id === id).state;

describe('bai_04_twolayer_relu_backprop logic', () => {
  test('mặc định: nơ-ron 2 chết, Z1 = [1, -1], A1 = [1, 0], P ≈ [0.731, 0.269]', () => {
    const st = new LessonLogic().reset();
    expect(st.z1_0).toBeCloseTo(1.0);
    expect(st.z1_1).toBeCloseTo(-1.0);
    expect(st.a1_0).toBeCloseTo(1.0);
    expect(st.a1_1).toBeCloseTo(0.0);
    expect(st.p0).toBeCloseTo(0.7311, 4);
    expect(st.p1).toBeCloseTo(0.2689, 4);
    expect(st.loss).toBeCloseTo(1.3133, 4);
    expect(st.m0).toBe(1);
    expect(st.m1).toBe(0);
  });

  test('nơ-ron chết khóa hàng 2 của grad W2 và cột 2 của grad W1', () => {
    const st = new LessonLogic().applyPreset(preset('dead_neuron'));
    expect(Math.abs(st.gw2_10)).toBe(0);
    expect(Math.abs(st.gw2_11)).toBe(0);
    expect(st.gw2_00).toBeCloseTo(0.7311, 4);
    expect(st.g1_0).toBeCloseTo(0.7311, 4);
    expect(Math.abs(st.g1_1)).toBe(0);
    expect(Math.abs(st.gw1_01)).toBe(0);
    expect(Math.abs(st.gw1_11)).toBe(0);
    expect(st.gw1_00).toBeCloseTo(0.7311, 4);
    expect(st.gw1_10).toBeCloseTo(0.7311, 4);
  });

  test('gradient giải tích khớp sai phân hữu hạn trên mọi trọng số (mạng chuẩn)', () => {
    const base = preset('healthy');
    const keys = ['w1_00', 'w1_01', 'w1_10', 'w1_11', 'w2_00', 'w2_01', 'w2_10', 'w2_11'];
    const analytic = new LessonLogic().applyPreset(base);
    const eps = 1e-6;
    for (const k of keys) {
      const up = new LessonLogic().applyPreset({ ...base, [k]: base[k] + eps }).loss;
      const dn = new LessonLogic().applyPreset({ ...base, [k]: base[k] - eps }).loss;
      const numeric = (up - dn) / (2 * eps);
      const name = 'g' + k.replace('_', '');
      const key = k.startsWith('w1') ? `gw1_${k.slice(3)}` : `gw2_${k.slice(3)}`;
      expect(analytic[key], `${name}`).toBeCloseTo(numeric, 5);
    }
  });

  test('mạng chuẩn: SGD giảm loss 0.9741 -> 0.2348 -> 0.1188 -> 0.0715', () => {
    const logic = new LessonLogic();
    const r0 = logic.applyPreset(preset('healthy'));
    expect(r0.loss).toBeCloseTo(0.9741, 4);
    const r1 = logic.stepSGD();
    expect(r1.loss).toBeCloseTo(0.2348, 4);
    expect(r1.lossDelta).toBeLessThan(0);
    expect(r1.steps).toBe(1);
    logic.stepSGD();
    const r3 = logic.stepSGD();
    expect(r3.loss).toBeCloseTo(0.0715, 4);
  });

  test('nơ-ron chết không bao giờ hồi sinh: Z1_1 giữ nguyên -1, loss kẹt ở ln 2 sau 50 bước', () => {
    const logic = new LessonLogic();
    let r = logic.applyPreset(preset('dead_neuron'));
    for (let i = 0; i < 50; i++) r = logic.stepSGD();
    expect(r.z1_1).toBeCloseTo(-1.0, 12);
    expect(r.m1).toBe(0);
    expect(r.loss).toBeCloseTo(Math.LN2, 3);
  });

  test('chỉ W2 = 0: bước 1 grad W1 = 0 nhưng grad W2 khác 0, SGD vẫn giảm loss', () => {
    const logic = new LessonLogic();
    const r0 = logic.applyPreset(preset('w2_zero_only'));
    expect(r0.gw1_00).toBe(0);
    expect(Math.abs(r0.gw2_00)).toBeGreaterThan(0.1);
    const r1 = logic.stepSGD();
    expect(r1.loss).toBeCloseTo(0.4287, 4);
    expect(r1.loss).toBeLessThan(r0.loss);
  });

  test('lời nguyền W1 = W2 = 0: mọi gradient bằng 0 và loss đứng yên ở ln 2', () => {
    const logic = new LessonLogic();
    const r0 = logic.applyPreset(preset('all_zero'));
    for (const k of ['gw1_00', 'gw1_01', 'gw1_10', 'gw1_11', 'gw2_00', 'gw2_01', 'gw2_10', 'gw2_11']) {
      expect(Math.abs(r0[k])).toBe(0);
    }
    let r = r0;
    for (let i = 0; i < 5; i++) r = logic.stepSGD();
    expect(r.loss).toBeCloseTo(Math.LN2, 12);
    expect(r.lossDelta).toBeCloseTo(0, 12);
  });

  test('đổi trọng số bằng tay đặt lại bộ đếm bước SGD', () => {
    const logic = new LessonLogic();
    logic.stepSGD();
    const r = logic.onUserUpdate({ w1_00: 0.5 });
    expect(r.steps).toBe(0);
    expect(r.lossDelta).toBeNull();
  });
});
