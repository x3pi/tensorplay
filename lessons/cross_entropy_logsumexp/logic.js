/**
 * Cross-Entropy dạng Log-Sum-Exp — Ổn Định Số Học Cho Hàm Mất Mát
 * Path: lessons/cross_entropy_logsumexp/logic.js
 *
 * Aha: Tính log(softmax(z)) bằng cách "softmax trước rồi log sau" sụp đổ (NaN / Infinity) khi logit lớn
 * hoặc chênh lệch lớn. Công thức gộp:
 *   log p_y = z_y - LogSumExp(z)         Loss = LogSumExp(z) - z_y
 * với LogSumExp(z) = m + ln(sum(exp(z_j - m))), m = max(z).
 *
 * Mọi phép tính chạy ở độ chính xác thật của GPU (mô phỏng từng phép toán):
 *   FP32: exp(z) tràn (= Infinity) khi z > ln(3.4e38) ≈ 88.72, về 0 khi z < ln(1.4e-45) ≈ -103.28.
 *   FP16: tràn khi z > ln(65504) ≈ 11.09, về 0 khi z < ln(6e-8) ≈ -16.64  (nguy hiểm gần hơn rất nhiều).
 * (JavaScript dùng FP64 nên cần |z| ≈ 709 mới lỗi; framework học sâu dùng FP32/FP16/BF16 nên lỗi sớm hơn nhiều.)
 */

export const FORMATS = {
  fp32: { name: 'FP32', expBits: 8, manBits: 23 },
  fp16: { name: 'FP16', expBits: 5, manBits: 10 }
};

export const OVERFLOW_AT = { fp32: Math.log(3.4028234663852886e38), fp16: Math.log(65504) };
export const UNDERFLOW_AT = { fp32: Math.log(Math.pow(2, -149)), fp16: Math.log(Math.pow(2, -24)) };

const round = (v, n = 4) => (typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(n)) + 0 : v);

/** Làm tròn một số thực về định dạng thấp bit (round-half-to-even), tràn -> ±Infinity, hụt -> 0. */
export function roundTo(x, prec) {
  if (prec === 'fp32') return Math.fround(x);
  if (x === 0 || !Number.isFinite(x)) return x;
  const { expBits, manBits } = FORMATS[prec];
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const bias = (1 << (expBits - 1)) - 1;
  const minExp = 1 - bias;
  const maxVal = (2 - Math.pow(2, -manBits)) * Math.pow(2, bias);
  const e = Math.max(Math.floor(Math.log2(a)), minExp);
  const step = Math.pow(2, e - manBits);
  const q = a / step;
  let n = Math.floor(q);
  const frac = q - n;
  if (frac > 0.5 || (frac === 0.5 && n % 2 === 1)) n += 1;
  const r = n * step;
  return r > maxVal ? sign * Infinity : sign * r + 0;
}

const sumP = (arr, prec) => arr.reduce((acc, v) => roundTo(acc + v, prec), 0);
const expP = (x, prec) => roundTo(Math.exp(x), prec);

export function logSumExp(z, prec = 'fp32') {
  const m = Math.max(...z);
  if (!Number.isFinite(m)) return m;
  const s = sumP(z.map(v => expP(roundTo(v - m, prec), prec)), prec);
  return roundTo(m + roundTo(Math.log(s), prec), prec);
}

export function safeSoftmax(z, prec = 'fp32') {
  const m = Math.max(...z);
  const e = z.map(v => expP(roundTo(v - m, prec), prec));
  const s = sumP(e, prec);
  return e.map(v => roundTo(v / s, prec));
}

export function naiveSoftmax(z, prec = 'fp32') {
  const e = z.map(v => expP(v, prec));
  const s = sumP(e, prec);
  return e.map(v => roundTo(v / s, prec)); // Infinity/Infinity = NaN, 0/0 = NaN: đúng chuẩn IEEE-754
}

export function crossEntropyLSE(z, y, prec = 'fp32') {
  return roundTo(logSumExp(z, prec) - z[y], prec);
}

