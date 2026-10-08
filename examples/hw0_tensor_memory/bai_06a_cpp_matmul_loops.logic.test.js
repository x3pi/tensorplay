import { expect, test } from 'vitest';
import { LessonLogic } from './bai_06a_cpp_matmul_loops.logic.js';

test('C++ Matmul loops cơ bản', () => {
  const logic = new LessonLogic();
  const st = logic.reset();

  // Initially at step 0
  expect(st.i_curr).toBe(0);
  expect(st.j_curr).toBe(0);
  expect(st.l_curr).toBe(0);
  expect(st.idxA).toBe(0); // 0*3 + 0
  expect(st.idxB).toBe(0); // 0*2 + 0
  expect(st.idxC).toBe(0); // 0*2 + 0
  expect(st.valA).toBe(1);
  expect(st.valB).toBe(1);
  expect(st.valC).toBe(1); // 0 + 1*1
  
  // Advance to step 1 (i=0, j=0, l=1)
  const st1 = logic.onUserUpdate({ currentStep: 1 });
  expect(st1.i_curr).toBe(0);
  expect(st1.j_curr).toBe(0);
  expect(st1.l_curr).toBe(1);
  expect(st1.idxA).toBe(1); // 0*3 + 1
  expect(st1.idxB).toBe(2); // 1*2 + 0
  expect(st1.valA).toBe(2);
  expect(st1.valB).toBe(0);
  expect(st1.valC).toBe(1); // 1 + 2*0
});
