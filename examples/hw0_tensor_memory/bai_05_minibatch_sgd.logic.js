/**
 * Bài 06: Xử Lý Mini-batch B = 2 & Bản Chất Phép Chuyển Vị X^T
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      // X: 2x2 (B=2, n=2)
      x00: 1.0, x01: 0.0, // Ảnh 1 (DỪNG)
      x10: 0.0, x11: 1.0, // Ảnh 2 (ĐI THẲNG)
      
      // Theta: 2x2
      t00: 0.0, t01: 0.0,
      t10: 0.0, t11: 0.0,
      
      y0: 0, // Nhãn ảnh 1
      y1: 1, // Nhãn ảnh 2
      
      lr: 0.2
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
    this.state.t00 -= this.state.lr * c.gT00;
    this.state.t01 -= this.state.lr * c.gT01;
    this.state.t10 -= this.state.lr * c.gT10;
    this.state.t11 -= this.state.lr * c.gT11;
    return this.calculate();
  }

  calculate() {
    const s = this.state;
    const B = 2;
    
    // Z = X * Theta (2x2 * 2x2 = 2x2)
    const z00 = s.x00 * s.t00 + s.x01 * s.t10;
    const z01 = s.x00 * s.t01 + s.x01 * s.t11;
    
    const z10 = s.x10 * s.t00 + s.x11 * s.t10;
    const z11 = s.x10 * s.t01 + s.x11 * s.t11;
    
    // Softmax P
    const mZ0 = Math.max(z00, z01);
    const p00_raw = Math.exp(z00 - mZ0);
    const p01_raw = Math.exp(z01 - mZ0);
    const sum0 = p00_raw + p01_raw;
    const p00 = p00_raw / sum0;
    const p01 = p01_raw / sum0;
    
    const mZ1 = Math.max(z10, z11);
    const p10_raw = Math.exp(z10 - mZ1);
    const p11_raw = Math.exp(z11 - mZ1);
    const sum1 = p10_raw + p11_raw;
    const p10 = p10_raw / sum1;
    const p11 = p11_raw / sum1;
    
    // G = (P - Iy) / B
    const i00 = s.y0 === 0 ? 1 : 0;
    const i01 = s.y0 === 1 ? 1 : 0;
    
    const i10 = s.y1 === 0 ? 1 : 0;
    const i11 = s.y1 === 1 ? 1 : 0;
    
    const g00 = (p00 - i00) / B;
    const g01 = (p01 - i01) / B;
    
    const g10 = (p10 - i10) / B;
    const g11 = (p11 - i11) / B;
    
    // Grad Theta = X^T * G
    // X^T = [[x00, x10], [x01, x11]]
    const gT00 = s.x00 * g00 + s.x10 * g10;
    const gT01 = s.x00 * g01 + s.x10 * g11;
    const gT10 = s.x01 * g00 + s.x11 * g10;
    const gT11 = s.x01 * g01 + s.x11 * g11;

    return {
      ...s,
      z00, z01, z10, z11,
      p00, p01, p10, p11,
      i00, i01, i10, i11,
      g00, g01, g10, g11,
      gT00, gT01, gT10, gT11,
      formulaZKaTeX: `Z = X \\theta = \\begin{bmatrix} ${z00.toFixed(2)} & ${z01.toFixed(2)} \\\\ ${z10.toFixed(2)} & ${z11.toFixed(2)} \\end{bmatrix}`,
      formulaGKaTeX: `G = \\frac{1}{2}(P - I_y) = \\begin{bmatrix} ${g00.toFixed(3)} & ${g01.toFixed(3)} \\\\ ${g10.toFixed(3)} & ${g11.toFixed(3)} \\end{bmatrix}`,
      formulaGradKaTeX: `\\nabla_\\theta L = X^T G = \\begin{bmatrix} ${s.x00} & ${s.x10} \\\\ ${s.x01} & ${s.x11} \\end{bmatrix} G = \\begin{bmatrix} ${gT00.toFixed(3)} & ${gT01.toFixed(3)} \\\\ ${gT10.toFixed(3)} & ${gT11.toFixed(3)} \\end{bmatrix}`
    };
  }
}

export const PRESETS = [
  {
    id: "bai5_init",
    label: "Khởi tạo ma trận 0, B=2",
    state: {
      x00: 1.0, x01: 0.0,
      x10: 0.0, x11: 1.0,
      t00: 0.0, t01: 0.0,
      t10: 0.0, t11: 0.0,
      y0: 0, y1: 1, lr: 0.2
    }
  }
];
