import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, quantize, bytesPerParam, BASE } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/quantization_int8/logic.js', () => {
  it('INT8 per-tensor không ngoại lai: q = [42, -85, 127, 85, -42, 106, -127, 119], sai số TB ≈ 0.0005', () => {
    const r = new LessonLogic().applyPreset(pick('int8_clean'));
    expect(r.q).toEqual([42, -85, 127, 85, -42, 106, -127, 119]);
    expect(r.mae).toBeCloseTo(0.00051, 5);
    expect(r.verdict.type).toBe('success');
  });

  it('một ngoại lai 20: q = [1, -1, 2, 1, -1, 2, -2, 127], sai số TB 0.0421, lệch tối đa 57.5%', () => {
    const r = new LessonLogic().applyPreset(pick('int8_outlier'));
    expect(r.q).toEqual([1, -1, 2, 1, -1, 2, -2, 127]);
    expect(r.mae).toBeCloseTo(0.04213, 5);
    expect(r.maxRel).toBeCloseTo(0.575, 3);
    expect(r.verdict.type).toBe('danger');
    expect(r.scales[0]).toBeCloseTo(20 / 127, 5);
  });

  it('chia nhóm 2 cô lập ngoại lai: sai số TB 0.0024 (giảm ≈ 17 lần), chỉ -0.3 bị lệch 5%', () => {
    const r = new LessonLogic().applyPreset(pick('int8_outlier_group'));
    expect(r.q).toEqual([63, -127, 127, 85, -51, 127, -2, 127]);
    expect(r.mae).toBeCloseTo(0.00242, 5);
    expect(r.maxRel).toBeCloseTo(0.05, 2);
    expect(r.verdict.type).toBe('success');
  });

  it('INT4 per-tensor với ngoại lai: cả 7 trọng số bình thường về 0', () => {
    const r = new LessonLogic().applyPreset(pick('int4_outlier'));
    expect(r.q).toEqual([0, 0, 0, 0, 0, 0, 0, 7]);
    expect(r.zeros).toBe(7);
    expect(r.maxRel).toBe(1);
    expect(r.verdict.type).toBe('danger');
  });

  it('INT4 chia nhóm không ngoại lai: sai số TB 0.0051, lệch tối đa 14.3%', () => {
    const r = new LessonLogic().applyPreset(pick('int4_group'));
    expect(r.mae).toBeCloseTo(0.0051, 4);
    expect(r.maxRel).toBeCloseTo(0.143, 3);
  });

  it('bộ nhớ và tốc độ mô hình 7B: FP16 14 GB (143 token/s), INT8 7 GB (286), INT4 3.5 GB (571)', () => {
    expect(bytesPerParam(8, 'tensor')).toBe(1);
    expect(bytesPerParam(4, 'tensor')).toBe(0.5);
    const a = new LessonLogic().applyPreset(pick('int8_clean'));
    expect(a.gb).toBeCloseTo(7, 3);
    expect(a.tokensPerSec).toBeCloseTo(285.7, 1);
    expect(a.speedup).toBe(2);
    const b = new LessonLogic().applyPreset({ bits: 4, scheme: 'tensor', outlier: false });
    expect(b.gb).toBeCloseTo(3.5, 3);
    expect(b.speedup).toBe(4);
    const c = new LessonLogic().applyPreset({ bits: 8, scheme: 'group', outlier: false });
    expect(c.bytesPerParam).toBeCloseTo(1.0156, 4);
  });

  it('giá trị gốc không đổi (BASE chưa bị sửa)', () => {
    expect(BASE[7]).toBe(0.28);
    expect(quantize(BASE, 8, 'tensor').q.length).toBe(8);
  });
});
