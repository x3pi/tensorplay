import { describe, it, expect } from 'vitest';
import {
  LessonLogic,
  PRESETS,
  logSumExp,
  safeSoftmax,
  naiveSoftmax,
  crossEntropyLSE,
  crossEntropyNaive,
  crossEntropyGrad,
  crossEntropyGradNaive,
  roundTo,
  buildRoutes,
  texNum,
  OVERFLOW_AT,
  UNDERFLOW_AT
} from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/cross_entropy_logsumexp/logic.js', () => {
  it('logit vừa phải [2, 1], y = 1: Naive và LSE cho cùng Loss 1.3133 (FP32 và FP16)', () => {
    const z = [2.0, 1.0];
    expect(logSumExp(z, 'fp32')).toBeCloseTo(2.3133, 4);
    expect(crossEntropyLSE(z, 1, 'fp32')).toBeCloseTo(1.3133, 4);
    expect(crossEntropyNaive(z, 1, 'fp32')).toBeCloseTo(1.3133, 4);
    expect(crossEntropyLSE(z, 1, 'fp16')).toBeCloseTo(1.3133, 2);
    const p = safeSoftmax(z, 'fp32');
    expect(p[0] + p[1]).toBeCloseTo(1.0, 6);
    const g = crossEntropyGrad(z, 1, 'fp32');
    expect(g[0] + g[1]).toBeCloseTo(0.0, 6);
    expect(g[0]).toBeCloseTo(p[0], 6);
    expect(g[1]).toBeCloseTo(p[1] - 1, 6);
  });

  it('hụt số FP32 [0, -110], y = 1: Naive ra Infinity, LSE ra đúng 110, gradient LSE [1, -1], gradient Naive NaN', () => {
    const z = [0, -110];
    expect(naiveSoftmax(z, 'fp32')[1]).toBe(0);
    expect(crossEntropyNaive(z, 1, 'fp32')).toBe(Infinity);
    expect(logSumExp(z, 'fp32')).toBe(0);
    expect(crossEntropyLSE(z, 1, 'fp32')).toBe(110);
    expect(crossEntropyGrad(z, 1, 'fp32')).toEqual([1, -1]);
    expect(crossEntropyGradNaive(z, 1, 'fp32').every(Number.isNaN)).toBe(true);
  });

  it('tràn số FP32 [100, 99], y = 0: Naive NaN, LSE ≈ 0.3133', () => {
    const z = [100, 99];
    expect(naiveSoftmax(z, 'fp32').every(v => Number.isNaN(v) || v === 0)).toBe(true);
    expect(Number.isNaN(crossEntropyNaive(z, 0, 'fp32'))).toBe(true);
    expect(crossEntropyLSE(z, 0, 'fp32')).toBeCloseTo(0.3133, 3);
  });

  it('ngưỡng tràn: FP32 ở logit 88.72, FP16 ở logit 11.09; hụt ở -103.28 và -16.64', () => {
    expect(OVERFLOW_AT.fp32).toBeCloseTo(88.7228, 3);
    expect(OVERFLOW_AT.fp16).toBeCloseTo(11.09, 2);
    expect(UNDERFLOW_AT.fp32).toBeCloseTo(-103.28, 2);
    expect(UNDERFLOW_AT.fp16).toBeCloseTo(-16.64, 2);
    expect(Math.exp(88)).toBeLessThan(3.4028e38);
    expect(roundTo(Math.exp(88), 'fp32')).toBeLessThan(Infinity);
    expect(roundTo(Math.exp(89), 'fp32')).toBe(Infinity);
    expect(roundTo(Math.exp(11), 'fp16')).toBe(59872); // 59874 làm tròn về FP16
    expect(roundTo(Math.exp(12), 'fp16')).toBe(Infinity);
  });

  it('FP16: logit 12 đã làm Naive hỏng nhưng LSE cho 0.3125 (sai số làm tròn FP16)', () => {
    const r = new LessonLogic().applyPreset(pick('fp16_overflow'));
    expect(Number.isNaN(r.lossNaive)).toBe(true);
    expect(r.lossLSE).toBe(0.3125);
    expect(r.gradNaiveBroken).toBe(true);
  });

  it('FP16: logit -20 hụt số, Naive ra Infinity, LSE ra 20', () => {
    const r = new LessonLogic().applyPreset(pick('fp16_underflow'));
    expect(r.lossNaive).toBe(Infinity);
    expect(r.lossLSE).toBe(20);
  });

  it('cùng logit [12, 11] ở FP32 vẫn bình thường (Naive không hỏng)', () => {
    const r = new LessonLogic().applyPreset({ z0: 12, z1: 11, y: 0, mode: 'naive', precision: 'fp32' });
    expect(r.naiveBroken).toBe(false);
    expect(r.lossNaive).toBeCloseTo(0.3133, 3);
    expect(r.verdict.type).toBe('warning');
  });

  it('LessonLogic: preset và công tắc mode đổi kết luận đúng', () => {
    const logic = new LessonLogic();
    expect(logic.calculate().verdict.type).toBe('success');

    logic.applyPreset(pick('underflow'));
    expect(logic.calculate().verdict.text).toContain('CỨU NGUY');

    logic.onUserUpdate({ mode: 'naive' });
    const naive = logic.calculate();
    expect(naive.verdict.type).toBe('danger');
    expect(naive.verdict.text).toContain('Underflow');

    logic.applyPreset(pick('overflow'));
    logic.onUserUpdate({ mode: 'naive' });
    expect(logic.calculate().verdict.text).toContain('tràn số');
  });

  it('công thức KaTeX đổi theo mode và có trạng thái +∞ / NaN đúng', () => {
    const logic = new LessonLogic();
    expect(logic.calculate().formulaKaTeX).toContain('\\text{LogSumExp}(z)');
    logic.applyPreset(pick('underflow'));
    logic.onUserUpdate({ mode: 'naive' });
    expect(logic.calculate().formulaKaTeX).toContain('+\\infty');
    logic.applyPreset(pick('overflow'));
    logic.onUserUpdate({ mode: 'naive' });
    expect(logic.calculate().formulaKaTeX).toContain('NaN');
    logic.onUserUpdate({ mode: 'lse' });
    expect(logic.calculate().formulaKaTeX).toContain('\\text{LogSumExp}(z)');
  });

  it('tính chất toán: max(z) <= LSE(z) <= max(z) + ln K và gradient LSE luôn cộng bằng 0', () => {
    for (const z of [[0, 0], [5, -3], [50, 49], [-20, 10]]) {
      const lse = logSumExp(z, 'fp32');
      expect(lse).toBeGreaterThanOrEqual(Math.max(...z) - 1e-6);
      expect(lse).toBeLessThanOrEqual(Math.max(...z) + Math.log(2) + 1e-6);
      const g = crossEntropyGrad(z, 0, 'fp32');
      expect(Math.abs(g[0] + g[1])).toBeLessThan(1e-6);
    }
  });

  it('đường B (Softmax an toàn rồi ln) chống được tràn nhưng KHÔNG chống được hụt số', () => {
    const over = new LessonLogic().applyPreset(pick('overflow'));
    expect(Number.isNaN(over.lossNaive)).toBe(true);
    expect(over.lossSafeLog).toBeCloseTo(0.3133, 3);
    expect(over.safeBroken).toBe(false);

    const under = new LessonLogic().applyPreset(pick('underflow'));
    expect(under.lossSafeLog).toBe(Infinity);
    expect(under.safeBroken).toBe(true);
    expect(under.lossLSE).toBe(110);
  });

  it('ba đường đi ghi lại bước hỏng đầu tiên: A hỏng ở p khi hụt, ở exp khi tràn; C không hỏng bước nào', () => {
    const under = buildRoutes([0, -110], 1, 'fp32');
    const [A, B, C] = under;
    expect(A.steps.findIndex(s => s.bad)).toBe(2); // p = exp / Σ (p_y = 0)
    expect(B.steps.findIndex(s => s.bad)).toBe(2);
    expect(C.steps.some(s => s.bad)).toBe(false);
    expect([A.ok, B.ok, C.ok]).toEqual([false, false, true]);

    const over = buildRoutes([100, 99], 0, 'fp32');
    expect(over[0].steps.findIndex(s => s.bad)).toBe(0); // exp(z) = Infinity
    expect(over.map(r => r.ok)).toEqual([false, true, true]);

    const ok = buildRoutes([2, 1], 1, 'fp32');
    expect(ok.every(r => r.ok && r.steps.every(s => !s.bad))).toBe(true);
    expect(ok[0].loss).toBeCloseTo(ok[2].loss, 6);
  });

  it('chế độ safe cho kết luận riêng: tràn -> cứu được (warning), hụt -> vẫn hỏng (danger)', () => {
    const logic = new LessonLogic();
    logic.applyPreset(pick('overflow'));
    logic.onUserUpdate({ mode: 'safe' });
    expect(logic.calculate().verdict.type).toBe('warning');
    logic.applyPreset(pick('underflow'));
    logic.onUserUpdate({ mode: 'safe' });
    const r = logic.calculate();
    expect(r.verdict.type).toBe('danger');
    expect(r.verdict.text).toContain('VẪN HỎNG');
    expect(r.lossActive).toBe(Infinity);
    expect(r.formulaKaTeX).toContain('+\\infty');
  });

  it('công thức đầy đủ thay số sống: có softmax, LSE, loss 3 đường và gradient', () => {
    const r = new LessonLogic().applyPreset(pick('normal'));
    const F = r.formulas;
    expect(Object.keys(F)).toEqual(['softmaxNaive', 'softmaxSafe', 'lse', 'lossA', 'lossB', 'lossC', 'grad']);
    expect(F.softmaxNaive).toContain('\\frac{e^{z_i}}{\\sum_j e^{z_j}}');
    expect(F.softmaxNaive).toContain('[7.3891,\\ 2.7183]');
    expect(F.softmaxSafe).toContain('z - m');
    expect(F.lse).toContain('\\ln(1.3679)');
    expect(F.lossC).toContain('2.3133 - (1) = 1.3133');
    expect(F.grad).toContain('[0.73106,\\ -0.73106]');
  });

  it('công thức đầy đủ ở tình huống lỗi hiển thị ∞ và NaN đúng chỗ', () => {
    const under = new LessonLogic().applyPreset(pick('underflow')).formulas;
    expect(under.lossA).toContain('-\\ln(0) = \\infty');
    expect(under.lossB).toContain('= \\infty');
    expect(under.lossC).toContain('0 - (-110) = 110');
    const over = new LessonLogic().applyPreset(pick('overflow')).formulas;
    expect(over.softmaxNaive).toContain('\\infty');
    expect(over.softmaxNaive).toContain('\\text{NaN}');
    expect(over.lossA).toContain('\\text{NaN}');
    expect(over.lossB).toContain('0.73106');
  });

  it('texNum: ký hiệu khoa học cho số rất lớn/nhỏ, ∞ và NaN', () => {
    expect(texNum(Infinity)).toBe('\\infty');
    expect(texNum(NaN)).toBe('\\text{NaN}');
    expect(texNum(0)).toBe('0');
    expect(texNum(1.7e-48)).toBe('1.70 \\times 10^{-48}');
    expect(texNum(162754.79)).toBe('1.63 \\times 10^{5}');
    expect(texNum(2.5)).toBe('2.5');
  });

  it('chiều ngược: điểm hỏng chung với chiều xuôi (p_y = 0), đường C không bao giờ hỏng', () => {
    const c = new LessonLogic().applyPreset(pick('underflow'));
    const [A, B, C] = c.routes;
    // Xuôi: p_y = 0 ở bước 3 (đỏ); ngược: ∂L/∂p_y = -1/0 = -Infinity ở đúng bước đó
    expect(A.steps[2].level).toBe('bad');
    expect(A.steps[2].back.value).toBe(-Infinity);
    expect(A.steps[1].back.value).toBeNaN(); // (-Inf) * 0
    expect(A.grad.every(Number.isNaN)).toBe(true);
    expect(B.grad.every(Number.isNaN)).toBe(true);
    expect(C.grad).toEqual([1, -1]);
    C.steps.forEach(st => expect(st.back.level).toBe(''));
  });

  it('chiều ngược: tràn số làm NaN lan từ bước p; B và C giữ gradient hữu hạn', () => {
    const [A, B, C] = new LessonLogic().applyPreset(pick('overflow')).routes;
    expect(A.steps[2].back.value).toBeNaN();
    expect(A.grad.every(Number.isNaN)).toBe(true);
    expect(B.grad.every(Number.isFinite)).toBe(true);
    expect(C.grad[0] + C.grad[1]).toBeCloseTo(0, 5);
  });

  it('chiều ngược: khi không hỏng, gradient mọi đường đều bằng p - 1[y]', () => {
    const calc = new LessonLogic().applyPreset(pick('normal'));
    calc.routes.forEach(r => r.grad.forEach((g, i) => expect(g).toBeCloseTo(calc.grad[i], 5)));
  });
});
