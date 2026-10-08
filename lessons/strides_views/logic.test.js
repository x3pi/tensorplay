import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, MEMORY, isContiguous } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/strides_views/logic.js', () => {
  it('View gốc 2×3 strides [3,1]: ô (1,2) nằm ở địa chỉ 5 = "f"', () => {
    const logic = new LessonLogic();
    const r = logic.calculate();
    expect(r.selectedAddr).toBe(5);
    expect(r.values).toEqual([['a', 'b', 'c'], ['d', 'e', 'f']]);
    expect(r.contiguous).toBe(true);
    expect(r.verdict.type).toBe('success');
  });

  it('Transpose chỉ đổi strides thành [1,3], không sao chép, nhưng mất tính liền mạch', () => {
    const logic = new LessonLogic();
    const r = logic.applyPreset(pick('transpose'));
    expect(r.values).toEqual([['a', 'd'], ['b', 'e'], ['c', 'f']]);
    expect(r.contiguous).toBe(false);
    expect(r.uniqueCells).toBe(6);
    expect(r.compacted).toEqual(['a', 'd', 'b', 'e', 'c', 'f']);
    expect(r.copyBytesIfCompact).toBe(24);
    expect(r.verdict.type).toBe('warning');
  });

  it('Slice X[:, 1:] chỉ dời offset = 1', () => {
    const logic = new LessonLogic();
    const r = logic.applyPreset({ ...pick('slice'), selected: [1, 1] });
    expect(r.values).toEqual([['b', 'c'], ['e', 'f']]);
    expect(r.selectedAddr).toBe(1 + 1 * 3 + 1 * 1);
  });

  it('Broadcast bằng stride 0: 9 phần tử logic chỉ dùng 3 ô nhớ thật', () => {
    const logic = new LessonLogic();
    const r = logic.applyPreset(pick('broadcast'));
    expect(r.numElements).toBe(9);
    expect(r.uniqueCells).toBe(3);
    expect(r.values[2]).toEqual(['a', 'b', 'c']);
    expect(r.hasZeroStride).toBe(true);
  });

  it('Reshape 3×2 của mảng liền mạch có strides [2,1] và vẫn liền mạch', () => {
    const logic = new LessonLogic();
    const r = logic.applyPreset(pick('reshape'));
    expect(r.values).toEqual([['a', 'b'], ['c', 'd'], ['e', 'f']]);
    expect(r.contiguous).toBe(true);
  });

  it('Phát hiện vượt biên khi strides tự chỉnh trỏ ra ngoài 6 ô', () => {
    const logic = new LessonLogic();
    const r = logic.onUserUpdate({ shape: [3, 3], strides: [3, 1], offset: 0 });
    expect(r.outOfBounds).toBe(true);
    expect(r.compacted).toBeNull();
    expect(r.verdict.type).toBe('danger');
    expect(MEMORY.length).toBe(6);
  });

  it('isContiguous bỏ qua stride của chiều có kích thước 1', () => {
    expect(isContiguous([1, 3], [99, 1])).toBe(true);
    expect(isContiguous([2, 3], [1, 2])).toBe(false);
  });
});
