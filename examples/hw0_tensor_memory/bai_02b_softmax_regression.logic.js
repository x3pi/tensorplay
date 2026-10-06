/**
 * Bài 3: Trọn Vẹn Chu Trình Softmax Regression Bằng Tay
 * Forward -> Loss -> Backward -> Cập nhật SGD với công thức Ma trận
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      x1: 2.0, // Pixel 1 (ví dụ: hàng trên)
      x2: 1.0, // Pixel 2 (ví dụ: cột trái)
      w00: 0.0, w01: 0.0, // Trọng số từ x1 -> lớp 0, lớp 1
      w10: 0.0, w11: 0.0, // Trọng số từ x2 -> lớp 0, lớp 1
      y: 0, // Nhãn thật (0 = Dừng, 1 = Đi thẳng)
      lr: 0.1 // Tốc độ học
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
    this.state.w00 -= this.state.lr * calc.gradW00;
    this.state.w01 -= this.state.lr * calc.gradW01;
    this.state.w10 -= this.state.lr * calc.gradW10;
    this.state.w11 -= this.state.lr * calc.gradW11;
    return this.calculate();
  }

  calculate() {
    const { x1, x2, w00, w01, w10, w11, y, lr } = this.state;
    const B = 1; // Batch size = 1

    // Bước 1: Logits Z = X * W
    const z0 = x1 * w00 + x2 * w10;
    const z1 = x1 * w01 + x2 * w11;

    // Bước 2: Softmax P
    const maxZ = Math.max(z0, z1);
    const exp0 = Math.exp(z0 - maxZ);
    const exp1 = Math.exp(z1 - maxZ);
    const sumExp = exp0 + exp1;
    const p0 = exp0 / sumExp;
    const p1 = exp1 / sumExp;

    // Bước 3: Loss L = -ln(Py)
    const py = y === 0 ? p0 : p1;
    const loss = -Math.log(Math.max(1e-15, py));

    // Bước 4: Sai số đầu ra G = (P - I_y) / B
    const i0 = y === 0 ? 1 : 0;
    const i1 = y === 1 ? 1 : 0;
    const g0 = (p0 - i0) / B;
    const g1 = (p1 - i1) / B;

    // Bước 5: Gradient \\nabla_W = X^T * G
    // X là 1x2: [x1, x2]
    // G là 1x2: [g0, g1]
    // X^T là 2x1, G là 1x2 => X^T * G là 2x2
    const gradW00 = x1 * g0;
    const gradW01 = x1 * g1;
    const gradW10 = x2 * g0;
    const gradW11 = x2 * g1;

    return {
      x1, x2, w00, w01, w10, w11, y, lr,
      z0, z1, p0, p1, loss, g0, g1,
      gradW00, gradW01, gradW10, gradW11,
      formulaZKaTeX: `Z = \\begin{bmatrix} ${x1} & ${x2} \\end{bmatrix} \\begin{bmatrix} ${w00.toFixed(2)} & ${w01.toFixed(2)} \\\\ ${w10.toFixed(2)} & ${w11.toFixed(2)} \\end{bmatrix} = \\begin{bmatrix} ${z0.toFixed(2)} & ${z1.toFixed(2)} \\end{bmatrix}`,
      formulaPKaTeX: `P = \\text{softmax}(Z) = \\begin{bmatrix} ${(p0*100).toFixed(1)}\\% & ${(p1*100).toFixed(1)}\\% \\end{bmatrix}`,
      formulaGKaTeX: `G = P - I_y = \\begin{bmatrix} ${p0.toFixed(3)} - ${i0} & ${p1.toFixed(3)} - ${i1} \\end{bmatrix} = \\begin{bmatrix} ${g0.toFixed(3)} & ${g1.toFixed(3)} \\end{bmatrix}`,
      formulaGradKaTeX: `\\nabla_W = X^T \\cdot G = \\begin{bmatrix} ${x1} \\\\ ${x2} \\end{bmatrix} \\begin{bmatrix} ${g0.toFixed(3)} & ${g1.toFixed(3)} \\end{bmatrix} = \\begin{bmatrix} ${gradW00.toFixed(3)} & ${gradW01.toFixed(3)} \\\\ ${gradW10.toFixed(3)} & ${gradW11.toFixed(3)} \\end{bmatrix}`
    };
  }
}

export const PRESETS = [
  {
    id: "init_zero",
    label: "Khởi tạo 0 (Robot chưa biết gì)",
    state: { x1: 2.0, x2: 1.0, w00: 0.0, w01: 0.0, w10: 0.0, w11: 0.0, y: 0, lr: 0.1 }
  },
  {
    id: "high_loss",
    label: "Dự đoán sai nghiêm trọng",
    state: { x1: 2.0, x2: 1.0, w00: -1.0, w01: 2.0, w10: -0.5, w11: 1.0, y: 0, lr: 0.1 }
  }
];
