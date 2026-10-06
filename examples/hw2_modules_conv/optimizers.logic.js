/**
 * Logic Module: Động Học Của Các Bộ Tối Ưu (SGD vs Momentum vs Adam).
 * Path: examples/hw2_modules_conv/optimizers.logic.js
 *
 * Hàm mục tiêu: f(x, y) = 0.5 * (0.2 * x^2 + 4 * y^2)
 * Điểm xuất phát: (-4, 1), cực tiểu tại (0, 0).
 * Gradient: g = [0.2 * x, 4 * y]
 *
 * Các thuật toán:
 * 1. SGD: p_{t+1} = p_t - lr * g_t
 * 2. Momentum: u_{t+1} = beta * u_t + g_t; p_{t+1} = p_t - lr * u_{t+1} (beta = 0.9)
 * 3. Adam: m_t, v_t với beta1 = 0.9, beta2 = 0.999, có/không có bias correction.
 */

export const START_POINT = [-4, 1];
export const HESSIAN = [0.2, 4];

export function loss(p) {
  return 0.5 * (HESSIAN[0] * p[0] * p[0] + HESSIAN[1] * p[1] * p[1]);
}

export function gradient(p) {
  return [HESSIAN[0] * p[0], HESSIAN[1] * p[1]];
}

export function runOptimization({
  optimizer = 'sgd',
  lr = 0.1,
  steps = 40,
  beta = 0.9,
  beta1 = 0.9,
  beta2 = 0.999,
  biasCorrection = true,
  eps = 1e-8
}) {
  let p = [...START_POINT];
  let u = [0, 0];
  let m = [0, 0];
  let v = [0, 0];

  const trajectory = [[...p]];
  const losses = [loss(p)];

  for (let t = 1; t <= steps; t++) {
    const g = gradient(p);

    if (optimizer === 'sgd') {
      p = [p[0] - lr * g[0], p[1] - lr * g[1]];
    } else if (optimizer === 'momentum') {
      u = [beta * u[0] + g[0], beta * u[1] + g[1]];
      p = [p[0] - lr * u[0], p[1] - lr * u[1]];
    } else if (optimizer === 'adam') {
      m = [beta1 * m[0] + (1 - beta1) * g[0], beta1 * m[1] + (1 - beta1) * g[1]];
      v = [beta2 * v[0] + (1 - beta2) * g[0] * g[0], beta2 * v[1] + (1 - beta2) * g[1] * g[1]];

      const mHat = biasCorrection
        ? [m[0] / (1 - Math.pow(beta1, t)), m[1] / (1 - Math.pow(beta1, t))]
        : [...m];
      const vHat = biasCorrection
        ? [v[0] / (1 - Math.pow(beta2, t)), v[1] / (1 - Math.pow(beta2, t))]
        : [...v];

      p = [
        p[0] - (lr * mHat[0]) / (Math.sqrt(vHat[0]) + eps),
        p[1] - (lr * mHat[1]) / (Math.sqrt(vHat[1]) + eps)
      ];
    }

    // Bảo vệ tràn số nếu phân kỳ
    if (Math.abs(p[0]) > 100 || Math.abs(p[1]) > 100) {
      trajectory.push([...p]);
      losses.push(loss(p));
      break;
    }

    trajectory.push([...p]);
    losses.push(loss(p));
  }

  return { trajectory, losses, finalP: p, finalLoss: losses[losses.length - 1] };
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      optimizer: 'sgd', // 'sgd' | 'momentum' | 'adam'
      lr: 0.1,
      steps: 40,
      biasCorrection: true
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
    const { optimizer, lr, steps, biasCorrection } = this.state;
    const res = runOptimization({ optimizer, lr, steps, biasCorrection });

    const isDiverged = res.finalLoss > 100 || isNaN(res.finalLoss);

    let verdict;
    if (isDiverged) {
      verdict = {
        type: 'danger',
        text: `💥 Phân kỳ! Learning rate lr=${lr} vượt quá giới hạn ổn định trên trục dốc (đạo hàm bậc 2 là 4, đòi hỏi lr < 0.5 với SGD).`
      };
    } else if (optimizer === 'sgd') {
      verdict = {
        type: res.finalLoss < 0.05 ? 'success' : 'warning',
        text: res.finalLoss < 0.05
          ? `✅ SGD về gần cực tiểu sau ${steps} bước (Loss = ${res.finalLoss.toFixed(4)}).`
          : `🐢 SGD bị chậm ở thung lũng dẹt: trục dốc (y) dao động ziczac trong khi trục thoải (x) tiến rất chậm (Loss còn ${res.finalLoss.toFixed(4)}).`
      };
    } else if (optimizer === 'momentum') {
      verdict = {
        type: 'success',
        text: `🚀 Momentum: Tích lũy xung lượng triệt tiêu dao động trên trục y và tăng tốc dọc theo trục x (Loss còn ${res.finalLoss.toFixed(4)}).`
      };
    } else {
      verdict = {
        type: biasCorrection ? 'success' : 'warning',
        text: biasCorrection
          ? `⚡ Adam: Tự thích ứng bước nhảy riêng cho từng chiều bằng căn bậc hai v_t (Loss còn ${res.finalLoss.toFixed(4)}).`
          : `⚠️ Adam không hiệu chỉnh bias: Bước nhảy ban đầu bị co hẹp hoặc lệch pha do m_t, v_t khởi tạo bằng 0.`
      };
    }

    return {
      optimizer,
      lr,
      steps,
      biasCorrection,
      trajectory: res.trajectory,
      losses: res.losses,
      finalP: res.finalP,
      finalLoss: res.finalLoss,
      isDiverged,
      verdict
    };
  }
}

export const PRESETS = [
  {
    id: 'sgd_default',
    label: 'SGD Mặc Định (lr=0.1) 🐢',
    state: { optimizer: 'sgd', lr: 0.1, steps: 40, biasCorrection: true }
  },
  {
    id: 'sgd_diverge',
    label: 'SGD Quá Lớn (lr=0.55) 💥',
    state: { optimizer: 'sgd', lr: 0.55, steps: 20, biasCorrection: true }
  },
  {
    id: 'momentum_fast',
    label: 'Momentum (lr=0.1, β=0.9) 🚀',
    state: { optimizer: 'momentum', lr: 0.1, steps: 40, biasCorrection: true }
  },
  {
    id: 'adam_corrected',
    label: 'Adam Chuẩn (lr=0.1) ⚡',
    state: { optimizer: 'adam', lr: 0.1, steps: 40, biasCorrection: true }
  },
  {
    id: 'adam_no_bc',
    label: 'Adam Không Bias Correction ⚠️',
    state: { optimizer: 'adam', lr: 0.1, steps: 40, biasCorrection: false }
  }
];
