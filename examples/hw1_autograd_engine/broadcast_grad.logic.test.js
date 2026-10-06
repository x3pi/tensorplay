import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, forward, biasGrad, DEFAULT_Y } from './broadcast_grad.logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('examples/hw1_autograd_engine/broadcast_grad.logic.js', () => {
  it('Forward ban đầu: G = Z − Y = [[-1,0],[-1,-1]], L = 1.5', () => {
    const { G, loss } = forward([0, 0], 'row', DEFAULT_Y);
    expect(G).toEqual([[-1, 0], [-1, -1]]);
    expect(loss).toBe(1.5);
  });

  it('Cộng dồn đúng: grad = [-2, -1], lr 0.5 → b = [1, 0.5], L = 0.25 (tối ưu)', () => {
    const r = new LessonLogic().calculate();
    expect(r.grad).toEqual([-2, -1]);
    expect(r.firstStepB).toEqual([1, 0.5]);
    expect(r.lossHistory).toEqual([1.5, 0.25]);
    expect(r.lossOpt).toBe(0.25);
    expect(r.verdict.type).toBe('success');
  });

  it('Bug gán đè: grad = [-1, -1], L = 0.5 và kẹt ở 0.5 dù chạy nhiều bước', () => {
    const logic = new LessonLogic();
    let r = logic.applyPreset(pick('row_overwrite'));
    expect(r.grad).toEqual([-1, -1]);
    expect(r.lossHistory[1]).toBe(0.5);
    r = logic.onUserUpdate({ steps: 10 });
    expect(r.finalLoss).toBeCloseTo(0.5, 2);
    expect(r.finalLoss).toBeGreaterThan(r.lossOpt + 0.2);
    expect(r.finalB[0]).toBeCloseTo(1, 2);
    expect(r.finalB[1]).toBeCloseTo(1, 2);
    expect(r.verdict.type).toBe('warning');
  });

  it('Bug quên sum: lỗi shape (2,2) ≠ (1,2)', () => {
    const r = new LessonLogic().applyPreset(pick('row_noreduce'));
    expect(r.shapeError).toBe(true);
    expect(r.verdict.type).toBe('danger');
  });

  it('Bias vô hướng: grad = -3; lr 0.5 → L đứng yên 1.5; lr 0.25 → L = 0.375', () => {
    const logic = new LessonLogic();
    let r = logic.applyPreset(pick('scalar_sum'));
    expect(r.grad).toBe(-3);
    expect(r.lossHistory).toEqual([1.5, 1.5]);
    r = logic.applyPreset(pick('scalar_small_lr'));
    expect(r.lossHistory).toEqual([1.5, 0.375]);
  });

  it('biasGrad scalar + overwrite chỉ lấy phần tử cuối', () => {
    expect(biasGrad([[-1, 0], [-1, -1]], 'scalar', 'overwrite').grad).toBe(-1);
  });
});
