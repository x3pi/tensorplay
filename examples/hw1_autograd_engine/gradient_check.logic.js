/**
 * Logic Module: Kiểm tra gradient bằng số (Gradient Check).
 * Path: examples/hw1_autograd_engine/gradient_check.logic.js
 *
 * Bài toán: robot dự đoán độ sáng biển báo y = w · x.
 *   f(w) = (w · x − y)²,  x = [1, 2], y = 3, w = [0.5, 0.5]  →  f = 2.25
 *   Gradient giải tích đúng: ∇f = 2 (w · x − y) x = [−3, −6]
 *
 * Gradient số:
 *   sai phân trung tâm:  (f(w + εe_k) − f(w − εe_k)) / (2ε)   — sai số O(ε²)
 *   sai phân tiến:       (f(w + εe_k) − f(w)) / ε             — sai số O(ε)
 * Độ chính xác float32 được mô phỏng bằng Math.fround sau mỗi phép tính.
 */

export const X = [1, 2];
export const Y_TARGET = 3;
export const W0 = [0.5, 0.5];
export const REL_ERR_THRESHOLD = 1e-3;

/** Hàm làm tròn theo độ chính xác đang chọn */
const rounder = (precision) => (precision === 'f32' ? Math.fround : (v) => v);

/** f(w) = (w·x − y)², mỗi phép tính đều được làm tròn theo precision */
export function loss(w, precision = 'f64') {
  const r = rounder(precision);
  const dot = r(r(r(w[0]) * r(X[0])) + r(r(w[1]) * r(X[1])));
  const diff = r(dot - r(Y_TARGET));
  return r(diff * diff);
}

/** Gradient giải tích theo từng phiên bản "code" (đúng hoặc có bug) */
export function analyticGrad(w, bug = 'none') {
  const diff = w[0] * X[0] + w[1] * X[1] - Y_TARGET;
  switch (bug) {
    case 'forget2': return [diff * X[0], diff * X[1]];          // quên hệ số 2
    case 'forgetx': return [2 * diff, 2 * diff];                // quên nhân x (quy tắc chuỗi)
    case 'sign':    return [-2 * diff * X[0], -2 * diff * X[1]]; // sai dấu
    default:        return [2 * diff * X[0], 2 * diff * X[1]];
  }
}

/** Gradient số với ε, phương pháp và độ chính xác cho trước */
export function numericGrad(w, eps, method = 'central', precision = 'f64') {
  const r = rounder(precision);
  const e = r(eps);
  return w.map((_, k) => {
    const wp = [...w]; wp[k] = r(w[k] + e);
    const fp = loss(wp, precision);
    if (method === 'forward') {
      const f0 = loss(w, precision);
      return r(r(fp - f0) / e);
    }
    const wm = [...w]; wm[k] = r(w[k] - e);
    const fm = loss(wm, precision);
    return r(r(fp - fm) / r(2 * e));
  });
}

const norm = (v) => Math.sqrt(v.reduce((s, a) => s + a * a, 0));

/** Sai số tương đối ‖a − n‖ / (‖a‖ + ‖n‖) — chuẩn dùng trong CS231n / Needle */
export function relativeError(a, n) {
  const diff = norm(a.map((v, i) => v - n[i]));
  const denom = norm(a) + norm(n);
  return denom === 0 ? 0 : diff / denom;
}

