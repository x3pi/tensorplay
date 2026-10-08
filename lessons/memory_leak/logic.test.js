import { expect, test } from 'vitest';
import { LessonLogic } from './logic.js';

test('Memory Leak calculations', () => {
  const logic = new LessonLogic();
  const st = logic.reset();

  // 60000 images, batch 100 => 600 batches
  expect(st.n_batches).toBe(600);
  
  // 100 * 10 * 4 = 4000 bytes per batch
  expect(st.bytesPerBatch).toBe(4000);
  
  // 600 * 4000 = 2,400,000 bytes per epoch
  expect(st.bytesPerEpoch).toBe(2400000);
  
  // 50 epochs => 120,000,000 bytes
  expect(st.totalBytes).toBe(120000000);
  expect(st.totalMb).toBeCloseTo(114.44); // 120,000,000 / (1024*1024) = 114.44
  
  // When fixed
  const stFixed = logic.onUserUpdate({ isFixed: true });
  expect(stFixed.leakBytes).toBe(0);
});
