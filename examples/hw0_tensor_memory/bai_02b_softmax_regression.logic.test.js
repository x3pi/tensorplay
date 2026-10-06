import { expect, test } from 'vitest';
import { LessonLogic } from './bai_02b_softmax_regression.logic.js';

test('Softmax Regression Matrix Backprop calculations', () => {
  const logic = new LessonLogic();
  const st = logic.reset();

  // Test Bài 3 từ tài liệu
  // X = [2, 1], W = [[0,0],[0,0]], y=0
  expect(st.z0).toBe(0);
  expect(st.z1).toBe(0);
  expect(st.p0).toBeCloseTo(0.5);
  expect(st.g0).toBeCloseTo(-0.5);
  expect(st.g1).toBeCloseTo(0.5);
  
  // X^T * G = [[2*-0.5, 2*0.5], [1*-0.5, 1*0.5]] = [[-1.0, 1.0], [-0.5, 0.5]]
  expect(st.gradW00).toBeCloseTo(-1.0);
  expect(st.gradW01).toBeCloseTo(1.0);
  expect(st.gradW10).toBeCloseTo(-0.5);
  expect(st.gradW11).toBeCloseTo(0.5);

  const afterSgd = logic.stepSGD();
  // W_new = W - 0.1 * grad
  expect(afterSgd.w00).toBeCloseTo(0.1);
  expect(afterSgd.w01).toBeCloseTo(-0.1);
  expect(afterSgd.w10).toBeCloseTo(0.05);
  expect(afterSgd.w11).toBeCloseTo(-0.05);
});
