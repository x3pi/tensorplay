/**
 * Bài 07: Dò tay phép nhân ma trận trên chip của robot
 * Mô phỏng 3 vòng lặp `for i, for j, for l` và mảng 1D.
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      // M=2, K=3, N=2
      A: [1, 2, 0, 0, 1, -1],
      B: [1, 0, 0, 1, 1, 1],
      C: [0, 0, 0, 0],
      M: 2,
      K: 3,
      N: 2,
      currentStep: 0, // Từ 0 đến M*N*K - 1 (12 bước)
    };
    return this.calculate();
  }

  applyPreset(presetState) {
    this.state = { ...this.state, ...presetState, currentStep: 0 };
    return this.calculate();
  }

  onUserUpdate(partialState) {
    this.state = { ...this.state, ...partialState };
    return this.calculate();
  }

  calculate() {
    const s = this.state;
    const totalSteps = s.M * s.N * s.K;
    
    let C_temp = [0, 0, 0, 0];
    let i_curr = 0, j_curr = 0, l_curr = 0;
    
    // Simulate up to currentStep
    let stepCount = 0;
    for (let i = 0; i < s.M; i++) {
      for (let j = 0; j < s.N; j++) {
        for (let l = 0; l < s.K; l++) {
          if (stepCount <= s.currentStep) {
            C_temp[i * s.N + j] += s.A[i * s.K + l] * s.B[l * s.N + j];
            i_curr = i;
            j_curr = j;
            l_curr = l;
          }
          stepCount++;
        }
      }
    }

    const idxA = i_curr * s.K + l_curr;
    const idxB = l_curr * s.N + j_curr;
    const idxC = i_curr * s.N + j_curr;
    const valA = s.A[idxA];
    const valB = s.B[idxB];
    const valC = C_temp[idxC];

    return {
      ...s,
      C: C_temp,
      totalSteps,
      i_curr, j_curr, l_curr,
      idxA, idxB, idxC,
      valA, valB, valC,
      formulaCppKaTeX: `\\text{C}[${i_curr} \\times ${s.N} + ${j_curr}] \\mathrel{+}= \\text{A}[${i_curr} \\times ${s.K} + ${l_curr}] \\times \\text{B}[${l_curr} \\times ${s.N} + ${j_curr}]`,
      formulaValKaTeX: `\\text{C}[${idxC}] \\mathrel{+}= ${valA} \\times ${valB} \\implies \\text{C}[${idxC}] = ${valC}`
    };
  }
}

export const PRESETS = [
  {
    id: "bai6_1_init",
    label: "Ma trận mẫu (A 2x3, B 3x2)",
    state: {
      A: [1, 2, 0, 0, 1, -1],
      B: [1, 0, 0, 1, 1, 1],
      M: 2, K: 3, N: 2,
      currentStep: 0
    }
  }
];
