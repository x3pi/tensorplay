/**
 * CUDA Grid, Blocks & Threads (Needle HW3)
 * Mô phỏng phân cấp thực thi CUDA: Grid -> Blocks -> Threads.
 * Công thức chỉ số toàn cục: idx = blockIdx.x * blockDim.x + threadIdx.x
 * Kiểm chứng Boundary Guard if (idx < N) bảo vệ bộ nhớ GPU.
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      N: 10,           // Kích thước vector dữ liệu
      blockDim: 4,     // Số luồng mỗi block (blockDim.x)
      hasBoundaryGuard: true
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
    const { N, blockDim, hasBoundaryGuard } = this.state;

    // Tính số block cần thiết: gridDim.x = ceil(N / blockDim)
    const gridDim = Math.ceil(N / blockDim);
    const totalThreadsLaunched = gridDim * blockDim;

    // Sinh danh sách các thread
    const threads = [];
    let oobCount = 0;

    for (let b = 0; b < gridDim; b++) {
      for (let t = 0; t < blockDim; t++) {
        const globalIdx = b * blockDim + t;
        const isValid = globalIdx < N;
        const isHazard = !isValid && !hasBoundaryGuard;

        if (isHazard) {
          oobCount++;
        }

        threads.push({
          blockIdx: b,
          threadIdx: t,
          globalIdx,
          isValid,
          isHazard,
          status: isValid
            ? "active"
            : (hasBoundaryGuard ? "guarded_idle" : "out_of_bounds_crash")
        });
      }
    }

    const hasCrash = oobCount > 0;

    return {
      N,
      blockDim,
      gridDim,
      totalThreadsLaunched,
      hasBoundaryGuard,
      threads,
      oobCount,
      hasCrash,
      formulaGridKaTeX: `\\text{gridDim.x} = \\left\\lceil \\frac{N}{\\text{blockDim.x}} \\right\\rceil = \\left\\lceil \\frac{${N}}{${blockDim}} \\right\\rceil = ${gridDim}`,
      formulaIdxKaTeX: `\\text{idx} = \\text{blockIdx.x} \\times ${blockDim} + \\text{threadIdx.x}`
    };
  }
}

export const PRESETS = [
  {
    id: "perfect_fit",
    label: "Vừa vặn hoàn hảo (N = 12, Block = 4)",
    state: { N: 12, blockDim: 4, hasBoundaryGuard: true }
  },
  {
    id: "guarded_excess",
    label: "Dư luồng có Guard (N = 10, Block = 4)",
    state: { N: 10, blockDim: 4, hasBoundaryGuard: true }
  },
  {
    id: "oob_crash_hazard",
    label: "Thảm họa OOB không Guard (N = 10, Block = 4)",
    state: { N: 10, blockDim: 4, hasBoundaryGuard: false }
  }
];
