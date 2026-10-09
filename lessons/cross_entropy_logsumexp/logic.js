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

/** Số -> chuỗi LaTeX: ∞, NaN, 0, ký hiệu khoa học cho số rất lớn/nhỏ, còn lại làm tròn 4 chữ số. */
export function texNum(v) {
  if (Number.isNaN(v)) return '\\text{NaN}';
  if (v === Infinity) return '\\infty';
  if (v === -Infinity) return '-\\infty';
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1e5 || a < 1e-3) {
    const [mant, exp] = v.toExponential(2).split('e');
    return `${mant} \\times 10^{${Number(exp)}}`;
  }
  return String(Number(v.toPrecision(5)));
}
const texVec = (arr) => `[${arr.map(texNum).join(',\\ ')}]`;
const RED = '#ef4444';
const red = (s) => `{\\color{${RED}}${s}}`;
/** Vector, tô đỏ phần tử hỏng (Infinity/NaN hoặc bị làm tròn về 0). */
const texVecMark = (arr, isBad) => `[${arr.map((v, i) => (isBad(v, i) ? red(texNum(v)) : texNum(v))).join(',\\ ')}]`;
/** Dòng chẩn đoán: ký hiệu nào hỏng, hỏng vì sao. */
const diagRows = (items) => items.map(([sym, val, why]) => ` \\\\ ${red(`\\boxed{${sym} = ${val}}\\ \\text{${why}}`)}`).join('');

/** Công thức đầy đủ với số liệu sống cho từng bước của ba đường đi. */
export function buildFormulas({ z, y, routes, grad }) {
  const [A, B, C] = routes;
  const m = Math.max(...z);
  const eA = A.steps[0].value, sA = A.steps[1].value, pA = A.steps[2].value;
  const shifted = B.steps[0].value, eB = B.steps[1].value, pB = B.steps[2].value;
  const lnS = C.steps[2].value, lse = C.steps[3].value;
  const sB = eB.reduce((a, b) => a + b, 0);
  const whyInf = 'tràn số (overflow)';
  const whyZero = 'về 0 (underflow)';
  const diagA = [];
  eA.forEach((v, i) => {
    if (Number.isNaN(v) || v === Infinity) diagA.push([`e^{z_${i}}`, texNum(v), whyInf]);
    else if (v === 0) diagA.push([`e^{z_${i}}`, '0', whyZero]);
  });
  if (!Number.isFinite(sA)) diagA.push(['\\textstyle\\sum_j e^{z_j}', texNum(sA), whyInf]);
  pA.forEach((v, i) => { if (Number.isNaN(v)) diagA.push([`p_${i}`, 'NaN', '(vô cực chia vô cực: không xác định)']); });
  if (pA[y] === 0) diagA.push([`p_${y}`, '0', 'về 0, nên -ln(p) thành vô cực']);
  const diagB = [];
  eB.forEach((v, i) => { if (v === 0) diagB.push([`e^{z_${i}-m}`, '0', whyZero]); });
  if (pB[y] === 0) diagB.push([`p_${y}`, '0', 'về 0, nên -ln(p) thành vô cực']);
  const okLine = (txt) => ` \\\\ \\text{${txt}}`;
  return {
    softmaxNaive:
      `\\begin{aligned} p_i &= \\frac{e^{z_i}}{\\sum_j e^{z_j}} \\\\ e^{z} &= ${texVecMark(eA, (v) => !Number.isFinite(v) || v === 0)} \\quad \\sum_j e^{z_j} = ${Number.isFinite(sA) ? texNum(sA) : red(texNum(sA))} \\\\ p &= ${texVecMark(pA, (v, i) => !Number.isFinite(v) || (i === y && v === 0))}${diagA.length ? diagRows(diagA) : okLine('Không ký hiệu nào hỏng ở mức logit này.')} \\end{aligned}`,
    softmaxSafe:
      `\\begin{aligned} m &= \\max(z) = ${texNum(m)}, \\quad p_i = \\frac{e^{z_i - m}}{\\sum_j e^{z_j - m}} \\\\ z - m &= ${texVec(shifted)} \\quad e^{z-m} = ${texVecMark(eB, (v) => v === 0 || !Number.isFinite(v))} \\quad \\sum = ${texNum(sB)} \\\\ p &= ${texVecMark(pB, (v, i) => i === y && v === 0)}${diagB.length ? diagRows(diagB) : okLine('Không ký hiệu nào hỏng.')}${okLine('Sau khi trừ max, mọi số mũ đều không dương nên không thể tràn số.')} \\end{aligned}`,
    lse:
      `\\begin{aligned} \\text{LogSumExp}(z) &= m + \\ln\\sum_j e^{z_j - m} \\\\ &= ${texNum(m)} + \\ln(${texNum(sB)}) = ${texNum(m)} + ${texNum(lnS)} = ${texNum(lse)} \\end{aligned}`,
    lossA: `\\text{A. Ngây thơ:}\\quad L = -\\ln(p_{${y}}) = -\\ln(${texNum(pA[y])}) = ${texNum(A.loss)}`,
    lossB: `\\text{B. Softmax an toàn:}\\quad L = -\\ln(p_{${y}}) = -\\ln(${texNum(pB[y])}) = ${texNum(B.loss)}`,
    lossC: `\\text{C. Log-Sum-Exp:}\\quad L = \\text{LSE}(z) - z_{${y}} = ${texNum(lse)} - (${texNum(z[y])}) = ${texNum(C.loss)}`,
    grad: `\\frac{\\partial L}{\\partial z_i} = p_i - \\mathbb{1}[i = ${y}] \\;\\Rightarrow\\; \\nabla_z L = [${grad.map(texNum).join(',\\ ')}]`
  };
}

