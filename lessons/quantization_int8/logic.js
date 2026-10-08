/**
 * Quantization INT8/INT4 — Nén Trọng Số Để Đọc Ít Byte Hơn
 * Path: lessons/quantization_int8/logic.js
 *
 * 8 trọng số: [0.1, -0.2, 0.3, 0.2, -0.1, 0.25, -0.3, 0.28]; "có ngoại lai" đổi số cuối thành 20.
 * Lượng tử hóa đối xứng: s = max|w| / q_max (q_max = 127 cho INT8, 7 cho INT4),
 *   q = round(w / s), w_hat = q * s.
 *   - per-tensor: một hệ số s cho cả 8 trọng số.
 *   - per-group : một hệ số s cho mỗi nhóm 2 trọng số (thực tế thường 64-128).
 * Chỉ số chất lượng: sai số tuyệt đối trung bình trên 7 trọng số "bình thường" (bỏ trọng số cuối).
 * Hệ thống: mô hình 7B giải mã bị nghẽn băng thông, thông lượng = B / số byte trọng số.
 */

export const BASE = [0.1, -0.2, 0.3, 0.2, -0.1, 0.25, -0.3, 0.28];
export const OUTLIER = 20;
export const GROUP = 2;
export const PARAMS_7B = 7e9;
export const BANDWIDTH = 2e12;

const round = (v, n = 4) => Number(v.toFixed(n)) + 0;

export function quantize(w, bits, scheme, group = GROUP) {
  const qmax = Math.pow(2, bits - 1) - 1;
  const scales = [];
  const q = [];
  const dq = [];
  const absMax = (arr) => Math.max(...arr.map(Math.abs));
  const groups = scheme === 'tensor' ? [w] : Array.from({ length: Math.ceil(w.length / group) }, (_, i) => w.slice(i * group, (i + 1) * group));
  for (const g of groups) {
    const s = absMax(g) / qmax;
    for (const v of g) {
      // làm tròn nửa-về-chẵn giống numpy.rint
      const x = v / s;
      let r = Math.round(x);
      if (Math.abs(x % 1) === 0.5) r = 2 * Math.round(x / 2);
      q.push(r + 0); // "+ 0" đổi -0 thành 0
      dq.push(r * s + 0);
      scales.push(s);
    }
  }
  return { q, dq, scales, qmax };
}

export function bytesPerParam(bits, scheme, realGroup = 128) {
  const overhead = scheme === 'group' ? 2 / realGroup : 0; // 1 hệ số FP16 mỗi nhóm
  return bits / 8 + overhead;
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { bits: 8, scheme: 'tensor', outlier: false };
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
    const { bits, scheme, outlier } = this.state;
    const w = BASE.map((v, i) => (outlier && i === 7 ? OUTLIER : v));
    const { q, dq, scales, qmax } = quantize(w, bits, scheme);
    const err = w.map((v, i) => Math.abs(dq[i] - v));
    const normal = err.slice(0, 7);
    const mae = normal.reduce((a, b) => a + b, 0) / 7;
    const maxRel = Math.max(...normal.map((e, i) => e / Math.abs(w[i])));
    const zeros = q.slice(0, 7).filter(v => v === 0).length;

    const bpp = bytesPerParam(bits, scheme);
    const fp16GB = (PARAMS_7B * 2) / 1e9;
    const gb = (PARAMS_7B * bpp) / 1e9;
    const tokensPerSec = BANDWIDTH / (PARAMS_7B * bpp);
    const fp16Tokens = BANDWIDTH / (PARAMS_7B * 2);

    let verdict;
    if (zeros >= 5) {
      verdict = {
        type: 'danger',
        text: `❌ ${zeros}/7 trọng số bình thường bị làm tròn thành 0: một ngoại lai kéo hệ số s lên ${round(scales[7], 4)} nên mọi giá trị nhỏ hơn s/2 mất sạch. Mô hình này gần như hỏng.`
      };
    } else if (maxRel > 0.5) {
      verdict = {
        type: 'danger',
        text: `❌ Sai số tương đối lớn nhất lên tới ${round(maxRel * 100, 0)}% trên các trọng số bình thường (sai số tuyệt đối trung bình ${round(mae, 4)}). Ngoại lai làm hỏng độ phân giải.`
      };
    } else if (outlier && scheme === 'group') {
      verdict = {
        type: 'success',
        text: `✅ Chia nhóm cô lập ngoại lai: sai số trung bình ${round(mae, 5)}, chỉ nhóm chứa nó bị ảnh hưởng. Chi phí thêm khoảng ${round((bpp - bits / 8) * 100 / (bits / 8), 1)}% bộ nhớ cho hệ số (nhóm thật 128).`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ Sai số tuyệt đối trung bình chỉ ${round(mae, 5)} (lớn nhất ${round(maxRel * 100, 1)}% tương đối). Mô hình 7B giảm từ ${round(fp16GB, 1)} GB còn ${round(gb, 2)} GB, thông lượng giải mã ${round(tokensPerSec, 0)} token/s.`
      };
    }

    return {
      bits, scheme, outlier, qmax,
      w, q, dq: dq.map(v => round(v, 4)), scales: scales.map(v => round(v, 5)),
      err: err.map(v => round(v, 4)),
      mae: round(mae, 5),
      maxRel: round(maxRel, 3),
      zeros,
      bytesPerParam: round(bpp, 4),
      gb: round(gb, 3),
      fp16GB: round(fp16GB, 1),
      tokensPerSec: round(tokensPerSec, 1),
      fp16Tokens: round(fp16Tokens, 1),
      speedup: round(tokensPerSec / fp16Tokens, 2),
      verdict,
      formulaKaTeX: `s = \\frac{\\max|w|}{${qmax}},\\quad q = \\text{round}\\!\\left(\\frac{w}{s}\\right),\\quad \\hat{w} = q \\cdot s`
    };
  }
}

export const PRESETS = [
  { id: 'int8_clean', label: 'INT8, trọng số bình thường ✅', state: { bits: 8, scheme: 'tensor', outlier: false } },
  { id: 'int8_outlier', label: 'INT8 + 1 ngoại lai (per-tensor) ❌', state: { bits: 8, scheme: 'tensor', outlier: true } },
  { id: 'int8_outlier_group', label: 'INT8 + ngoại lai, chia nhóm ✅', state: { bits: 8, scheme: 'group', outlier: true } },
  { id: 'int4_outlier', label: 'INT4 + ngoại lai (per-tensor) ❌', state: { bits: 4, scheme: 'tensor', outlier: true } },
  { id: 'int4_group', label: 'INT4, chia nhóm, không ngoại lai', state: { bits: 4, scheme: 'group', outlier: false } }
];
