/**
 * Gradient Accumulation & Clipping — Batch Lớn Trong RAM Nhỏ, Và Chặn Cú Nhảy Bất Thường
 * Path: lessons/gradient_accumulation_clipping/logic.js
 *
 * Batch hiệu dụng 8 mẫu nhưng RAM chỉ chứa micro-batch 2 mẫu -> tích lũy 4 micro-batch rồi mới cập nhật.
 * Gradient 2 chiều của 4 micro-batch (mỗi micro-batch đã là trung bình 2 mẫu):
 *   bình thường: [[0.2,0.1],[0.4,0.3],[0.2,0.5],[0.2,0.1]]  -> trung bình [0.25, 0.25]
 *   có đột biến: micro-batch cuối thành [11.8, 3.6]           -> trung bình [3.15, 1.125]
 * Cộng dồn (sum) mà quên chia cho số micro-batch thì gradient gấp 4 lần.
 * Cắt gradient: theo GIÁ TRỊ (từng thành phần về [-c, c]) hoặc theo CHUẨN TOÀN CỤC
 * (nhân cả vector với min(1, c / ||g||) nên giữ nguyên hướng).
 */

export const NORMAL = [[0.2, 0.1], [0.4, 0.3], [0.2, 0.5], [0.2, 0.1]];
export const SPIKE = [[0.2, 0.1], [0.4, 0.3], [0.2, 0.5], [11.8, 3.6]];
export const W0 = [1, 1];
export const MICRO = 2;
export const ACCUM = 4;
export const GB_PER_SAMPLE = 1;

const round = (v, n = 4) => Number(v.toFixed(n)) + 0;
const norm = (v) => Math.hypot(...v);
const cosine = (a, b) => (a[0] * b[0] + a[1] * b[1]) / (norm(a) * norm(b));

export function accumulate(micro, divide) {
  const sum = micro.reduce((s, g) => [s[0] + g[0], s[1] + g[1]], [0, 0]);
  return divide ? sum.map(v => v / micro.length) : sum;
}

export function clipGradient(g, mode, c = 1) {
  if (mode === 'value') return g.map(v => Math.max(-c, Math.min(c, v)));
  if (mode === 'norm') {
    const n = norm(g);
    const scale = n > c ? c / n : 1;
    return g.map(v => v * scale);
  }
  return [...g];
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { divide: true, clip: 'none', spike: false, lr: 0.1, maxNorm: 1 };
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
    const { divide, clip, spike, lr, maxNorm } = this.state;
    const micro = spike ? SPIKE : NORMAL;
    const raw = accumulate(micro, divide);
    const trueMean = accumulate(micro, true);
    const clipped = clipGradient(raw, clip, maxNorm);
    const step = clipped.map(v => lr * v);
    const wNew = W0.map((w, i) => w - step[i]);
    const rawNorm = norm(raw);
    const stepNorm = norm(step);
    const normalStep = lr * norm(accumulate(NORMAL, true));
    const cos = cosine(raw, clipped);
    const angleDeg = (Math.acos(Math.min(1, cos)) * 180) / Math.PI;

    let verdict;
    if (!divide) {
      verdict = {
        type: 'danger',
        text: `❌ Quên chia cho ${ACCUM} micro-batch: gradient = [${raw.map(v => round(v, 2)).join(', ')}], gấp ${round(rawNorm / norm(trueMean), 2)} lần gradient thật. Bước học thực tế gấp ${ACCUM} lần.`
      };
    } else if (spike && clip === 'none') {
      verdict = {
        type: 'danger',
        text: `❌ Một micro-batch đột biến kéo gradient lên chuẩn ${round(rawNorm, 2)}. Bước nhảy ${round(stepNorm, 3)} gấp ${round(stepNorm / normalStep, 1)} lần bước bình thường (${round(normalStep, 3)}): dễ phá hỏng trọng số.`
      };
    } else if (spike && clip === 'value') {
      verdict = {
        type: 'warning',
        text: `⚠️ Cắt theo giá trị chặn được độ lớn (bước ${round(stepNorm, 3)}) nhưng đổi hướng gradient ${round(angleDeg, 1)}° (cosine ${round(cos, 3)}): mọi thành phần bị ép về cùng một ngưỡng.`
      };
    } else if (spike && clip === 'norm') {
      verdict = {
        type: 'success',
        text: `✅ Cắt theo chuẩn: gradient co về độ dài ${round(norm(clipped), 2)} nhưng GIỮ NGUYÊN hướng (lệch ${round(angleDeg, 1)}°). Bước nhảy chỉ ${round(stepNorm, 3)}.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ Gradient bình thường (chuẩn ${round(rawNorm, 3)} < ${maxNorm}): cắt không làm gì cả. Tích lũy ${ACCUM} micro-batch ${MICRO} mẫu cho kết quả y hệt batch ${ACCUM * MICRO} mẫu.`
      };
    }

    return {
      divide, clip, spike, lr, maxNorm,
      micro: micro.map(g => [...g]),
      raw: raw.map(v => round(v)),
      rawNorm: round(rawNorm),
      clipped: clipped.map(v => round(v)),
      clippedNorm: round(norm(clipped)),
      step: step.map(v => round(v, 5)),
      stepNorm: round(stepNorm, 5),
      normalStepNorm: round(normalStep, 5),
      wNew: wNew.map(v => round(v)),
      cosine: round(cos),
      angleDeg: round(angleDeg, 2),
      microGB: MICRO * GB_PER_SAMPLE,
      effectiveGB: ACCUM * MICRO * GB_PER_SAMPLE,
      verdict,
      formulaKaTeX: clip === 'norm'
        ? `g \\leftarrow g \\cdot \\min\\!\\left(1,\\ \\frac{c}{\\lVert g \\rVert}\\right) = g \\cdot ${round(Math.min(1, maxNorm / rawNorm), 4)}`
        : clip === 'value'
          ? `g_i \\leftarrow \\text{clip}(g_i, -${maxNorm}, ${maxNorm})`
          : `g = ${divide ? '\\frac{1}{4}' : ''}\\sum_{k=1}^{4} g_k = [${raw.map(v => round(v, 3)).join(',\\ ')}]`
    };
  }
}

export const PRESETS = [
  { id: 'accumulate_ok', label: 'Tích lũy 4 micro-batch, chia đúng ✅', state: { divide: true, clip: 'none', spike: false } },
  { id: 'forgot_divide', label: 'Quên chia cho 4 ❌', state: { divide: false, clip: 'none', spike: false } },
  { id: 'spike_unclipped', label: 'Có đột biến, không cắt ❌', state: { divide: true, clip: 'none', spike: true } },
  { id: 'spike_value_clip', label: 'Đột biến + cắt theo giá trị', state: { divide: true, clip: 'value', spike: true } },
  { id: 'spike_norm_clip', label: 'Đột biến + cắt theo chuẩn ✅', state: { divide: true, clip: 'norm', spike: true } }
];
