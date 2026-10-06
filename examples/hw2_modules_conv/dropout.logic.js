/**
 * Logic Module: Dropout — Triệt Tiêu Nơ-ron & Kỹ Thuật Inverted Scaling.
 * Path: examples/hw2_modules_conv/dropout.logic.js
 *
 * Vector kích hoạt: h = [4, 2, 6, 4]
 * Tỉ lệ drop p in {0, 0.25, 0.5, 0.75}, tỉ lệ giữ keep_prob = 1 - p.
 * Mask m in {0, 1}^4.
 *
 * Chế độ:
 * - mode = 'eval': out = h (toàn bộ nơ-ron hoạt động, không scale)
 * - mode = 'train':
 *     - inverted (chuẩn): out = (h * m) / (1 - p)  -> E[out] = h
 *     - naive (quên scale): out = h * m           -> E[out] = (1 - p) * h
 *
 * Backward:
 *   dL/dh = (dL/dout) * m / (1 - p)  (nơ-ron drop thì gradient = 0)
 */

export const DEFAULT_H = [4, 2, 6, 4];

export function applyDropout(h, mask, p, mode = 'train', scaling = 'inverted') {
  if (mode === 'eval') {
    return {
      out: [...h],
      scaleFactor: 1,
      expectedMean: h.reduce((s, v) => s + v, 0) / h.length,
      actualMean: h.reduce((s, v) => s + v, 0) / h.length
    };
  }

  const keepProb = 1 - p;
  const scaleFactor = (scaling === 'inverted' && keepProb > 0) ? (1 / keepProb) : 1;

  const out = h.map((v, i) => (mask[i] ? v * scaleFactor : 0));
  const expectedMean = (scaling === 'inverted')
    ? (h.reduce((s, v) => s + v, 0) / h.length)
    : (h.reduce((s, v) => s + v, 0) / h.length) * keepProb;
  const actualMean = out.reduce((s, v) => s + v, 0) / out.length;

  return {
    out,
    scaleFactor,
    expectedMean,
    actualMean
  };
}

export function backwardDropout(gradOut, mask, p, mode = 'train', scaling = 'inverted') {
  if (mode === 'eval') return [...gradOut];
  const keepProb = 1 - p;
  const scaleFactor = (scaling === 'inverted' && keepProb > 0) ? (1 / keepProb) : 1;
  return gradOut.map((g, i) => (mask[i] ? g * scaleFactor : 0));
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      h: [...DEFAULT_H],
      p: 0.5,
      mask: [1, 0, 1, 0],
      mode: 'train', // 'train' | 'eval'
      scaling: 'inverted', // 'inverted' | 'naive'
      gradOut: [1, 1, 1, 1]
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

  generateRandomMask() {
    const keepProb = 1 - this.state.p;
    const newMask = this.state.h.map(() => (Math.random() < keepProb ? 1 : 0));
    // Đảm bảo không rỗng nếu p < 1
    if (this.state.p < 1 && newMask.every(m => m === 0)) {
      newMask[0] = 1;
    }
    this.state.mask = newMask;
    return this.calculate();
  }

  calculate() {
    const { h, p, mask, mode, scaling, gradOut } = this.state;
    const res = applyDropout(h, mask, p, mode, scaling);
    const gradIn = backwardDropout(gradOut, mask, p, mode, scaling);

    const activeCount = mode === 'eval' ? h.length : mask.filter(m => m === 1).length;
    const keepProb = 1 - p;
    const origSum = h.reduce((a, b) => a + b, 0);
    const outSum = res.out.reduce((a, b) => a + b, 0);

    let verdict;
    if (mode === 'eval') {
      verdict = {
        type: 'success',
        text: '🔬 Chế độ Eval: 100% nơ-ron giữ nguyên, không drop, không scale. Toàn bộ trọng số được tận dụng như một ensemble.'
      };
    } else if (scaling === 'inverted') {
      verdict = {
        type: 'success',
        text: `✅ Inverted Dropout: Nhân phóng đại hệ số 1/(1 - p) = ${res.scaleFactor}. Kỳ vọng tổng tín hiệu E[out] = ${origSum} bằng đúng lúc eval!`
      };
    } else {
      verdict = {
        type: 'danger',
        text: `❌ Naive Dropout (quên scale): Kỳ vọng tổng giảm còn (1 - p) * ${origSum} = ${origSum * keepProb}. Khi chuyển sang eval, nơ-ron tầng sau sẽ bị sốc tín hiệu gấp ${keepProb > 0 ? (1 / keepProb).toFixed(1) : '∞'} lần!`
      };
    }

    const formulaKaTeX = mode === 'eval'
      ? `\\text{out} = h = [${h.join(', ')}]`
      : scaling === 'inverted'
        ? `\\text{out}_i = \\frac{h_i \\cdot m_i}{1 - p} = \\frac{h_i \\cdot m_i}{${keepProb}} = h_i \\cdot m_i \\times ${res.scaleFactor}`
        : `\\text{out}_i = h_i \\cdot m_i \\quad \\text{(quên chia } 1 - p\\text{)}`;

    return {
      h: [...h],
      p,
      mask: [...mask],
      mode,
      scaling,
      out: res.out,
      scaleFactor: res.scaleFactor,
      expectedMean: res.expectedMean,
      actualMean: res.actualMean,
      origSum,
      outSum,
      activeCount,
      gradOut: [...gradOut],
      gradIn,
      formulaKaTeX,
      verdict
    };
  }
}

export const PRESETS = [
  {
    id: 'inverted_half',
    label: 'Inverted Dropout (p=0.5) ✅',
    state: { p: 0.5, mask: [1, 0, 1, 0], mode: 'train', scaling: 'inverted' }
  },
  {
    id: 'naive_half',
    label: 'Naive (Quên scale 1/(1-p)) ❌',
    state: { p: 0.5, mask: [1, 0, 1, 0], mode: 'train', scaling: 'naive' }
  },
  {
    id: 'eval_mode',
    label: 'Chế độ Đánh Giá (Eval) 🔬',
    state: { mode: 'eval', scaling: 'inverted' }
  },
  {
    id: 'high_drop',
    label: 'Drop Cao (p=0.75)',
    state: { p: 0.75, mask: [0, 0, 1, 0], mode: 'train', scaling: 'inverted' }
  }
];
