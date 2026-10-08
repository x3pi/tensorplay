import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

// Mỗi assertion phải khớp giá trị tính độc lập trong kiem_tra.py (numpy), không tính lại bằng chính công thức trong logic.js.
describe('lessons/{{SLUG}}/logic.js', () => {
  it('mặc định: y = 4', () => {
    expect(new LessonLogic().reset().y).toBe(4);
  });

  it('trường hợp biên x = 0 không sinh -0', () => {
    const r = new LessonLogic().applyPreset(pick('zero'));
    expect(Object.is(r.y, 0)).toBe(true);
  });
});
