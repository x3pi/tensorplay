/**
 * Bài 04: The Computational Graph Flow (Needle HW1)
 * Thuật toán tính toán thuần túy: Forward Pass qua DAG và Backward Pass tích lũy gradient.
 * Đồ thị mẫu: z = x * w + b, Loss L = 0.5 * (z - y)^2
 * Thể hiện nguyên lý += (accumulate gradient) khi nơ-ron có nhiều nhánh rẽ.
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      x: 2.0,
      w: 1.5,
      b: 0.5,
      y: 4.0, // target
      learningRate: 0.1,
      currentPhase: "idle" // 'idle' | 'forward' | 'backward' | 'updated'
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
    const { x, w, b, y, learningRate } = this.state;

    // --- FORWARD PASS ---
    // Node 1: p = x * w (MatMul / Mul)
    const p = x * w;

    // Node 2: z = p + b (Add bias)
    const z = p + b;

    // Node 3: diff = z - y (Sub target)
    const diff = z - y;

    // Node 4: Loss L = 0.5 * diff^2 (MSE Loss)
    const loss = 0.5 * diff * diff;

    // --- BACKWARD PASS (Adjoint chain rule) ---
    // dL/dL = 1.0
    const gradL = 1.0;

    // dL/ddiff = diff
    const gradDiff = gradL * diff;

    // dL/dz = gradDiff * 1.0
    const gradZ = gradDiff * 1.0;

    // dL/db = gradZ * 1.0 (nhánh bias)
    const gradB = gradZ * 1.0;

    // dL/dp = gradZ * 1.0 (nhánh tích số)
    const gradP = gradZ * 1.0;

    // dL/dw = gradP * x (đạo hàm theo trọng số w)
    const gradW = gradP * x;

    // dL/dx = gradP * w (đạo hàm dội ngược về input x)
    const gradX = gradP * w;

    // Cập nhật tham số thử nghiệm theo Gradient Descent
    const wNew = w - learningRate * gradW;
    const bNew = b - learningRate * gradB;

    // Loss mới nếu áp dụng cập nhật
    const zNew = x * wNew + bNew;
    const lossNew = 0.5 * (zNew - y) * (zNew - y);

    return {
      x,
      w,
      b,
      y,
      p,
      z,
      diff,
      loss,
      gradL,
      gradDiff,
      gradZ,
      gradB,
      gradP,
      gradW,
      gradX,
      wNew,
      bNew,
      lossNew,
      lossReduced: lossNew < loss,
      formulaForwardKaTeX: `z = (${x.toFixed(1)} \\times ${w.toFixed(1)}) + ${b.toFixed(1)} = ${z.toFixed(2)}, \\quad L = \\frac{1}{2}(${z.toFixed(2)} - ${y.toFixed(1)})^2 = ${loss.toFixed(4)}`,
      formulaBackwardKaTeX: `\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial z} \\cdot x = ${gradZ.toFixed(2)} \\times ${x.toFixed(1)} = ${gradW.toFixed(2)}`
    };
  }
}

export const PRESETS = [
  {
    id: "default_flow",
    label: "Mặc định (x=2.0, w=1.5)",
    state: { x: 2.0, w: 1.5, b: 0.5, y: 4.0 }
  },
  {
    id: "perfect_prediction",
    label: "Dự đoán chuẩn (Loss = 0)",
    state: { x: 2.0, w: 1.75, b: 0.5, y: 4.0 } // z = 2*1.75 + 0.5 = 4.0
  },
  {
    id: "overshoot",
    label: "Dự đoán quá đà (z >> y)",
    state: { x: 3.0, w: 2.0, b: 1.0, y: 2.0 } // z = 7.0, diff = +5.0
  }
];