/** Ba đường đi từ logits tới Loss, ghi lại giá trị trung gian và bước nào hỏng (NaN / vô cực / p_y = 0). */
export function buildRoutes(z, y, prec = 'fp32') {
  const m = Math.max(...z);
  const bad = (v) => (Array.isArray(v) ? v.some(x => !Number.isFinite(x)) : !Number.isFinite(v));

  // A. Naive: exp trực tiếp
  const eA = z.map(v => expP(v, prec));
  const sA = sumP(eA, prec);
  const pA = eA.map(v => roundTo(v / sA, prec));
  const lossA = roundTo(-Math.log(pA[y]), prec);
  const A = [
    { label: 'exp(z)', value: eA },
    { label: 'Σ exp', value: sA },
    { label: 'p = exp / Σ', value: pA },
    { label: '−ln(p_y)', value: lossA }
  ];
  A.forEach(st => { st.bad = bad(st.value); });
  A[2].bad = A[2].bad || pA[y] === 0; // p_y = 0 -> ln(0) = -Infinity ở bước kế

  // B. Softmax an toàn (trừ max) rồi log
  const shifted = z.map(v => roundTo(v - m, prec));
  const eB = shifted.map(v => expP(v, prec));
  const sB = sumP(eB, prec);
  const pB = eB.map(v => roundTo(v / sB, prec));
  const lossB = roundTo(-Math.log(pB[y]), prec);
  const B = [
    { label: 'z − max', value: shifted },
    { label: 'exp', value: eB },
    { label: 'p = exp / Σ', value: pB },
    { label: '−ln(p_y)', value: lossB }
  ];
  B.forEach(st => { st.bad = bad(st.value); });
  B[2].bad = B[2].bad || pB[y] === 0;

  // C. Log-Sum-Exp: không bao giờ tính p, cũng không lấy ln của số cực nhỏ
  const lnS = roundTo(Math.log(sB), prec);
  const lse = roundTo(m + lnS, prec);
  const lossC = roundTo(lse - z[y], prec);
  const C = [
    { label: 'z − max', value: shifted },
    { label: 'exp', value: eB },
    { label: 'ln Σ exp', value: lnS },
    { label: '+ max = LSE', value: lse },
    { label: '− z_y = Loss', value: lossC }
  ];
  C.forEach(st => { st.bad = bad(st.value); });

  // Chú thích từng bước: ký hiệu công thức, mức độ (bad = hỏng, warn = cảnh báo) và lý do nêu đích danh biến
  const hi = OVERFLOW_AT[prec].toFixed(2), lo = UNDERFLOW_AT[prec].toFixed(2);
  const sub = (i) => '₀₁₂₃₄₅₆₇₈₉'[i];
  const fz = (v) => (v < 0 ? `−${Math.abs(v)}` : String(v));
  const note = (st, sym, level, why) => { st.sym = sym; if (level) st.level = level; if (why) st.why = why; };
  const maxVal = prec === 'fp16' ? '65504' : '3.4×10³⁸';
  const big = (v) => (v >= 1e6 ? v.toExponential(2).replace('e+', '×10^') : String(Number(v.toPrecision(5))));
  const idx = (arr, f) => arr.map((v, i) => (f(v, i) ? i : -1)).filter(i => i >= 0);

  const overI = idx(eA, v => v === Infinity);
  const underA = idx(eA, (v, i) => v === 0 && Number.isFinite(z[i]));
  note(A[0], 'e_i = e^{z_i}',
    overI.length ? 'bad' : underA.length ? 'warn' : '',
    overI.length ? overI.map(i => `exp(z${sub(i)}) với z${sub(i)} = ${fz(z[i])} > ${hi}: giá trị thật e^${z[i]} ≈ ${big(Math.exp(z[i]))} vượt giới hạn ${maxVal} của ${prec === 'fp16' ? 'FP16' : 'FP32'} nên tràn thành +∞ (overflow)`).join('; ')
      + eA.map((v, i) => (Number.isFinite(v) && v > 0 && overI.length ? `; exp(z${sub(i)}) = ${big(v)} vẫn nhỏ hơn ${maxVal} nên giữ nguyên` : '')).join('')
      : underA.length ? underA.map(i => `exp(z${sub(i)}) với z${sub(i)} = ${fz(z[i])} < ${lo}: bị làm tròn về 0 (underflow)`).join('; ') : '');
  note(A[1], 'S = \\sum_j e_j', Number.isFinite(sA) ? '' : 'bad', Number.isFinite(sA) ? '' : 'S chứa +∞ nên S = +∞');
  note(A[2], `p_i = e_i / S`, A[2].bad ? 'bad' : '',
    Number.isNaN(pA[y]) || pA.some(Number.isNaN) ? '+∞ / +∞ không xác định nên p = NaN'
      : pA[y] === 0 ? `p${sub(y)} = e${sub(y)} / S = 0: xác suất lớp đúng đã mất hết` : '');
  note(A[3], `L = -\\ln p_{${y}}`, A[3].bad ? 'bad' : '', pA[y] === 0 ? `−ln(0) = +∞` : Number.isNaN(lossA) ? 'ln(NaN) = NaN' : '');

  note(B[0], 'z_i - m', '', '');
  const underB = idx(eB, v => v === 0);
  note(B[1], 'e_i = e^{z_i - m}', underB.length ? 'warn' : '',
    underB.length ? underB.map(i => `exp(z${sub(i)}−m) với z${sub(i)}−m = ${fz(shifted[i])} < ${lo}: về 0 (underflow)`).join('; ') : 'mọi z − max ≤ 0 nên e ∈ (0, 1]: không thể tràn');
  note(B[2], 'p_i = e_i / S', pB[y] === 0 ? 'bad' : '', pB[y] === 0 ? `p${sub(y)} = 0 / S = 0: xác suất lớp đúng mất hết` : '');
  note(B[3], `L = -\\ln p_{${y}}`, B[3].bad || pB[y] === 0 ? 'bad' : '', pB[y] === 0 ? '−ln(0) = +∞: trừ max chữa được tràn số nhưng không chữa được bước này' : '');

  note(C[0], 'z_i - m', '', '');
  note(C[1], 'e_i = e^{z_i - m}', '', underB.length
    ? `exp(z${sub(underB[0])}−m) = 0 nhưng vô hại: chỉ cộng thêm 0 vào Σ`
    : 'mọi z − max ≤ 0 nên e ∈ (0, 1]: không thể tràn');
  note(C[2], '\\ln S = \\ln\\sum_j e_j', '', 'Phần tử lớn nhất cho e = 1 nên S ≥ 1: không bao giờ phải lấy ln(0)');
  note(C[3], '\\mathrm{LSE} = m + \\ln S', '', '');
  note(C[4], `L = \\mathrm{LSE} - z_{${y}}`, '', '');

  // ---- Chiều ngược: quy tắc dây chuyền đi lùi qua đúng các bước ở chiều xuôi (m coi là hằng số) ----
  const rp = (v) => roundTo(v, prec);
  const bad1 = (v) => (Array.isArray(v) ? v.some(x => !Number.isFinite(x)) : !Number.isFinite(v));
  const setBack = (st, sym, value, why) => { st.back = { sym, value, level: bad1(value) ? 'bad' : '', why: why || '' }; };
  const softmaxBack = (e, S, py) => {
    // L = -ln(p_y), p = e / S
    const gp = rp(-1 / py);                                   // ∂L/∂p_y = -1/p_y
    const dS = rp(gp * -rp(e[y] / rp(S * S)));                // ∂L/∂S    = gp · (-e_y / S²)
    const de = e.map((_, i) => rp(rp((i === y ? gp : 0) / S) + dS)); // ∂L/∂e_i = gp·[i=y]/S + ∂L/∂S
    const dz = e.map((ei, i) => rp(ei * de[i]));              // ∂L/∂z_i = e_i · ∂L/∂e_i
    return { gp, dS, de, dz };
  };
  const whyGp = (py, e) => (Number.isNaN(py) ? 'p_y = NaN nên mọi đạo hàm sau nó cũng NaN'
    : py === 0 ? '−1/p_y = −1/0 = −∞. Cùng p_y = 0 đã làm Loss = +∞ ở chiều xuôi' : '');
  const whyDs = (gp, e, S) => (Number.isNaN(gp) ? 'nhận NaN từ bước trước'
    : gp === -Infinity ? `(−∞) × (e${sub(y)}/S² = 0) = NaN: vô cực nhân 0 không xác định` : '');

  const bA = softmaxBack(eA, sA, pA[y]);
  setBack(A[3], '\\partial L/\\partial L', 1, '');
  setBack(A[2], `\\partial L/\\partial p_{${y}} = -1/p_{${y}}`, bA.gp, whyGp(pA[y]));
  setBack(A[1], `\\partial L/\\partial S = \\partial L/\\partial p_{${y}}\\cdot(-e_{${y}}/S^2)`, bA.dS, whyDs(bA.gp, eA, sA));
  setBack(A[0], '\\partial L/\\partial z_i = e_i\\cdot\\partial L/\\partial e_i', bA.dz, bA.dz.some(Number.isNaN) ? 'NaN lan xuống: gradient hỏng, SGD sẽ ghi NaN vào trọng số' : '');

  const bB = softmaxBack(eB, sB, pB[y]);
  setBack(B[3], '\\partial L/\\partial L', 1, '');
  setBack(B[2], `\\partial L/\\partial p_{${y}} = -1/p_{${y}}`, bB.gp, whyGp(pB[y]));
  setBack(B[1], '\\partial L/\\partial e_i', bB.de, whyDs(bB.gp, eB, sB));
  setBack(B[0], '\\partial L/\\partial z_i = e_i\\cdot\\partial L/\\partial e_i', bB.dz, bB.dz.some(Number.isNaN) ? 'NaN lan xuống: gradient hỏng dù đã trừ max' : '');

  // Đường C: L = LSE - z_y, mọi hệ số đều hữu hạn vì S ≥ 1
  const invS = rp(1 / sB);
  const deC = eB.map(() => invS);
  const dzC = eB.map((ei, i) => rp(rp(ei * invS) - (i === y ? 1 : 0)));
  setBack(C[4], '\\partial L/\\partial L', 1, '');
  setBack(C[3], '\\partial L/\\partial \\mathrm{LSE}', 1, '');
  setBack(C[2], '\\partial L/\\partial \\ln S', 1, '');
  setBack(C[1], '\\partial L/\\partial e_i = 1/S', deC, 'chia cho S ≥ 1: không bao giờ chia cho 0');
  setBack(C[0], `\\partial L/\\partial z_i = e_i/S - \\mathbb{1}[i=${y}]`, dzC, 'e_i/S chính là p_i: không cần chia p_y, nên không có −1/0');

  return [
    { id: 'naive', name: 'A. Ngây thơ: exp(z) rồi chia, rồi ln', steps: A, loss: lossA, grad: bA.dz, ok: Number.isFinite(lossA) },
    { id: 'safe', name: 'B. Softmax an toàn (trừ max) rồi ln', steps: B, loss: lossB, grad: bB.dz, ok: Number.isFinite(lossB) },
    { id: 'lse', name: 'C. Log-Sum-Exp gộp (không tính p_y)', steps: C, loss: lossC, grad: dzC, ok: Number.isFinite(lossC) }
  ];
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      z0: 2.0,
      z1: 1.0,
      y: 1,              // 0 hoặc 1 (Nhãn thật mục tiêu)
      mode: 'lse',       // 'lse' | 'safe' | 'naive'
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
    const lossSafeLog = roundTo(-Math.log(pSafe[y]), P);
    const routes = buildRoutes(z, y, P);
    const grad = crossEntropyGrad(z, y, P);
    const formulas = buildFormulas({ z, y, routes, grad });
    const gradNaive = crossEntropyGradNaive(z, y, P);

    const isUnderflow = pNaive[y] === 0 || lossNaive === Infinity;
    const isOverflow = Number.isNaN(lossNaive) || !Number.isFinite(pNaive[0]) || !Number.isFinite(pNaive[1]);
    const naiveBroken = isUnderflow || isOverflow;
    const gradNaiveBroken = gradNaive.some(g => !Number.isFinite(g));

    const m = Math.max(z0, z1);

    let verdict;
    if (mode === 'naive') {
      if (isOverflow) {
        verdict = {
          type: 'danger',
          text: `🚨 ĐƯỜNG A (ngây thơ) THẤT BẠI (${fmtName}): exp(${Math.max(z0, z1)}) tràn số (Infinity; ngưỡng ${fmtName} là logit ${round(OVERFLOW_AT[P], 2)}), phép chia ra NaN. Gradient cũng NaN nên một bước SGD sẽ làm hỏng toàn bộ trọng số.`
        };
      } else if (isUnderflow) {
        verdict = {
          type: 'danger',
          text: `🚨 ĐƯỜNG A (ngây thơ) SỤP ĐỔ (${fmtName}): xác suất lớp đúng bị làm tròn về 0 (Underflow, ngưỡng ${round(UNDERFLOW_AT[P], 2)}). ln(0) = -Infinity nên Loss = +Infinity, gradient = NaN.`
        };
      } else {
        verdict = {
          type: 'warning',
          text: `⚠️ ĐƯỜNG A (ngây thơ): logit đang nhỏ nên ${fmtName} chưa gặp lỗi, Loss = ${round(lossNaive, 4)}. Nhưng chỉ cần logit vượt ${round(OVERFLOW_AT[P], 1)} hoặc xuống dưới ${round(UNDERFLOW_AT[P], 1)} là hỏng.`
        };
      }
    } else if (mode === 'safe') {
      if (!Number.isFinite(lossSafeLog)) {
        verdict = {
          type: 'danger',
          text: `🚨 ĐƯỜNG B (Softmax an toàn rồi ln) VẪN HỎNG (${fmtName}): trừ max đã chống được tràn số, nhưng p của lớp đúng vẫn về 0 (e^${round(z[y] - m, 1)} nhỏ hơn số ${fmtName} nhỏ nhất) nên ln(0) = -Infinity. Chỉ công thức gộp Log-Sum-Exp mới tránh được bước lấy ln của số cực nhỏ.`
        };
      } else if (naiveBroken) {
        verdict = {
          type: 'warning',
          text: `⚠️ ĐƯỜNG B CỨU ĐƯỢC LẦN NÀY (${fmtName}): đường A đã hỏng nhưng trừ max giữ Loss = ${round(lossSafeLog, 4)}. Tuy vậy với logit chênh lệch lớn hơn nữa đường B cũng hỏng; chỉ đường C luôn an toàn.`
        };
      } else {
        verdict = {
          type: 'success',
          text: `✅ ĐƯỜNG B (${fmtName}): Loss = ${round(lossSafeLog, 4)}, trùng với cách ngây thơ vì logit còn nhỏ.`
        };
      }
    } else if (naiveBroken) {
      verdict = {
        type: 'success',
        text: `🛡️ ĐƯỜNG C (Log-Sum-Exp) CỨU NGUY (${fmtName}): đường A đã hỏng${Number.isFinite(lossSafeLog) ? '' : ' và đường B cũng hỏng'} nhưng Loss = ${round(lossLSE, 4)} vẫn hữu hạn, gradient dội ngược chuẩn xác.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ ĐƯỜNG C (Log-Sum-Exp) CHUẨN XÁC (${fmtName}): Loss = ${round(lossLSE, 4)}, gradient hữu hạn, không phụ thuộc độ lớn tuyệt đối của logit.`
      };
    }

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

    const pSafeY = Number.isFinite(pSafe[y]) ? pSafe[y] : 0;
    const formulaSafeKaTeX = !Number.isFinite(lossSafeLog)
      ? `\\text{Loss}_{\\text{safe}} = -\\ln(p_{${y}}) = -\\ln(${round(pSafeY, 4)}) = +\\infty \\quad (\\text{Hụt số dù đã trừ max})`
      : `\\text{Loss}_{\\text{safe}} = -\\ln(p_{${y}}) = -\\ln(${round(pSafeY, 4)}) = ${round(lossSafeLog, 4)}`;

    const formulaActiveKaTeX = mode === 'lse' ? formulaLSEKaTeX : mode === 'safe' ? formulaSafeKaTeX : formulaNaiveKaTeX;

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
      lossActive: mode === 'lse' ? lossLSE : mode === 'safe' ? lossSafeLog : lossNaive,
      lossSafeLog,
      safeBroken: !Number.isFinite(lossSafeLog),
      routes,
      formulas,
      grad,
      gradNaive,
      gradSafe: pSafe[y] === 0 ? grad.map(() => NaN) : grad,
      gradNaiveBroken,
      isUnderflow,
      isOverflow,
      naiveBroken,
      verdict,
      formulaKaTeX: formulaActiveKaTeX,
      formulaLSEKaTeX,
      formulaNaiveKaTeX,
      formulaSafeKaTeX,
      formulaActiveKaTeX
    };
  }
}
