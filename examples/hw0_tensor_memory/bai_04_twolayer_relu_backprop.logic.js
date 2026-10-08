/**
 * Bài 04: Mạng Nơ-ron 2 Tầng & Cơ Chế Đóng/Mở Van ReLU (Matrix Backprop)
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      x1: 1.0, x2: 1.0,
      w1_00: 1.0, w1_01: -2.0, w1_10: 0.0, w1_11: 1.0,
      w2_00: 1.0, w2_01: 0.0, w2_10: 0.0, w2_11: 1.0,
      y: 1,
      lr: 0.5
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
    const c = this.calculate();
    // Update W2
    this.state.w2_00 -= this.state.lr * c.gw2_00;
    this.state.w2_01 -= this.state.lr * c.gw2_01;
    this.state.w2_10 -= this.state.lr * c.gw2_10;
    this.state.w2_11 -= this.state.lr * c.gw2_11;
    
    // Update W1
    this.state.w1_00 -= this.state.lr * c.gw1_00;
    this.state.w1_01 -= this.state.lr * c.gw1_01;
    this.state.w1_10 -= this.state.lr * c.gw1_10;
    this.state.w1_11 -= this.state.lr * c.gw1_11;
    
    return this.calculate();
  }

  calculate() {
    const s = this.state;
    // FORWARD
    // Z1 = X * W1
    const z1_0 = s.x1 * s.w1_00 + s.x2 * s.w1_10;
    const z1_1 = s.x1 * s.w1_01 + s.x2 * s.w1_11;
    
    // A1 = ReLU(Z1)
    const a1_0 = Math.max(0, z1_0);
    const a1_1 = Math.max(0, z1_1);
    
    // Z2 = A1 * W2
    const z2_0 = a1_0 * s.w2_00 + a1_1 * s.w2_10;
    const z2_1 = a1_0 * s.w2_01 + a1_1 * s.w2_11;
    
    // Softmax
    const mZ = Math.max(z2_0, z2_1);
    const e0 = Math.exp(z2_0 - mZ);
    const e1 = Math.exp(z2_1 - mZ);
    const sumE = e0 + e1;
    const p0 = e0 / sumE;
    const p1 = e1 / sumE;
    
    // BACKWARD
    // G2 = P - I_y (B=1)
    const i0 = s.y === 0 ? 1 : 0;
    const i1 = s.y === 1 ? 1 : 0;
    const g2_0 = p0 - i0;
    const g2_1 = p1 - i1;
    
    // Grad W2 = A1^T * G2
    const gw2_00 = a1_0 * g2_0;
    const gw2_01 = a1_0 * g2_1;
    const gw2_10 = a1_1 * g2_0;
    const gw2_11 = a1_1 * g2_1;
    
    // Dội về ẩn: G_hidden = G2 * W2^T
    // G2 (1x2), W2^T (2x2) -> 1x2
    // w2_00, w2_01 
    // w2_10, w2_11
    // => W2^T:
    // w2_00, w2_10
    // w2_01, w2_11
    const gh_0 = g2_0 * s.w2_00 + g2_1 * s.w2_01;
    const gh_1 = g2_0 * s.w2_10 + g2_1 * s.w2_11;
    
    // Qua ReLU
    const m0 = z1_0 > 0 ? 1 : 0;
    const m1 = z1_1 > 0 ? 1 : 0;
    const g1_0 = gh_0 * m0;
    const g1_1 = gh_1 * m1;
    
    // Grad W1 = X^T * G1
    const gw1_00 = s.x1 * g1_0;
    const gw1_01 = s.x1 * g1_1;
    const gw1_10 = s.x2 * g1_0;
    const gw1_11 = s.x2 * g1_1;

    return {
      ...s,
      z1_0, z1_1, a1_0, a1_1, z2_0, z2_1, p0, p1,
      g2_0, g2_1, gw2_00, gw2_01, gw2_10, gw2_11,
      gh_0, gh_1, m0, m1, g1_0, g1_1,
      gw1_00, gw1_01, gw1_10, gw1_11,
      formulaZ1KaTeX: `Z_1 = \\begin{bmatrix} ${z1_0.toFixed(1)} & ${z1_1.toFixed(1)} \\end{bmatrix}, A_1 = \\text{ReLU}(Z_1) = \\begin{bmatrix} ${a1_0.toFixed(1)} & ${a1_1.toFixed(1)} \\end{bmatrix}`,
      formulaGradW2KaTeX: `\\nabla_{W_2} = A_1^T G_2 = \\begin{bmatrix} ${gw2_00.toFixed(3)} & ${gw2_01.toFixed(3)} \\\\ ${gw2_10.toFixed(3)} & ${gw2_11.toFixed(3)} \\end{bmatrix}`,
      formulaG1KaTeX: `G_1 = (G_2 W_2^T) \\odot M = \\begin{bmatrix} ${gh_0.toFixed(3)} & ${gh_1.toFixed(3)} \\end{bmatrix} \\odot \\begin{bmatrix} ${m0} & ${m1} \\end{bmatrix} = \\begin{bmatrix} ${g1_0.toFixed(3)} & ${g1_1.toFixed(3)} \\end{bmatrix}`,
      formulaGradW1KaTeX: `\\nabla_{W_1} = X^T G_1 = \\begin{bmatrix} ${gw1_00.toFixed(3)} & ${gw1_01.toFixed(3)} \\\\ ${gw1_10.toFixed(3)} & ${gw1_11.toFixed(3)} \\end{bmatrix}`
    };
  }
}

export const PRESETS = [
  {
    id: "bai4_1",
    label: "Tình huống Bài 4.1 (Dập tắt Nơ-ron)",
    state: {
      x1: 1.0, x2: 1.0,
      w1_00: 1.0, w1_01: -2.0, w1_10: 0.0, w1_11: 1.0,
      w2_00: 1.0, w2_01: 0.0, w2_10: 0.0, w2_11: 1.0,
      y: 1, lr: 0.5
    }
  }
];
