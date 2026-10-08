/**
 * Logic Module for Bài 03: Chu Trình Softmax Regression (Ma trận)
 * Path: examples/hw0_tensor_memory/bai_03_softmax_regression.logic.js
 * Chu trình hoàn chỉnh: Forward (Z = X * W) -> Softmax (P) -> Loss (Cross-Entropy) -> Backward (G = P - I_y) -> Gradient (nabla_W = X^T * G) -> Cập nhật SGD (W_new = W - alpha * nabla_W)
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      x1: 2.0, // Cảm biến vạch ngang x0
      x2: 1.0, // Cảm biến vạch dọc x1
      w00: 0.0, w01: 0.0, // Trọng số từ x0 -> lớp 0 (Dừng), lớp 1 (Đi thẳng)
      w10: 0.0, w11: 0.0, // Trọng số từ x1 -> lớp 0 (Dừng), lớp 1 (Đi thẳng)
      y: 0, // Nhãn thật (0 = Dừng lại 🛑, 1 = Đi thẳng ⬆️)
      lr: 0.1, // Tốc độ học (Learning Rate alpha)
      stepCount: 0 // Đếm số bước huấn luyện
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

  stepSGD(numSteps = 1) {
    for (let s = 0; s < numSteps; s++) {
      const calc = this.calculate();
      this.state.w00 -= this.state.lr * calc.gradW00;
      this.state.w01 -= this.state.lr * calc.gradW01;
      this.state.w10 -= this.state.lr * calc.gradW10;
      this.state.w11 -= this.state.lr * calc.gradW11;
      this.state.stepCount = (this.state.stepCount || 0) + 1;
    }
    return this.calculate();
  }

  calculate() {
    const { x1, x2, w00, w01, w10, w11, y, lr, stepCount = 0 } = this.state;
    const B = 1; // Batch size = 1

    // Bước 1: Logits Z = X * W (Vector 1x2)
    const z0 = x1 * w00 + x2 * w10;
    const z1 = x1 * w01 + x2 * w11;

    // Bước 2: Softmax P (Vector 1x2)
    const maxZ = Math.max(z0, z1);
    const exp0 = Math.exp(z0 - maxZ);
    const exp1 = Math.exp(z1 - maxZ);
    const sumExp = exp0 + exp1;
    const p0 = exp0 / sumExp;
    const p1 = exp1 / sumExp;

    // Bước 3: Cross-Entropy Loss L = -ln(P_target)
    const py = y === 0 ? p0 : p1;
    const loss = -Math.log(Math.max(1e-15, py));

    // Bước 4: Vector Sai Số Dội Ngược G = (P - I_y) / B
    const i0 = y === 0 ? 1 : 0;
    const i1 = y === 1 ? 1 : 0;
    const g0 = (p0 - i0) / B;
    const g1 = (p1 - i1) / B;

    // Bước 5: Gradient Ma Trận \nabla_W = X^T * G
    // X: (1 x 2), X^T: (2 x 1), G: (1 x 2) => \nabla_W: (2 x 2)
    const gradW00 = x1 * g0;
    const gradW01 = x1 * g1;
    const gradW10 = x2 * g0;
    const gradW11 = x2 * g1;

    // Bước 6: Cập Nhật Trọng Số SGD: W_new = W - lr * \nabla_W
    // Delta W = -lr * \nabla_W
    const deltaW00 = -lr * gradW00;
    const deltaW01 = -lr * gradW01;
    const deltaW10 = -lr * gradW10;
    const deltaW11 = -lr * gradW11;

    const nextW00 = w00 + deltaW00;
    const nextW01 = w01 + deltaW01;
    const nextW10 = w10 + deltaW10;
    const nextW11 = w11 + deltaW11;

    // Nhãn mục tiêu dưới dạng văn bản
    const targetName = y === 0 ? 'Lớp 0 (Biển Dừng 🛑)' : 'Lớp 1 (Đi Thẳng ⬆️)';

    return {
      x1, x2, w00, w01, w10, w11, y, lr, stepCount,
      z0, z1, p0, p1, py, loss, g0, g1, i0, i1,
      targetName,
      gradW00, gradW01, gradW10, gradW11,
      deltaW00, deltaW01, deltaW10, deltaW11,
      nextW00, nextW01, nextW10, nextW11,
      formulaZKaTeX: `Z = \\begin{bmatrix} ${x1.toFixed(1)} & ${x2.toFixed(1)} \\end{bmatrix} \\begin{bmatrix} ${w00.toFixed(2)} & ${w01.toFixed(2)} \\\\ ${w10.toFixed(2)} & ${w11.toFixed(2)} \\end{bmatrix} = \\begin{bmatrix} ${z0.toFixed(2)} & ${z1.toFixed(2)} \\end{bmatrix}`,
      formulaPKaTeX: `P = \\text{softmax}(Z) = \\begin{bmatrix} ${(p0 * 100).toFixed(1)}\\% & ${(p1 * 100).toFixed(1)}\\% \\end{bmatrix}`,
      formulaLossKaTeX: `\\text{Loss} = -\\ln(P_{target}) = -\\ln(${py.toFixed(3)}) = ${loss.toFixed(3)}`,
      formulaGKaTeX: `G = P - I_y = \\begin{bmatrix} ${p0.toFixed(3)} - ${i0} & ${p1.toFixed(3)} - ${i1} \\end{bmatrix} = \\begin{bmatrix} ${g0.toFixed(3)} & ${g1.toFixed(3)} \\end{bmatrix}`,
      formulaGradKaTeX: `\\nabla_W = X^T \\cdot G = \\begin{bmatrix} ${x1.toFixed(1)} \\\\ ${x2.toFixed(1)} \\end{bmatrix} \\begin{bmatrix} ${g0.toFixed(3)} & ${g1.toFixed(3)} \\end{bmatrix} = \\begin{bmatrix} ${gradW00.toFixed(3)} & ${gradW01.toFixed(3)} \\\\ ${gradW10.toFixed(3)} & ${gradW11.toFixed(3)} \\end{bmatrix}`,
      formulaUpdateKaTeX: `W_{new} = \\begin{bmatrix} ${w00.toFixed(2)} & ${w01.toFixed(2)} \\\\ ${w10.toFixed(2)} & ${w11.toFixed(2)} \\end{bmatrix} - ${lr.toFixed(1)} \\begin{bmatrix} ${gradW00.toFixed(2)} & ${gradW01.toFixed(2)} \\\\ ${gradW10.toFixed(2)} & ${gradW11.toFixed(2)} \\end{bmatrix} = \\begin{bmatrix} ${nextW00.toFixed(2)} & ${nextW01.toFixed(2)} \\\\ ${nextW10.toFixed(2)} & ${nextW11.toFixed(2)} \\end{bmatrix}`
    };
  }
}

export const PRESETS = [
  {
    id: "init_zero",
    label: "1. Khởi tạo W=0 (Chưa học, P=[50%, 50%])",
    state: { x1: 2.0, x2: 1.0, w00: 0.0, w01: 0.0, w10: 0.0, w11: 0.0, y: 0, lr: 0.1, stepCount: 0 }
  },
  {
    id: "high_loss",
    label: "2. Dự đoán sai lệch (Phạt Loss cực nặng)",
    state: { x1: 2.0, x2: 1.0, w00: -1.5, w01: 2.0, w10: -1.0, w11: 1.5, y: 0, lr: 0.1, stepCount: 0 }
  },
  {
    id: "target_forward",
    label: "3. Nhãn Đi Thẳng (y=1, X=[0.5, 2.0])",
    state: { x1: 0.5, x2: 2.0, w00: 0.0, w01: 0.0, w10: 0.0, w11: 0.0, y: 1, lr: 0.1, stepCount: 0 }
  },
  {
    id: "trained_well",
    label: "4. Đã học tối ưu (Loss -> 0, P > 95%)",
    state: { x1: 2.0, x2: 1.0, w00: 1.6, w01: -1.6, w10: 0.8, w11: -0.8, y: 0, lr: 0.1, stepCount: 15 }
  }
];
