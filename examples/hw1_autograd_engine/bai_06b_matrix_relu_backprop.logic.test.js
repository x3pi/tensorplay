import { expect, test } from 'vitest';
import { LessonLogic } from './bai_06b_matrix_relu_backprop.logic.js';

test('Matrix ReLU Backprop calculations', () => {
  const logic = new LessonLogic();
  const st = logic.reset();

  // Z1 = [1.0, -1.0]
  expect(st.z1_0).toBeCloseTo(1.0);
  expect(st.z1_1).toBeCloseTo(-1.0);
  // A1 = [1.0, 0.0]
  expect(st.a1_0).toBeCloseTo(1.0);
  expect(st.a1_1).toBeCloseTo(0.0);
  
  // Z2 = [1.0, 0.0]
  expect(st.z2_0).toBeCloseTo(1.0);
  expect(st.z2_1).toBeCloseTo(0.0);
  
  // y = 1 (Đi thẳng) => G2 = [P0, P1-1] => P0 ~ 0.731, P1 ~ 0.269 
  // G2 = [+0.731, -0.731]
  expect(st.g2_0).toBeGreaterThan(0.7);
  expect(st.g2_1).toBeLessThan(-0.7);

  // M = [1, 0]
  expect(st.m0).toBe(1);
  expect(st.m1).toBe(0);

  // G1_1 must be exactly 0 due to ReLU death
  expect(st.g1_1).toBeCloseTo(0);
  
  // gw1 col 1 must be 0
  expect(st.gw1_01).toBeCloseTo(0);
  expect(st.gw1_11).toBeCloseTo(0);
});
