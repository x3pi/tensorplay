/**
 * Logic Module: RNN & Backpropagation Through Time (BPTT).
 * Path: lessons/rnn_bptt/logic.js
 *
 * Chuỗi thời gian t = 1 ... T (mặc định T = 10).
 * h_0 = 0, x_1 = 1, x_t = 0 (t > 1).
 * Forward: h_t = act(w * h_{t-1} + x_t)
 * Loss: L = h_T
 * Gradient dội ngược: dL/dx_1 = dL/dh_T * prod_{t=1}^{T-1} (dh_{t+1}/dh_t) * (dh_1/dx_1)
 *
 * Chế độ:
 * 1. 'linear': act(z) = z, dh_{t+1}/dh_t = w
 * 2. 'tanh': act(z) = tanh(z), dh_{t+1}/dh_t = w * (1 - h_{t+1}^2)
 * 3. 'lstm_highway': đường cao tốc gradient với f = 0.95
 *
 * Gradient Clipping: cắt nếu |g| > clipThreshold
 */

export const DEFAULT_T = 10;
export const CLIP_THRESHOLD = 5.0;

export function simulateRNN({
  w = 0.5,
  T = 10,
  mode = 'linear', // 'linear' | 'tanh' | 'lstm_highway'
  clipping = false,
  clipThreshold = CLIP_THRESHOLD
}) {
  const h = [0]; // h_0 = 0
  const localDerivs = []; // dh_t / dh_{t-1}

  // 1. Forward Pass
  for (let t = 1; t <= T; t++) {
    const x_t = (t === 1) ? 1 : 0;
    const prevH = h[t - 1];

    if (mode === 'linear') {
      const val = w * prevH + x_t;
      h.push(val);
      localDerivs.push(t === 1 ? 1 : w);
    } else if (mode === 'tanh') {
      const z = w * prevH + x_t;
      const val = Math.tanh(z);
      h.push(val);
      const derivZ = 1 - val * val;
      localDerivs.push(t === 1 ? derivZ : w * derivZ);
    } else if (mode === 'lstm_highway') {
      // Mô phỏng cell state với cổng quên f = 0.95
      const f = 0.95;
      const val = f * prevH + x_t;
      h.push(val);
      localDerivs.push(t === 1 ? 1 : f);
    }
  }

  // 2. Backward Pass: tính gradient từng bước từ T về 1
  // gradWrtH[t] = dL / dh_t
  const gradWrtH = new Array(T + 1).fill(0);
  gradWrtH[T] = 1; // dL / dh_T = 1

  for (let t = T - 1; t >= 1; t--) {
    gradWrtH[t] = gradWrtH[t + 1] * localDerivs[t]; // localDerivs[t] là đạo hàm dh_{t+1}/dh_t
  }

  const rawGradX1 = gradWrtH[1] * (mode === 'tanh' ? (1 - h[1] * h[1]) : 1);
  let finalGradX1 = rawGradX1;
  let isClipped = false;

  if (clipping && Math.abs(rawGradX1) > clipThreshold) {
    finalGradX1 = Math.sign(rawGradX1) * clipThreshold;
    isClipped = true;
  }

  return {
    h: h.slice(1), // h_1 ... h_T
    localDerivs,
    gradProfile: gradWrtH.slice(1), // dL/dh_1 ... dL/dh_T
    rawGradX1,
    finalGradX1,
    isClipped
  };
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      w: 0.5,
      T: 10,
      mode: 'linear',
      clipping: false
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
    const { w, T, mode, clipping } = this.state;
    const res = simulateRNN({ w, T, mode, clipping });

    let status = 'normal';
    if (Math.abs(res.rawGradX1) < 0.01) status = 'vanishing';
    else if (Math.abs(res.rawGradX1) > 10) status = 'exploding';

    let verdict;
    if (status === 'vanishing') {
      verdict = {
        type: 'danger',
        text: `🥶 Tiêu biến gradient! Gradient về tới bước đầu tiên chỉ còn ${res.rawGradX1.toExponential(2)} (suy giảm hơn 100 lần). RNN hoàn toàn quên mất tín hiệu x₁ ở quá khứ!`
      };
    } else if (status === 'exploding') {
      verdict = {
        type: res.isClipped ? 'warning' : 'danger',
        text: res.isClipped
          ? `✂️ Bùng nổ gradient đã được cứu bởi Gradient Clipping! Gradient từ ${res.rawGradX1.toFixed(1)} được cắt gọt an toàn về ${CLIP_THRESHOLD}.`
          : `🔥 Bùng nổ gradient! Gradient vọt lên ${res.rawGradX1.toFixed(1)} > 10. Các bước cập nhật trọng số sẽ phá hỏng toàn bộ mô hình (NaN/Inf).`
      };
    } else if (mode === 'lstm_highway') {
      verdict = {
        type: 'success',
        text: `🛣️ Đường cao tốc LSTM: Nhờ cổng quên f ≈ 0.95, gradient được truyền ngược xuyên suốt ${T} bước thời gian mà không bị suy sụp.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ Cân bằng ổn định: Gradient dội ngược về tới x₁ đạt ${res.finalGradX1.toFixed(4)}.`
      };
    }

    const formulaKaTeX = mode === 'linear'
      ? `\\frac{\\partial L}{\\partial x_1} = w^{T-1} = ${w}^{${T - 1}} = ${res.rawGradX1.toFixed(6)}`
      : mode === 'lstm_highway'
        ? `\\frac{\\partial L}{\\partial c_1} \\approx f^{T-1} = 0.95^{${T - 1}} = ${res.rawGradX1.toFixed(4)}`
        : `\\frac{\\partial L}{\\partial x_1} = \\prod_{t=1}^{T-1} \\big( w \\cdot (1 - h_{t+1}^2) \\big) = ${res.rawGradX1.toExponential(2)}`;

    return {
      w,
      T,
      mode,
      clipping,
      h: res.h,
      gradProfile: res.gradProfile,
      rawGradX1: res.rawGradX1,
      finalGradX1: res.finalGradX1,
      isClipped: res.isClipped,
      status,
      formulaKaTeX,
      verdict
    };
  }
}

export const PRESETS = [
  {
    id: 'vanish_linear',
    label: 'Tiêu Biến (w=0.5, Tuyến tính) 🥶',
    state: { w: 0.5, T: 10, mode: 'linear', clipping: false }
  },
  {
    id: 'explode_linear',
    label: 'Bùng Nổ (w=1.5, Tuyến tính) 🔥',
    state: { w: 1.5, T: 10, mode: 'linear', clipping: false }
  },
  {
    id: 'clipped_explode',
    label: 'Cứu Bùng Nổ bằng Clipping ✂️',
    state: { w: 1.5, T: 10, mode: 'linear', clipping: true }
  },
  {
    id: 'tanh_rnn',
    label: 'Mạng Tanh (w=1.0) 📉',
    state: { w: 1.0, T: 10, mode: 'tanh', clipping: false }
  },
  {
    id: 'lstm_highway',
    label: 'Cao Tốc LSTM (f=0.95) 🛣️',
    state: { w: 1.0, T: 10, mode: 'lstm_highway', clipping: false }
  }
];
