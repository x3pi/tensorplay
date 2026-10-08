/**
 * Bài 18: Weight Decay — L2 Regularization vs AdamW
 * Path: examples/hw2_modules_conv/adamw_weight_decay.logic.js
 *
 * Aha: Cộng L2 vào gradient rồi đưa qua Adam KHÔNG tạo ra weight decay thực sự.
 * Phép chia cho căn bậc hai của bình phương gradient (1 / sqrt(v_hat)) trong Adam
 * làm triệt tiêu hệ số lambda, khiến trọng số teo nhanh gấp 10 lần và mất kiểm soát.
 * AdamW tách riêng (decouple) weight decay ra khỏi gradient để khôi phục đúng lực điều hòa.
 */

const round = (v, n = 4) => (typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(n)) + 0 : v);

export function stepSgdL2(w, gData, lr, lamb) {
  const gTotal = gData + lamb * w;
  const wNew = w - lr * gTotal;
  return { wNew, step: lr * gTotal, gTotal };
}

export function stepAdamL2(w, gData, lr, lamb, m = 0, v = 0, t = 1, beta1 = 0.9, beta2 = 0.999, eps = 1e-8) {
  const gTotal = gData + lamb * w;
  const mNew = beta1 * m + (1 - beta1) * gTotal;
  const vNew = beta2 * v + (1 - beta2) * (gTotal ** 2);
  const mHat = mNew / (1 - beta1 ** t);
  const vHat = vNew / (1 - beta2 ** t);
  const step = lr * mHat / (Math.sqrt(vHat) + eps);
  const wNew = w - step;
  return { wNew, step, m: mNew, v: vNew, mHat, vHat, gTotal };
}

export function stepAdamW(w, gData, lr, lamb, m = 0, v = 0, t = 1, beta1 = 0.9, beta2 = 0.999, eps = 1e-8) {
  // AdamW: Adam thuần túy chạy trên gData
  const mNew = beta1 * m + (1 - beta1) * gData;
  const vNew = beta2 * v + (1 - beta2) * (gData ** 2);
  const mHat = mNew / (1 - beta1 ** t);
  const vHat = vNew / (1 - beta2 ** t);
  const adamStep = lr * mHat / (Math.sqrt(vHat) + eps);
  // Weight decay độc lập tách riêng
  const decayStep = lr * lamb * w;
  const wNew = w - decayStep - adamStep;
  return { wNew, step: decayStep + adamStep, decayStep, adamStep, m: mNew, v: vNew, mHat, vHat, gTotal: gData };
}

export function simulateTrajectory(optimizer, steps = 5, config = {}) {
  const {
    w0 = 1.0,
    gData = 0.0,
    lr = 0.1,
    lamb = 0.1,
    beta1 = 0.9,
    beta2 = 0.999,
    eps = 1e-8
  } = config;

  let w = w0;
  let m = 0;
  let v = 0;
  const traj = [{ t: 0, w: round(w, 4), step: 0 }];

  for (let t = 1; t <= steps; t++) {
    let res;
    if (optimizer === 'sgd_l2') {
      res = stepSgdL2(w, gData, lr, lamb);
    } else if (optimizer === 'adam_l2') {
      res = stepAdamL2(w, gData, lr, lamb, m, v, t, beta1, beta2, eps);
      m = res.m;
      v = res.v;
    } else {
      res = stepAdamW(w, gData, lr, lamb, m, v, t, beta1, beta2, eps);
      m = res.m;
      v = res.v;
    }
    w = res.wNew;
    traj.push({ t, w: round(w, 4), step: round(res.step, 4) });
  }

  return traj;
}

