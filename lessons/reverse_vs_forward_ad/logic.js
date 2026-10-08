/**
 * Reverse-mode vs Forward-mode AD (Needle HW1)
 * So sánh độ phức tạp tính toán giữa Forward-mode (JVP) và Reverse-mode (VJP).
 * Chứng minh tại sao Deep Learning với N triệu tham số và M=1 hàm mất mát Loss
 * bắt buộc phải dùng Reverse-mode (Backpropagation).
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      numInputs: 1000, // N tham số
      numOutputs: 1,   // M đầu ra (trong DL thường M = 1 Loss)
      opsPerPass: 50,  // Số phép tính trong đồ thị
      // Mini function demo: f(x1, x2, x3) = x1*x2 + x2*x3
      x1: 2,
      x2: 3,
      x3: 4
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
    const { numInputs, numOutputs, opsPerPass, x1, x2, x3 } = this.state;

    // Chi phí Forward-mode: Cần N lượt chạy Forward để tính N cột của Jacobian
    const forwardPasses = numInputs;
    const forwardOps = forwardPasses * opsPerPass * 2; // dual number tốn ~2x ops

    // Chi phí Reverse-mode: Cần 1 lượt Forward + M lượt Reverse
    const reversePasses = numOutputs;
    const reverseOps = opsPerPass + reversePasses * opsPerPass * 2; // backward tốn ~2x ops

    // Tỉ số tăng tốc (Speedup factor)
    const speedup = Math.max(1, forwardOps / reverseOps);

    // Thời gian giả lập ở tốc độ 100 MFLOPs/giây
    const forwardTimeMs = (forwardOps / 100000).toFixed(2);
    const reverseTimeMs = (reverseOps / 100000).toFixed(2);

    // Tính toán mini function: f = x1*x2 + x2*x3
    // Đạo hàm tay:
    // df/dx1 = x2 = 3
    // df/dx2 = x1 + x3 = 2 + 4 = 6
    // df/dx3 = x2 = 3
    const fVal = x1 * x2 + x2 * x3;
    const df_dx1 = x2;
    const df_dx2 = x1 + x3;
    const df_dx3 = x2;

    return {
      numInputs,
      numOutputs,
      forwardPasses,
      forwardOps,
      reversePasses,
      reverseOps,
      speedup: Number(speedup.toFixed(1)),
      forwardTimeMs,
      reverseTimeMs,
      fVal,
      df_dx1,
      df_dx2,
      df_dx3,
      formulaComplexityKaTeX: `\\text{Forward}: O(N) = ${numInputs} \\text{ lượt} \\quad \\text{vs} \\quad \\text{Reverse}: O(M) = ${numOutputs} \\text{ lượt}`,
      formulaGradientKaTeX: `\\nabla f = \\begin{bmatrix} \\frac{\\partial f}{\\partial x_1} & \\frac{\\partial f}{\\partial x_2} & \\frac{\\partial f}{\\partial x_3} \\end{bmatrix} = \\begin{bmatrix} ${df_dx1} & ${df_dx2} & ${df_dx3} \\end{bmatrix}`
    };
  }
}

export const PRESETS = [
  {
    id: "deep_learning_scale",
    label: "Mô hình DL (N = 10,000, M = 1)",
    state: { numInputs: 10000, numOutputs: 1 }
  },
  {
    id: "llm_scale",
    label: "LLM Mini (N = 1,000,000, M = 1)",
    state: { numInputs: 1000000, numOutputs: 1 }
  },
  {
    id: "robotics_kinematics",
    label: "Động học Robot (N = 6 khớp, M = 6 toạ độ)",
    state: { numInputs: 6, numOutputs: 6 }
  }
];