export function crossEntropyNaive(z, y, prec = 'fp32') {
  const p = naiveSoftmax(z, prec);
  return roundTo(-Math.log(p[y]), prec); // log(0) = -Infinity -> Loss = +Infinity; log(NaN) = NaN
}

/** Gradient theo z từ công thức gộp: P - onehot (luôn hữu hạn). */
export function crossEntropyGrad(z, y, prec = 'fp32') {
  const p = safeSoftmax(z, prec);
  return p.map((prob, idx) => roundTo(prob - (idx === y ? 1 : 0), prec));
}

/** Gradient của cách ngây thơ L = -ln(p_y) bằng quy tắc dây chuyền: dL/dp_y = -1/p_y rồi nhân Jacobian softmax. */
export function crossEntropyGradNaive(z, y, prec = 'fp32') {
  const p = naiveSoftmax(z, prec);
  const py = p[y];
  const dLdp = roundTo(-1 / py, prec); // py = 0 -> -Infinity
  return p.map((pi, i) => roundTo(dLdp * roundTo(py * ((i === y ? 1 : 0) - pi), prec), prec)); // (-Inf) * 0 = NaN
}

export const PRESETS = [
  {
    id: 'normal',
    label: 'Chuẩn: Logit vừa phải [2, 1] (FP32)',
    desc: 'Logit thông thường, cả 2 cách đều cho ra cùng kết quả hữu hạn.',
    state: { z0: 2.0, z1: 1.0, y: 1, mode: 'lse', precision: 'fp32' }
  },
  {
    id: 'underflow',
    label: 'Hụt số FP32: [0, -110]',
    desc: 'Lớp đúng có logit -110: exp(-110) nhỏ hơn số FP32 nhỏ nhất nên p = 0, Naive ra Loss = Infinity. LSE vẫn ra 110 chính xác.',
    state: { z0: 0.0, z1: -110.0, y: 1, mode: 'lse', precision: 'fp32' }
  },
  {
    id: 'overflow',
    label: 'Tràn số FP32: [100, 99]',
    desc: 'exp(100) vượt 3.4e38 nên thành Infinity trong FP32, Naive ra NaN. LSE xử lý mượt mà.',
    state: { z0: 100.0, z1: 99.0, y: 0, mode: 'lse', precision: 'fp32' }
  },
  {
    id: 'fp16_overflow',
    label: 'FP16 chỉ cần logit 12: [12, 11]',
    desc: 'FP16 tràn khi exp > 65504, tức logit > 11.09. Logit 12 là chuyện hoàn toàn bình thường trong mô hình thật.',
    state: { z0: 12.0, z1: 11.0, y: 0, mode: 'lse', precision: 'fp16' }
  },
  {
    id: 'fp16_underflow',
    label: 'FP16 hụt ở logit -20: [0, -20]',
    desc: 'Số FP16 dương nhỏ nhất là 6e-8 ≈ e^-16.6, nên p của lớp đúng về 0 và Naive cho Loss = Infinity.',
    state: { z0: 0.0, z1: -20.0, y: 1, mode: 'lse', precision: 'fp16' }
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
      y: 1,              // 0 hoặc 1 (Nhãn thật mục tiêu)
      mode: 'lse',       // 'lse' | 'naive'
      precision: 'fp32'  // 'fp32' | 'fp16'
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
    const { z0, z1, y, mode, precision } = this.state;
    const P = precision;
    const fmtName = FORMATS[P].name;
    const z = [z0, z1];

    const lseVal = logSumExp(z, P);
    const pSafe = safeSoftmax(z, P);
    const pNaive = naiveSoftmax(z, P);

    const lossLSE = crossEntropyLSE(z, y, P);
    const lossNaive = crossEntropyNaive(z, y, P);
    const grad = crossEntropyGrad(z, y, P);
    const gradNaive = crossEntropyGradNaive(z, y, P);

    const isUnderflow = pNaive[y] === 0 || lossNaive === Infinity;
    const isOverflow = Number.isNaN(lossNaive) || !Number.isFinite(pNaive[0]) || !Number.isFinite(pNaive[1]);
    const naiveBroken = isUnderflow || isOverflow;
    const gradNaiveBroken = gradNaive.some(g => !Number.isFinite(g));

    let verdict;
    if (mode === 'naive') {
      if (isOverflow) {
        verdict = {
          type: 'danger',
          text: `🚨 CÁCH NGÂY THƠ THẤT BẠI (${fmtName}): exp(${Math.max(z0, z1)}) tràn số (Infinity; ngưỡng ${fmtName} là logit ${round(OVERFLOW_AT[P], 2)}), phép chia ra NaN. Gradient cũng NaN nên một bước SGD sẽ làm hỏng toàn bộ trọng số.`
        };
      } else if (isUnderflow) {
        verdict = {
          type: 'danger',
          text: `🚨 CÁCH NGÂY THƠ SỤP ĐỔ (${fmtName}): xác suất lớp đúng bị làm tròn về 0 (Underflow, ngưỡng ${round(UNDERFLOW_AT[P], 2)}). log(0) = -Infinity nên Loss = +Infinity, gradient = NaN.`
        };
      } else {
        verdict = {
          type: 'warning',
          text: `⚠️ CÁCH NGÂY THƠ: logit đang nhỏ nên ${fmtName} chưa gặp lỗi, Loss = ${round(lossNaive, 4)}. Nhưng chỉ cần logit vượt ${round(OVERFLOW_AT[P], 1)} hoặc xuống dưới ${round(UNDERFLOW_AT[P], 1)} là hỏng.`
        };
      }
    } else if (naiveBroken) {
      verdict = {
        type: 'success',
        text: `🛡️ LOG-SUM-EXP CỨU NGUY (${fmtName}): cách ngây thơ đã hỏng ở đây nhưng Loss = ${round(lossLSE, 4)} vẫn hữu hạn và gradient dội ngược chuẩn xác.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ LOG-SUM-EXP CHUẨN XÁC (${fmtName}): Loss = ${round(lossLSE, 4)}, gradient hữu hạn, không phụ thuộc độ lớn tuyệt đối của logit.`
      };
    }

    const m = Math.max(z0, z1);

    const zyFmt = z[y] < 0 ? `(${round(z[y], 4)})` : `${round(z[y], 4)}`;
    const formulaLSEKaTeX = `\\text{Loss}_{\\text{LSE}} = \\text{LogSumExp}(z) - z_{${y}} = ${round(lseVal, 4)} - ${zyFmt} = ${round(lossLSE, 4)}`;

    let formulaNaiveKaTeX;
    if (isOverflow) {
      formulaNaiveKaTeX = `\\text{Loss}_{\\text{naive}} = -\\ln(p_{${y}}) = -\\ln(\\text{NaN}) = \\text{NaN} \\quad (\\text{Tràn số exp})`;
    } else if (isUnderflow) {
      formulaNaiveKaTeX = `\\text{Loss}_{\\text{naive}} = -\\ln(p_{${y}}) = -\\ln(0.0) = +\\infty \\quad (\\text{Hụt số Underflow})`;
    } else {
      const pVal = Number.isFinite(pNaive[y]) ? round(pNaive[y], 4) : 0;
      formulaNaiveKaTeX = `\\text{Loss}_{\\text{naive}} = -\\ln(p_{${y}}) = -\\ln(${pVal}) = ${round(lossNaive, 4)}`;
    }

    const formulaActiveKaTeX = mode === 'lse' ? formulaLSEKaTeX : formulaNaiveKaTeX;

    return {
      state: { ...this.state },
      precision: P,
      precisionName: fmtName,
      overflowAt: round(OVERFLOW_AT[P], 2),
      underflowAt: round(UNDERFLOW_AT[P], 2),
      z,
      m,
      lse: lseVal,
      pSafe,
      pNaive,
      lossLSE,
      lossNaive,
      lossActive: mode === 'lse' ? lossLSE : lossNaive,
      grad,
      gradNaive,
      gradNaiveBroken,
      isUnderflow,
      isOverflow,
      naiveBroken,
      verdict,
      formulaKaTeX: formulaActiveKaTeX,
      formulaLSEKaTeX,
      formulaNaiveKaTeX,
      formulaActiveKaTeX
    };
  }
}
