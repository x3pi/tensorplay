/**
 * LayerNorm & Residual — Chuẩn Hóa Theo Từng Mẫu, Đường Cao Tốc Cho Gradient
 * Path: lessons/layernorm_residual/logic.js
 *
 * Ma trận kích hoạt X (B mẫu x d đặc trưng), toy: X = [[1, 3], [2, 6]].
 *   - BatchNorm: chuẩn hóa theo CỘT (cùng 1 đặc trưng, qua các mẫu trong batch).
 *   - LayerNorm: chuẩn hóa theo HÀNG (cùng 1 mẫu, qua các đặc trưng) -> không phụ thuộc batch.
 * Ở bản toy dùng eps = 0 để kết quả tròn trị; nếu phương sai = 0 thì đầu ra sụp về 0 (degenerate).
 *
 * Residual: y = x + f(x)  ->  dy/dx = 1 + f'(x).
 * Qua L tầng với f' = 0.1:  không residual: 0.1^L,  có residual: 1.1^L.
 */

export const DEFAULT_X = [[1, 3], [2, 6]];
export const F_PRIME = 0.1;

const round = (v, n = 4) => Number(v.toFixed(n));

export function normalizeVec(v, eps = 0) {
  const n = v.length;
  const mean = v.reduce((s, a) => s + a, 0) / n;
  const variance = v.reduce((s, a) => s + (a - mean) ** 2, 0) / n;
  const denom = Math.sqrt(variance + eps);
  const degenerate = denom === 0;
  const out = v.map(a => (degenerate ? 0 : (a - mean) / denom));
  return { mean, variance, std: Math.sqrt(variance), out, degenerate };
}

export function layerNorm(X, eps = 0) {
  const rows = X.map(r => normalizeVec(r, eps));
  return { out: rows.map(r => r.out), stats: rows, degenerate: rows.some(r => r.degenerate) };
}

export function batchNorm(X, eps = 0) {
  const d = X[0].length;
  const cols = Array.from({ length: d }, (_, j) => normalizeVec(X.map(r => r[j]), eps));
  const out = X.map((_, i) => cols.map(c => c.out[i]));
  return { out, stats: cols, degenerate: cols.some(c => c.degenerate) };
}

export function residualGradient(depth, fPrime, useResidual) {
  return Math.pow(useResidual ? 1 + fPrime : fPrime, depth);
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      X: DEFAULT_X.map(r => [...r]),
      norm: 'ln',       // 'ln' | 'bn'
      batchSize: 2,     // 1 | 2
      useResidual: true,
      depth: 4
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
    const { X, norm, batchSize, useResidual, depth } = this.state;
    const fn = norm === 'ln' ? layerNorm : batchNorm;
    const batch = X.slice(0, batchSize);
    const res = fn(batch);

    // Mẫu 1 được chuẩn hóa ra sao khi batch=1 so với batch=2?
    const rowAtB1 = fn(X.slice(0, 1)).out[0];
    const rowAtB2 = fn(X.slice(0, 2)).out[0];
    const shift = Math.max(...rowAtB1.map((v, j) => Math.abs(v - rowAtB2[j])));
    const batchIndependent = shift < 1e-9;

    const gradPlain = residualGradient(depth, F_PRIME, false);
    const gradResid = residualGradient(depth, F_PRIME, true);
    const gradActive = useResidual ? gradResid : gradPlain;

    let verdict;
    if (norm === 'bn' && batchSize === 1) {
      verdict = {
        type: 'danger',
        text: '❌ BatchNorm với batch=1: mỗi cột chỉ có 1 giá trị nên phương sai = 0, toàn bộ đầu ra sụp về 0. Thông tin của mẫu bị xóa sạch!'
      };
    } else if (norm === 'bn') {
      verdict = {
        type: 'warning',
        text: `⚠️ BatchNorm chạy được, nhưng đầu ra của mẫu 1 phụ thuộc vào mẫu 2 (lệch ${round(shift, 2)} so với khi chạy một mình). Lúc suy diễn từng token sẽ không khớp lúc huấn luyện.`
      };
    } else {
      verdict = {
        type: 'success',
        text: '✅ LayerNorm: mỗi mẫu tự chuẩn hóa theo chính nó. Chạy batch=1 hay batch=2, đầu ra của mẫu 1 vẫn y hệt (lệch 0).'
      };
    }

    const normFormula = norm === 'ln'
      ? `\\hat{x}_{b,j} = \\frac{x_{b,j} - \\mu_b}{\\sigma_b}, \\quad \\mu_b = \\frac{1}{d}\\sum_{j} x_{b,j}`
      : `\\hat{x}_{b,j} = \\frac{x_{b,j} - \\mu_j}{\\sigma_j}, \\quad \\mu_j = \\frac{1}{B}\\sum_{b} x_{b,j}`;

    const gradFormula = useResidual
      ? `\\frac{\\partial y_L}{\\partial x_0} = (1 + f')^{L} = (1 + ${F_PRIME})^{${depth}} = ${round(gradResid, 4)}`
      : `\\frac{\\partial y_L}{\\partial x_0} = (f')^{L} = (${F_PRIME})^{${depth}} = ${gradPlain.toExponential(1)}`;

    return {
      X: batch.map(r => [...r]),
      norm,
      batchSize,
      out: res.out.map(r => r.map(v => round(v))),
      stats: res.stats.map(s => ({ mean: round(s.mean), std: round(s.std), degenerate: s.degenerate })),
      degenerate: res.degenerate,
      rowAtB1: rowAtB1.map(v => round(v)),
      rowAtB2: rowAtB2.map(v => round(v)),
      shift: round(shift, 4),
      batchIndependent,
      useResidual,
      depth,
      gradPlain,
      gradResid,
      gradActive,
      normFormula,
      gradFormula,
      verdict
    };
  }
}

export const PRESETS = [
  {
    id: 'ln_batch2',
    label: 'LayerNorm (batch=2) ✅',
    state: { norm: 'ln', batchSize: 2, useResidual: true, depth: 4 }
  },
  {
    id: 'bn_batch2',
    label: 'BatchNorm (batch=2)',
    state: { norm: 'bn', batchSize: 2, useResidual: true, depth: 4 }
  },
  {
    id: 'bn_batch1',
    label: 'BatchNorm khi sinh từng token (batch=1) ❌',
    state: { norm: 'bn', batchSize: 1, useResidual: true, depth: 4 }
  },
  {
    id: 'deep_no_residual',
    label: 'Mạng sâu 6 tầng, không residual ❌',
    state: { norm: 'ln', batchSize: 2, useResidual: false, depth: 6 }
  }
];
