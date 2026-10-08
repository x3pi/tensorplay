/**
 * LR Schedule — Warmup Giữ Khởi Đầu Êm, Cosine Decay Dọn Nhiễu Cuối
 * Path: lessons/lr_schedule_warmup/logic.js
 *
 * Bài toán đồ chơi 1 chiều: L = (1/2) a_t w^2, w_0 = 1, T = 12 bước.
 *   - Độ cong a_t = 4 trong 3 bước đầu ("địa hình dốc lúc khởi đầu"), sau đó a_t = 1.
 *   - Gradient có nhiễu xác định: g_t = a_t * w_t + n_t, n_t = +0.2 (t chẵn), -0.2 (t lẻ).
 *   - Cập nhật: w_{t+1} = w_t - lr_t * g_t.
 * GD ổn định khi |1 - lr * a| < 1, tức lr < 2/a: với a = 4 là lr < 0.5.
 * Lịch lr: hằng số lr_max; warmup tuyến tính W = 4 bước; cosine decay về 0 ở bước T.
 */

export const T = 12;
export const WARMUP_STEPS = 4;
export const NOISE = 0.2;
export const SHARP_STEPS = 3;

const round = (v, n = 4) => Number(v.toFixed(n)) + 0;

export function lrAt(t, { lrMax, warmup, decay }) {
  const start = warmup ? WARMUP_STEPS : 0;
  if (warmup && t < WARMUP_STEPS) return (lrMax * (t + 1)) / WARMUP_STEPS;
  if (decay) {
    const s = (t - start) / (T - start);
    return lrMax * 0.5 * (1 + Math.cos(Math.PI * s));
  }
  return lrMax;
}

export function simulate(opts) {
  let w = 1.0;
  const ws = [w];
  const lrs = [];
  for (let t = 0; t < T; t++) {
    const a = t < SHARP_STEPS ? 4 : 1;
    const noise = t % 2 === 0 ? NOISE : -NOISE;
    const lr = lrAt(t, opts);
    w = w - lr * (a * w + noise);
    ws.push(w);
    lrs.push(lr);
  }
  return { ws, lrs };
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { lrMax: 0.6, warmup: false, decay: false };
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
    const { lrMax, warmup, decay } = this.state;
    const { ws, lrs } = simulate({ lrMax, warmup, decay });
    const peak = Math.max(...ws.map(Math.abs));
    const finalAbs = Math.abs(ws[ws.length - 1]);
    const lastFew = ws.slice(-4).map(Math.abs);
    const wiggle = Math.max(...lastFew);

    // Hệ số khuếch đại mỗi bước ở vùng dốc: |1 - lr * 4|
    const sharpGains = lrs.slice(0, SHARP_STEPS).map(lr => Math.abs(1 - lr * 4));
    const unstableStart = sharpGains.some(g => g > 1);

    let verdict;
    if (unstableStart) {
      verdict = {
        type: 'danger',
        text: `❌ Khởi đầu bùng nổ: ở vùng dốc ($a = 4$) lr vượt 2/a = 0.5 nên |w| bị phóng lên tới ${round(peak, 2)} (xuất phát từ 1.0). Với mạng thật đây là loss nhảy vọt hoặc NaN ngay đầu huấn luyện.`
      };
    } else if (!decay && wiggle > 0.05) {
      verdict = {
        type: 'warning',
        text: `⚠️ Khởi đầu êm (đỉnh |w| = ${round(peak, 2)}) nhưng cuối huấn luyện w vẫn dao động ±${round(wiggle, 3)} quanh 0 vì nhiễu gradient nhân với lr không giảm.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ Khởi đầu êm (đỉnh |w| = ${round(peak, 2)}) và kết thúc ổn định: |w| cuối = ${round(finalAbs, 3)}.`
      };
    }

    return {
      lrMax,
      warmup,
      decay,
      ws: ws.map(v => round(v)),
      lrs: lrs.map(v => round(v)),
      peak: round(peak),
      finalAbs: round(finalAbs),
      wiggle: round(wiggle),
      stableLimit: 0.5,
      unstableStart,
      verdict,
      formulaKaTeX: `w_{t+1} = w_t - \\eta_t\\,(a_t w_t + n_t), \\qquad \\text{ổn định} \\iff \\eta_t < \\frac{2}{a_t} = ${round(2 / 4, 2)}\\ (a_t = 4)`
    };
  }
}

export const PRESETS = [
  { id: 'constant', label: 'lr hằng 0.6, không warmup ❌', state: { lrMax: 0.6, warmup: false, decay: false } },
  { id: 'warmup_only', label: 'Thêm warmup 4 bước', state: { lrMax: 0.6, warmup: true, decay: false } },
  { id: 'warmup_cosine', label: 'Warmup + cosine decay ✅', state: { lrMax: 0.6, warmup: true, decay: true } },
  { id: 'safe_small_lr', label: 'lr nhỏ 0.4: an toàn nhưng chậm', state: { lrMax: 0.4, warmup: false, decay: false } }
];
