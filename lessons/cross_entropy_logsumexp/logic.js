/**
 * Cross-Entropy dạng Log-Sum-Exp — Ổn Định Số Học Cho Hàm Mất Mát
 * Path: lessons/cross_entropy_logsumexp/logic.js
 *
 * Aha: Tính log(softmax(z)) bằng cách "softmax trước rồi log sau" gây sụp đổ số học (NaN / Infinity)
 * khi logit chênh lệch lớn hoặc quá lớn. Công thức gộp:
 *   log p_y = z_y - LogSumExp(z)
 *   Loss = LogSumExp(z) - z_y
 * với LogSumExp(z) = m + ln(sum(exp(z_j - m))), m = max(z).
 */

const round = (v, n = 4) => (typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(n)) + 0 : v);

export function logSumExp(z) {
  const m = Math.max(...z);
  if (!Number.isFinite(m)) return m;
  const sumExp = z.reduce((acc, val) => acc + Math.exp(val - m), 0);
  return m + Math.log(sumExp);
}

export function safeSoftmax(z) {
  const m = Math.max(...z);
  const exps = z.map(v => Math.exp(v - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sum);
}

export function naiveSoftmax(z) {
  const exps = z.map(v => Math.exp(v));
  const sum = exps.reduce((a, b) => a + b, 0);
  if (!Number.isFinite(sum) || sum === 0) {
    return exps.map(v => (v === Infinity ? NaN : 0));
  }
  return exps.map(v => v / sum);
}

export function crossEntropyLSE(z, y) {
  const lse = logSumExp(z);
  return lse - z[y];
}

export function crossEntropyNaive(z, y) {
  const p = naiveSoftmax(z);
  const py = p[y];
  if (py <= 0 || !Number.isFinite(py)) {
    if (py === 0) return Infinity;
    return NaN;
  }
  return -Math.log(py);
}

export function crossEntropyGrad(z, y) {
  const p = safeSoftmax(z);
  return p.map((prob, idx) => prob - (idx === y ? 1 : 0));
}

export const PRESETS = [
  {
    id: 'normal',
    label: 'Chuẩn: Logit vừa phải [2, 1]',
    desc: 'Logit thông thường, cả 2 cách đều cho ra cùng kết quả hữu hạn.',
    state: { z0: 2.0, z1: 1.0, y: 1, mode: 'lse' }
  },
  {
    id: 'underflow',
    label: 'Cực Đoan: Chênh lệch lớn [0, -1000]',
    desc: 'Lớp đúng có logit -1000. Naive tính ra p=0 -> Loss=Infinity! LSE vẫn ra 1000.0 chính xác.',
    state: { z0: 0.0, z1: -1000.0, y: 1, mode: 'lse' }
  },
  {
    id: 'overflow',
    label: 'Tràn Số: Logit siêu lớn [1000, 999]',
    desc: 'exp(1000) tràn số FP64 thành Infinity -> Naive ra NaN! LSE xử lý mượt mà.',
    state: { z0: 1000.0, z1: 999.0, y: 0, mode: 'lse' }
  }
];

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      z0: 2.0,
      z1: 1.0,
      y: 1,          // 0 hoặc 1 (Nhãn thật mục tiêu)
      mode: 'lse'     // 'lse' | 'naive'
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
    const { z0, z1, y, mode } = this.state;
    const z = [z0, z1];

    const lseVal = logSumExp(z);
    const pSafe = safeSoftmax(z);
    const pNaive = naiveSoftmax(z);

    const lossLSE = crossEntropyLSE(z, y);
    const lossNaive = crossEntropyNaive(z, y);
    const grad = crossEntropyGrad(z, y);

    const isUnderflow = pNaive[y] === 0 || lossNaive === Infinity;
    const isOverflow = Number.isNaN(lossNaive) || !Number.isFinite(pNaive[0]) || !Number.isFinite(pNaive[1]);

    let verdict;
    if (mode === 'naive') {
      if (isOverflow) {
        verdict = {
          type: 'danger',
          text: `🚨 CÁCH NGÂY THƠ THẤT BẠI: exp(${Math.max(z0, z1)}) tràn số FP64 (Infinity), phép chia ra NaN! Mạng nơ-ron lập tức tê liệt.`
        };
      } else if (isUnderflow) {
        verdict = {
          type: 'danger',
          text: `🚨 CÁCH NGÂY THƠ SỤP ĐỔ: Xác suất lớp đúng bị làm tròn về 0 (Underflow). log(0) = -Infinity -> Loss = +Infinity!`
        };
      } else {
        verdict = {
          type: 'warning',
          text: `⚠️ CÁCH NGÂY THƠ: Logit nhỏ nên chưa gặp lỗi, Loss = ${round(lossNaive, 4)}. Nhưng tiềm ẩn nguy cơ tràn/hụt số khi logit tăng!`
        };
      }
    } else {
      if (isUnderflow || isOverflow) {
        verdict = {
          type: 'success',
          text: `🛡️ LOG-SUM-EXP CỨU NGUY THÀNH CÔNG: Dù logit chênh lệch cực đại, Loss = ${round(lossLSE, 4)} hoàn toàn hữu hạn, gradient dội ngược chuẩn xác!`
        };
      } else {
        verdict = {
          type: 'success',
          text: `✅ LOG-SUM-EXP CHUẨN XÁC: Loss = ${round(lossLSE, 4)}, bảo toàn số học tuyệt đối và đạo hàm mượt mà.`
        };
      }
    }

    const m = Math.max(z0, z1);
    const formulaKaTeX = `\\text{Loss} = \\text{LogSumExp}(z) - z_{${y}} = ${round(lseVal, 4)} - (${round(z[y], 4)}) = ${round(lossLSE, 4)}`;

    return {
      state: { ...this.state },
      z,
      m,
      lse: lseVal,
      pSafe,
      pNaive,
      lossLSE,
      lossNaive,
      lossActive: mode === 'lse' ? lossLSE : lossNaive,
      grad,
      isUnderflow,
      isOverflow,
      verdict,
      formulaKaTeX
    };
  }
}
