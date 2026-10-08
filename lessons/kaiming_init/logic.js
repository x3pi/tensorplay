/**
 * Logic Module: Khởi tạo Kaiming — giữ "năng lượng" tín hiệu qua mạng sâu.
 * Path: lessons/kaiming_init/logic.js
 *
 * Mạng L tầng, mỗi tầng có fan_in = n nơ-ron, trọng số W ~ N(0, σ²).
 * Với đầu vào có E[x²] = 1, mỗi tầng nhân "năng lượng" tín hiệu với hệ số:
 *   g = n · σ² · k     (k = ½ với ReLU vì ReLU chặn một nửa, k = 1 với tuyến tính)
 * Sau L tầng: E_L = g^L.  Gradient đi ngược cũng bị nhân đúng hệ số đó mỗi tầng.
 *   g < 1 → tiêu biến (vanishing),  g > 1 → bùng nổ (exploding),  g = 1 → ổn định.
 * Kaiming (He) chọn σ² = 2/n để g = 1 với ReLU. Xavier chọn σ² = 1/n (g = 1 với tuyến tính).
 */

export const FAN_IN = 4;
export const VANISH_THRESHOLD = 1e-3;
export const EXPLODE_THRESHOLD = 1e3;

export const INIT_SCHEMES = {
  small:   { label: 'Số nhỏ cố định $\\sigma^2 = 0.01$', variance: () => 0.01 },
  xavier:  { label: 'Xavier $\\sigma^2 = 1/n$',           variance: (n) => 1 / n },
  kaiming: { label: 'Kaiming $\\sigma^2 = 2/n$',          variance: (n) => 2 / n },
  big:     { label: 'Số lớn $\\sigma^2 = 1$',             variance: () => 1 }
};

export function layerGain(n, variance, activation) {
  const k = activation === 'relu' ? 0.5 : 1;
  return n * variance * k;
}

/** Năng lượng tín hiệu sau từng tầng: [E_0 = 1, E_1, …, E_L] */
export function energyProfile(gain, depth) {
  const out = [1];
  for (let l = 1; l <= depth; l++) out.push(out[l - 1] * gain);
  return out;
}

export function classify(energy) {
  if (energy < VANISH_THRESHOLD) return 'vanishing';
  if (energy > EXPLODE_THRESHOLD) return 'exploding';
  return 'healthy';
}

const fmt = (x) => {
  if (x === 0) return '0';
  if (Math.abs(x) < 1e-3 || Math.abs(x) >= 1e4) return x.toExponential(2);
  return String(Math.round(x * 1e4) / 1e4);
};

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      scheme: 'kaiming',
      activation: 'relu',
      depth: 10
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
    const { scheme, activation, depth } = this.state;
    const n = FAN_IN;
    const variance = INIT_SCHEMES[scheme].variance(n);
    const gain = layerGain(n, variance, activation);
    const profile = energyProfile(gain, depth);
    const finalEnergy = profile[depth];
    const status = classify(finalEnergy);
    const finalStd = Math.sqrt(finalEnergy);

    // Tầng đầu tiên rơi vào vùng nguy hiểm
    const firstBadLayer = profile.findIndex(e => classify(e) !== 'healthy');

    // So sánh nhanh 4 cách khởi tạo cho cấu hình hiện tại
    const comparison = Object.entries(INIT_SCHEMES).map(([id, s]) => {
      const g = layerGain(n, s.variance(n), activation);
      const e = g ** depth;
      return { id, gain: g, energy: e, status: classify(e) };
    });

    const k = activation === 'relu' ? '\\tfrac{1}{2}' : '1';
    const gainKaTeX = `g = n \\cdot \\sigma^2 \\cdot k = ${n} \\cdot ${fmt(variance)} \\cdot ${k} = ${fmt(gain)}`;
    const energyKaTeX = `E_{${depth}} = g^{${depth}} = ${fmt(gain)}^{${depth}} = ${fmt(finalEnergy)}`;

    let verdict;
    if (status === 'vanishing') {
      verdict = {
        type: 'danger',
        text: `🥶 Tiêu biến: sau ${depth} tầng tín hiệu chỉ còn ${fmt(finalEnergy)} (từ tầng ${firstBadLayer} đã dưới 10⁻³). Gradient về tới tầng đầu cũng nhỏ cỡ đó → tầng đầu gần như không học.`
      };
    } else if (status === 'exploding') {
      verdict = {
        type: 'danger',
        text: `🔥 Bùng nổ: sau ${depth} tầng năng lượng đạt ${fmt(finalEnergy)} (từ tầng ${firstBadLayer} đã trên 10³). Gradient cũng phình to tương tự → loss dễ thành NaN.`
      };
    } else if (Math.abs(gain - 1) < 1e-12) {
      verdict = {
        type: 'success',
        text: `✅ Cân bằng: mỗi tầng nhân đúng ×1, nên dù sâu ${depth} tầng tín hiệu vẫn giữ năng lượng 1.`
      };
    } else {
      verdict = {
        type: 'warning',
        text: `⚠️ Tạm ổn với ${depth} tầng (năng lượng ${fmt(finalEnergy)}), nhưng mỗi tầng vẫn nhân ×${fmt(gain)}. Tăng độ sâu là sẽ hỏng.`
      };
    }

    return {
      n,
      variance,
      gain,
      profile,
      finalEnergy,
      finalStd,
      status,
      firstBadLayer,
      comparison,
      gainKaTeX,
      energyKaTeX,
      verdict
    };
  }
}

export const PRESETS = [
  { id: 'kaiming_relu', label: 'Kaiming + ReLU ✅', state: { scheme: 'kaiming', activation: 'relu' } },
  { id: 'small_relu', label: 'Số nhỏ 0.01 + ReLU', state: { scheme: 'small', activation: 'relu' } },
  { id: 'xavier_relu', label: 'Xavier + ReLU', state: { scheme: 'xavier', activation: 'relu' } },
  { id: 'big_relu', label: 'Số lớn 1 + ReLU', state: { scheme: 'big', activation: 'relu' } },
  { id: 'xavier_linear', label: 'Xavier + tuyến tính', state: { scheme: 'xavier', activation: 'linear' } }
];