const round = (x, d = 6) => {
  const p = 10 ** d;
  return Math.round(x * p) / p;
};
const fmtSci = (x) => (x === 0 ? '0' : Math.abs(x) < 1e-3 || Math.abs(x) >= 1e4 ? x.toExponential(2) : String(round(x, 6)));

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      bug: 'none',
      method: 'central',
      epsExp: 4,           // ε = 10^(−epsExp)
      precision: 'f64',
      lr: 0.1
    };
    return this.calculate();
  }

  applyPreset(presetState) {
    this.state = { ...this.state, ...presetState };
    return this.calculate();
  }

  onUserUpdate(partialState) {
    this.state = { ...this.state, ...partialState };
    return this.calculate();
  }

  calculate() {
    const { bug, method, epsExp, precision, lr } = this.state;
    const eps = 10 ** -epsExp;

    const f0 = loss(W0, 'f64');
    const analytic = analyticGrad(W0, bug);
    const numeric = numericGrad(W0, eps, method, precision);
    const relErr = relativeError(analytic, numeric);
    const passed = relErr < REL_ERR_THRESHOLD;

    // Một bước gradient descent với gradient giải tích đang dùng
    const wNext = W0.map((w, k) => round(w - lr * analytic[k]));
    const fNext = round(loss(wNext, 'f64'));

    // Quét ε để vẽ đồ thị "chữ V" sai số
    const sweep = [];
    for (let k = 1; k <= 10; k++) {
      const n = numericGrad(W0, 10 ** -k, method, precision);
      sweep.push({ epsExp: k, relErr: relativeError(analyticGrad(W0, 'none'), n) });
    }

    const numericKaTeX = method === 'central'
      ? `\\frac{\\partial f}{\\partial w_0} \\approx \\frac{f(w_0 + \\varepsilon) - f(w_0 - \\varepsilon)}{2\\varepsilon} = ${fmtSci(numeric[0])}`
      : `\\frac{\\partial f}{\\partial w_0} \\approx \\frac{f(w_0 + \\varepsilon) - f(w_0)}{\\varepsilon} = ${fmtSci(numeric[0])}`;
    const relErrKaTeX = `\\text{rel\\_err} = \\frac{\\lVert g_{\\text{code}} - g_{\\text{num}} \\rVert}{\\lVert g_{\\text{code}} \\rVert + \\lVert g_{\\text{num}} \\rVert} = ${fmtSci(relErr)}`;

    let verdict;
    if (passed && bug === 'none') {
      verdict = { type: 'success', text: `✅ Khớp: sai số tương đối ${fmtSci(relErr)} < 10⁻³. Gradient trong code đáng tin.` };
    } else if (passed && bug !== 'none') {
      verdict = { type: 'warning', text: `⚠️ Bất thường: code có bug nhưng phép kiểm tra lại qua (${fmtSci(relErr)}). Hãy kiểm tra lại ε.` };
    } else if (bug === 'none') {
      verdict = {
        type: 'warning',
        text: `🔍 Code ĐÚNG nhưng phép kiểm tra báo lệch (${fmtSci(relErr)}). Nguyên nhân nằm ở phép đo: ${epsExp <= 2 ? 'ε quá lớn (sai số cắt cụt)' : 'ε quá nhỏ so với độ chính xác số thực (sai số làm tròn)'}${method === 'forward' ? ', và sai phân tiến kém chính xác hơn sai phân trung tâm' : ''}.`
      };
    } else {
      verdict = { type: 'danger', text: `❌ Phát hiện bug: sai số tương đối ${fmtSci(relErr)} ≫ 10⁻³. Đừng huấn luyện với gradient này.` };
    }

    return {
      eps,
      f0,
      analytic,
      numeric,
      relErr,
      passed,
      wNext,
      fNext,
      sweep,
      numericKaTeX,
      relErrKaTeX,
      verdict
    };
  }
}

export const PRESETS = [
  { id: 'ok', label: 'Code đúng ✅', state: { bug: 'none', method: 'central', epsExp: 4, precision: 'f64' } },
  { id: 'forget2', label: 'Bug: quên hệ số 2', state: { bug: 'forget2', method: 'central', epsExp: 4, precision: 'f64' } },
  { id: 'forgetx', label: 'Bug: quên nhân $x$', state: { bug: 'forgetx', method: 'central', epsExp: 4, precision: 'f64' } },
  { id: 'sign', label: 'Bug: sai dấu', state: { bug: 'sign', method: 'central', epsExp: 4, precision: 'f64' } },
  { id: 'forward_big', label: 'Sai phân tiến, $\\varepsilon = 0.1$', state: { bug: 'none', method: 'forward', epsExp: 1, precision: 'f64' } },
  { id: 'f32_tiny', label: 'float32, $\\varepsilon = 10^{-8}$', state: { bug: 'none', method: 'central', epsExp: 8, precision: 'f32' } }
];
