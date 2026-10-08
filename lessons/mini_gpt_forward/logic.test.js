import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, forward, layerNorm, posEnc, SEQUENCES, STAGE_NAMES } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;
const near = (A, B, tol = 1e-3) => A.flat().every((v, i) => Math.abs(v - B.flat()[i]) < tol);

describe('lessons/mini_gpt_forward/logic.js', () => {
  it('mã vị trí: [0,0,0,1], [0,0,1,0], [0,0,0,-1]', () => {
    expect(posEnc(3)).toEqual([[0, 0, 0, 1], [0, 0, 1, 0], [0, 0, 0, -1]]);
  });

  it('x = E + PE cho "Robot nhặt pin" là [[1,0,0,1],[0,1,1,0],[0,0,1,-1]]', () => {
    const r = new LessonLogic().applyPreset({ seq: 'seqA', stage: 2 });
    expect(r.matrix).toEqual([[1, 0, 0, 1], [0, 1, 1, 0], [0, 0, 1, -1]]);
    expect(r.shape).toEqual([3, 4]);
  });

  it('LayerNorm 1 cho [[1,-1,-1,1],[-1,1,1,-1],[0,0,1.414,-1.414]]', () => {
    const r = new LessonLogic().applyPreset({ seq: 'seqA', stage: 3 });
    expect(near(r.matrix, [[1, -1, -1, 1], [-1, 1, 1, -1], [0, 0, 1.414, -1.414]])).toBe(true);
  });

  it('attention nhân quả: hàng đầu chỉ nhìn chính nó (A_0 = H_1[0]); hàng 2 trộn hai token', () => {
    const r = new LessonLogic().applyPreset({ seq: 'seqA', stage: 4 });
    expect(near([r.matrix[0]], [[1, -1, -1, 1]])).toBe(true);
    expect(near([r.matrix[1]], [[-0.888, 0.888, 0.888, -0.888]])).toBe(true);
    expect(r.attnWeights[0][0]).toEqual([1, 0, 0]);
    expect(r.attnWeights[0][1][0] + r.attnWeights[0][1][1]).toBeCloseTo(1, 2);
  });

  it('logits hàng cuối [-0.165, -0.165, 1.56, -1.229], xác suất token kế tiếp "pin" ≈ 70.5%', () => {
    const r = new LessonLogic().applyPreset(pick('final_probs'));
    expect(near([r.all[8][2]], [[-0.165, -0.165, 1.56, -1.229]])).toBe(true);
    expect(r.nextToken).toBe('pin');
    expect(r.nextProb).toBeCloseTo(0.705, 3);
    r.all[9].forEach(row => expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 2));
  });

  it('tính nhân quả: đổi token cuối KHÔNG đổi logits của hai hàng đầu', () => {
    const a = forward(SEQUENCES.seqA);
    const b = forward(SEQUENCES.seqB);
    expect(near(a.logits.slice(0, 2), b.logits.slice(0, 2), 1e-12)).toBe(true);
    expect(near([a.logits[2]], [b.logits[2]], 1e-6)).toBe(false);
  });

  it('đếm tham số: attention 64 + FFN 64 + embedding 16 = 144, FLOPs/token ≈ 288', () => {
    const r = new LessonLogic().calculate();
    expect(r.params).toEqual({ attention: 64, ffn: 64, embedding: 16, total: 144 });
    expect(r.flopsPerToken).toBe(288);
  });

  it('có đủ 10 giai đoạn, tên và ma trận; LayerNorm không có -0', () => {
    expect(STAGE_NAMES.length).toBe(10);
    const r = new LessonLogic().calculate();
    expect(r.all.length).toBe(10);
    expect(layerNorm([[1, 2, 3, 4]])[0].every(v => Number.isFinite(v))).toBe(true);
  });
});