export const PRESETS = [
  {
    id: 'adamw_normal',
    label: 'AdamW Chuẩn ✅ (Decoupled, λ=0.1)',
    desc: 'Weight decay chuẩn tách riêng: ở bước 1 trọng số giảm đúng 1% từ 1.0 xuống 0.99.',
    state: { optimizer: 'adamw', lamb: 0.1, gData: 0.0, lr: 0.1, steps: 5 }
  },
  {
    id: 'adam_l2_fail',
    label: 'Adam + L2 Cũ ❌ (Bị méo bởi 1/√v, λ=0.1)',
    desc: 'L2 đưa vào gradient: bước chuẩn hóa 1/√v làm bước nhảy nổ lên 0.1, trọng số tụt gấp 10 lần xuống 0.90!',
    state: { optimizer: 'adam_l2', lamb: 0.1, gData: 0.0, lr: 0.1, steps: 5 }
  },
  {
    id: 'adam_l2_lambda_small',
    label: 'Adam + L2 Liệt Hệ Số λ ❌ (λ=0.01)',
    desc: 'Dù giảm λ 10 lần (0.01), Adam+L2 vẫn nhảy đúng 0.10 vì m_hat / √v_hat triệt tiêu hoàn toàn λ!',
    state: { optimizer: 'adam_l2', lamb: 0.01, gData: 0.0, lr: 0.1, steps: 5 }
  },
  {
    id: 'sgd_baseline',
    label: 'SGD + L2 (Baseline Tham Chiếu)',
    desc: 'Với SGD, L2 và Decoupled tương đương nhau: bước 1 đưa w từ 1.0 xuống 0.99.',
    state: { optimizer: 'sgd_l2', lamb: 0.1, gData: 0.0, lr: 0.1, steps: 5 }
  }
];

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      optimizer: 'adamw', // 'adamw' | 'adam_l2' | 'sgd_l2'
      lamb: 0.1,          // Weight decay lambda
      lr: 0.1,            // Tốc độ học
      gData: 0.0,         // Gradient dữ liệu thuần
      steps: 5            // Số bước mô phỏng
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
    const { optimizer, lamb, lr, gData, steps } = this.state;
    const w0 = 1.0;

    // Chi tiết bước 1
    const resSgd = stepSgdL2(w0, gData, lr, lamb);
    const resAdamL2 = stepAdamL2(w0, gData, lr, lamb, 0, 0, 1);
    const resAdamW = stepAdamW(w0, gData, lr, lamb, 0, 0, 1);

    // Quỹ đạo toàn bộ
    const trajCurrent = simulateTrajectory(optimizer, steps, { w0, gData, lr, lamb });
    const trajAdamW = simulateTrajectory('adamw', steps, { w0, gData, lr, lamb });
    const trajAdamL2 = simulateTrajectory('adam_l2', steps, { w0, gData, lr, lamb });

    const step1Current = optimizer === 'sgd_l2' ? resSgd : optimizer === 'adam_l2' ? resAdamL2 : resAdamW;

    let verdict;
    if (optimizer === 'adam_l2') {
      verdict = {
        type: 'danger',
        text: `🚨 ADAM + L2 THẤT BẠI: Lực kéo bước 1 là ${round(step1Current.step, 4)} (w tụt xuống ${round(step1Current.wNew, 4)})! Bước nhảy hoàn toàn không phụ thuộc vào λ vì m̂ / √v̂ = 1.0 triệt tiêu λ.`
      };
    } else if (optimizer === 'adamw') {
      verdict = {
        type: 'success',
        text: `✅ ADAMW CHUẨN XÁC: Trọng số giảm có kiểm soát w1 = ${round(step1Current.wNew, 4)} (bước giảm đúng lr·λ·w = ${round(step1Current.step, 4)}). Hệ số λ phát huy 100% tác dụng!`
      };
    } else {
      verdict = {
        type: 'warning',
        text: `ℹ️ SGD + L2 (BASELINE): Với SGD, L2 và Decoupled cho kết quả y hệt (w1 = ${round(step1Current.wNew, 4)}). Sai lệch chỉ xuất hiện ở các thuật toán thích nghi như Adam!`
      };
    }

    let formulaKaTeX;
    if (optimizer === 'adamw') {
      formulaKaTeX = `w_1 = w_0 - \\alpha \\lambda w_0 - \\alpha \\frac{\\hat{m}_1}{\\sqrt{\\hat{v}_1} + \\epsilon} = 1.0 - ${lr} \\times ${lamb} \\times 1.0 - ${round(step1Current.adamStep, 4)} = ${round(step1Current.wNew, 4)}`;
    } else if (optimizer === 'adam_l2') {
      formulaKaTeX = `\\Delta w = \\alpha \\frac{\\lambda w_0}{\\sqrt{(\\lambda w_0)^2} + \\epsilon} \\approx \\alpha \\times 1 = ${lr} \\implies w_1 = 1.0 - ${lr} = 0.9000`;
    } else {
      formulaKaTeX = `w_1 = w_0 - \\alpha (g + \\lambda w_0) = 1.0 - ${lr} \\times (${gData} + ${lamb} \\times 1.0) = ${round(step1Current.wNew, 4)}`;
    }

    return {
      state: { ...this.state },
      w0,
      step1Details: step1Current,
      step1Sgd: resSgd,
      step1AdamL2: resAdamL2,
      step1AdamW: resAdamW,
      trajCurrent,
      trajAdamW,
      trajAdamL2,
      verdict,
      formulaKaTeX
    };
  }
}
