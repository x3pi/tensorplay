/**
 * Van Kích Hoạt & Lời Nguyền Trọng Số 0 (Needle HW2)
 * Mô phỏng cơ chế van ReLU (cho qua nếu > 0, khóa sập nếu <= 0)
 * và Lời nguyền khởi tạo trọng số bằng 0 làm tê liệt đối xứng nơ-ron.
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      z: 1.5, // Input cho nơ-ron đơn
      // Trạng thái mạng 2 nơ-ron ẩn để demo lời nguyền đối xứng
      xInput: 2.0,
      w1: 0.0,
      w2: 0.0,
      b1: 0.0,
      b2: 0.0,
      targetY: 3.0,
      lr: 0.1
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

  stepSGD() {
    const calc = this.calculate();
    // Cập nhật w1, w2 theo gradient
    this.state.w1 -= this.state.lr * calc.gradW1;
    this.state.w2 -= this.state.lr * calc.gradW2;
    return this.calculate();
  }

  calculate() {
    const { z, xInput, w1, w2, b1, b2, targetY } = this.state;

    // --- 1. ĐƠN NƠ-RON RELU VALVE ---
    const reluOut = Math.max(0, z);
    const reluGrad = z > 0 ? 1.0 : 0.0;
    const isValveOpen = z > 0;

    // --- 2. LỜI NGUYỀN ĐỐI XỨNG (2 NƠ-RON ẨN) ---
    // Forward
    const z1 = xInput * w1 + b1;
    const z2 = xInput * w2 + b2;
    const a1 = Math.max(0, z1);
    const a2 = Math.max(0, z2);

    // Tầng ra giả định: y_pred = a1 + a2
    const yPred = a1 + a2;
    const diff = yPred - targetY;
    const loss = 0.5 * diff * diff;

    // Backward
    const gradY = diff; // dL/dy_pred
    const gradA1 = gradY * 1.0;
    const gradA2 = gradY * 1.0;

    const gradZ1 = gradA1 * (z1 > 0 ? 1.0 : 0.0);
    const gradZ2 = gradA2 * (z2 > 0 ? 1.0 : 0.0);

    const gradW1 = gradZ1 * xInput;
    const gradW2 = gradZ2 * xInput;

    const isSymmetric = Math.abs(w1 - w2) < 1e-6 && Math.abs(gradW1 - gradW2) < 1e-6;

    return {
      z,
      reluOut,
      reluGrad,
      isValveOpen,
      xInput,
      w1,
      w2,
      z1,
      z2,
      a1,
      a2,
      yPred,
      loss,
      gradW1,
      gradW2,
      isSymmetric,
      formulaValveKaTeX: `\\text{ReLU}(${z.toFixed(1)}) = ${reluOut.toFixed(1)}, \\quad \\frac{\\partial \\text{ReLU}}{\\partial z} = ${reluGrad.toFixed(1)}`,
      formulaSymmetryKaTeX: `w_1 = ${w1.toFixed(3)}, \\; w_2 = ${w2.toFixed(3)} \\implies \\nabla w_1 = ${gradW1.toFixed(2)}, \\; \\nabla w_2 = ${gradW2.toFixed(2)}`
    };
  }
}

export const PRESETS = [
  {
    id: "zero_curse",
    label: "Lời nguyền W = 0 (Bị tê liệt)",
    state: { w1: 0.0, w2: 0.0, b1: 0.0, b2: 0.0, z: -1.0 }
  },
  {
    id: "random_he_init",
    label: "Khởi tạo He/Kaiming (Phá vỡ đối xứng)",
    state: { w1: 0.8, w2: -0.4, b1: 0.1, b2: -0.1, z: 1.5 }
  },
  {
    id: "dying_relu",
    label: "Van chết (Dying ReLU, z < 0)",
    state: { z: -2.5 }
  }
];
