import { expect, test } from 'vitest';
import { LessonLogic } from './logic.js';

test('Minibatch SGD calculations', () => {
  const logic = new LessonLogic();
  const st = logic.reset();

  // Khởi tạo 0 -> P = 0.5
  expect(st.p00).toBeCloseTo(0.5);
  expect(st.p01).toBeCloseTo(0.5);
  expect(st.p10).toBeCloseTo(0.5);
  expect(st.p11).toBeCloseTo(0.5);

  // Iy = [[1,0], [0,1]]
  // G = (P - Iy)/2 = [[-0.25, 0.25], [0.25, -0.25]]
  expect(st.g00).toBeCloseTo(-0.25);
  expect(st.g01).toBeCloseTo(0.25);
  expect(st.g10).toBeCloseTo(0.25);
  expect(st.g11).toBeCloseTo(-0.25);

  // X = [[1,0], [0,1]] -> X^T = [[1,0], [0,1]] (Identity)
  // X^T G = G
  expect(st.gT00).toBeCloseTo(-0.25);
  expect(st.gT01).toBeCloseTo(0.25);
  expect(st.gT10).toBeCloseTo(0.25);
  expect(st.gT11).toBeCloseTo(-0.25);
  
  // SGD: t - 0.2 * grad
  const next = logic.stepSGD();
  expect(next.t00).toBeCloseTo(0.05); // 0 - 0.2 * (-0.25)
  expect(next.t11).toBeCloseTo(0.05);
});
