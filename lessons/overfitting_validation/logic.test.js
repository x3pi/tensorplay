import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, polyfit, polyval, TRAIN, VAL } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/overfitting_validation/logic.js', () => {
  it('bậc 1 ra y = 0.3 + 0.8x, train MSE 0.2, val MSE 0.06', () => {
    const c = polyfit(TRAIN.x, TRAIN.y, 1);
    expect(c[0]).toBeCloseTo(0.3, 10);
    expect(c[1]).toBeCloseTo(0.8, 10);
    const res = new LessonLogic().applyPreset(pick('good_fit'));
    expect(res.trainMse).toBeCloseTo(0.2, 4);
    expect(res.valMse).toBeCloseTo(0.06, 4);
    expect(res.verdict.type).toBe('success');
  });

  it('bậc 3 nội suy đúng 4 điểm train (MSE = 0) nhưng val MSE = 2.375', () => {
    const res = new LessonLogic().applyPreset(pick('overfit'));
    expect(res.trainMse).toBeCloseTo(0, 8);
    expect(res.valMse).toBeCloseTo(2.375, 4);
    expect(res.verdict.type).toBe('danger');
    TRAIN.x.forEach((x, i) => expect(polyval(polyfit(TRAIN.x, TRAIN.y, 3), x)).toBeCloseTo(TRAIN.y[i], 8));
  });

  it('bậc 0 là trung bình 1.5: train MSE 1, val MSE 1.5', () => {
    const res = new LessonLogic().applyPreset(pick('underfit'));
    expect(res.coef[0]).toBeCloseTo(1.5, 4);
    expect(res.trainMse).toBeCloseTo(1.0, 4);
    expect(res.valMse).toBeCloseTo(1.5, 4);
  });

  it('lỗi train giảm đơn điệu theo bậc, còn lỗi val thì không (chữ U)', () => {
    const r = [0, 1, 2, 3].map(d => new LessonLogic().onUserUpdate({ degree: d }));
    for (let i = 1; i < r.length; i++) expect(r[i].trainMse).toBeLessThanOrEqual(r[i - 1].trainMse + 1e-9);
    expect(r[3].valMse).toBeGreaterThan(r[1].valMse);
    expect(r[0].bestDegree).toBeGreaterThanOrEqual(1);
    expect(r[0].bestDegree).toBeLessThanOrEqual(2);
  });

  it('tập val không trùng điểm nào của tập train', () => {
    VAL.x.forEach(x => expect(TRAIN.x).not.toContain(x));
  });
});
