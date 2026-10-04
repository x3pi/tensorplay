/**
 * Bài 09: Ổn Định Nội Bộ Với BatchNorm (Needle HW2)
 * Chuẩn hóa mini-batch về mean=0, var=1, scale gamma và shift beta.
 * Phân định rõ ràng:
 * - Training Mode: dùng mean/var của batch hiện tại và cập nhật running stats.
 * - Inference/Eval Mode: dùng running_mean/running_var cố định.
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      mode: "training", // 'training' | 'inference'
      // Batch 4 phần tử
      batch: [2.0, 4.0, 6.0, 8.0],
      gamma: 1.0,
      beta: 0.0,
      eps: 1e-5,
      momentum: 0.1,
      runningMean: 0.0,
      runningVar: 1.0,
      // Sample đơn lẻ cho inference
      testSample: 4.0
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
    const { mode, batch, gamma, beta, eps, momentum, runningMean, runningVar, testSample } = this.state;
    const B = batch.length;

    // 1. Tính toán thống kê theo batch
    const meanB = batch.reduce((a, b) => a + b, 0) / B;
    const varB = batch.reduce((sum, x) => sum + (x - meanB) ** 2, 0) / B;

    // Cập nhật running stats giả lập nếu ở training mode
    const newRunningMean = (1 - momentum) * runningMean + momentum * meanB;
    const newRunningVar = (1 - momentum) * runningVar + momentum * varB;

    let normalizedBatch = [];
    let outputBatch = [];
    let testOutput = 0;

    if (mode === "training") {
      // Dùng meanB và varB
      normalizedBatch = batch.map(x => (x - meanB) / Math.sqrt(varB + eps));
      outputBatch = normalizedBatch.map(xHat => gamma * xHat + beta);

      // Nếu test mẫu đơn lẻ ở training mode (B=1): mẫu trừ chính nó ra 0!
      testOutput = 0.0 + beta;
    } else {
      // Inference Mode: Dùng runningMean và runningVar
      normalizedBatch = batch.map(x => (x - runningMean) / Math.sqrt(runningVar + eps));
      outputBatch = normalizedBatch.map(xHat => gamma * xHat + beta);

      const testNorm = (testSample - runningMean) / Math.sqrt(runningVar + eps);
      testOutput = gamma * testNorm + beta;
    }

    // Mean và variance của output batch
    const outMean = outputBatch.reduce((a, b) => a + b, 0) / B;
    const outVar = outputBatch.reduce((sum, y) => sum + (y - outMean) ** 2, 0) / B;

    return {
      mode,
      batch,
      gamma,
      beta,
      meanB: Number(meanB.toFixed(2)),
      varB: Number(varB.toFixed(2)),
      runningMean: Number(runningMean.toFixed(2)),
      runningVar: Number(runningVar.toFixed(2)),
      newRunningMean: Number(newRunningMean.toFixed(2)),
      newRunningVar: Number(newRunningVar.toFixed(2)),
      normalizedBatch: normalizedBatch.map(v => Number(v.toFixed(2))),
      outputBatch: outputBatch.map(v => Number(v.toFixed(2))),
      outMean: Number(outMean.toFixed(2)),
      outVar: Number(outVar.toFixed(2)),
      testSample,
      testOutput: Number(testOutput.toFixed(2)),
      formulaStatsKaTeX: `\\mu_B = ${meanB.toFixed(1)}, \\quad \\sigma_B^2 = ${varB.toFixed(1)} \\implies \\hat{x} = \\frac{x - \\mu_B}{\\sqrt{\\sigma_B^2 + \\epsilon}}`,
      formulaScaleShiftKaTeX: `y = \\gamma \\hat{x} + \\beta = ${gamma.toFixed(1)} \\cdot \\hat{x} + ${beta.toFixed(1)}`
    };
  }
}

export const PRESETS = [
  {
    id: "training_standard",
    label: "Training Chuẩn (gamma=1, beta=0)",
    state: { mode: "training", gamma: 1.0, beta: 0.0 }
  },
  {
    id: "scale_shift_active",
    label: "Scale & Shift (gamma=2, beta=1)",
    state: { mode: "training", gamma: 2.0, beta: 1.0 }
  },
  {
    id: "eval_frozen_stats",
    label: "Inference Mode (Dùng Running Stats)",
    state: { mode: "inference", runningMean: 5.0, runningVar: 5.0, gamma: 1.0, beta: 0.0 }
  }
];
