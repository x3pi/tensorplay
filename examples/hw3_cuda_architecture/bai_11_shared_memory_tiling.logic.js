/**
 * Bài 23: Tiled MatMul & Shared Memory (Needle HW3)
 * Mô phỏng kỹ thuật Tiling chia nhỏ ma trận vào bộ nhớ chia sẻ (__shared__ SRAM).
 * Ma trận 4x4, Tile 2x2, số pha k = 2.
 * So sánh số lượt truy cập DRAM chậm chạp vs SRAM siêu tốc.
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      matrixDim: 4,  // N = 4
      tileSize: 2,   // T = 2
      currentPhase: 0, // 0 hoặc 1
      isSynced: true
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
    const { matrixDim, tileSize, currentPhase, isSynced } = this.state;
    const N = matrixDim;
    const T = tileSize;

    // Số pha lặp K = N / T
    const numPhases = Math.ceil(N / T);

    // Tính toán số lượt truy cập bộ nhớ lý thuyết
    // Naive: Mỗi phần tử trong C (N^2) cần đọc N phần tử của A và N phần tử của B từ DRAM
    // Tổng Naive DRAM Reads = 2 * N^3
    const naiveDramReads = 2 * Math.pow(N, 3);

    // Tiled: Mỗi block T x T chỉ nạp (2 * T^2) phần tử từ DRAM vào Shared Memory ở mỗi pha k
    // Tổng số block = (N/T)^2. Mỗi block lặp K = N/T pha.
    // Tổng Tiled DRAM Reads = (N/T)^2 * (N/T) * 2 * T^2 = 2 * N^3 / T
    const tiledDramReads = Math.round((2 * Math.pow(N, 3)) / T);
    const tiledSramReads = 2 * Math.pow(N, 3); // Đọc nội bộ SRAM siêu tốc

    // Tiết kiệm băng thông DRAM
    const bandwidthReductionFactor = T;

    // Ma trận mẫu A và B (4x4)
    const matA = [
      [1, 2, 0, 1],
      [0, 1, 2, 1],
      [1, 0, 1, 2],
      [2, 1, 0, 1]
    ];

    const matB = [
      [1, 0, 1, 2],
      [0, 1, 2, 0],
      [2, 1, 0, 1],
      [1, 2, 1, 0]
    ];

    // Trích xuất Tile của Block (0, 0) ở pha hiện tại
    // A_tile: hàng [0..1], cột [currentPhase*T .. currentPhase*T+1]
    const tileA = [
      [matA[0][currentPhase * T], matA[0][currentPhase * T + 1]],
      [matA[1][currentPhase * T], matA[1][currentPhase * T + 1]]
    ];

    // B_tile: hàng [currentPhase*T .. currentPhase*T+1], cột [0..1]
    const tileB = [
      [matB[currentPhase * T][0], matB[currentPhase * T][1]],
      [matB[currentPhase * T + 1][0], matB[currentPhase * T + 1][1]]
    ];

    return {
      matrixDim: N,
      tileSize: T,
      numPhases,
      currentPhase,
      isSynced,
      naiveDramReads,
      tiledDramReads,
      tiledSramReads,
      bandwidthReductionFactor,
      tileA,
      tileB,
      formulaDramKaTeX: `\\text{Naive DRAM} = 2 N^3 = 2 \\times ${N}^3 = ${naiveDramReads} \\implies \\text{Tiled DRAM} = \\frac{2 N^3}{T} = \\frac{${naiveDramReads}}{${T}} = ${tiledDramReads}`,
      formulaSyncKaTeX: `\\text{Giai đoạn: } k = ${currentPhase + 1}/${numPhases} \\quad \\longrightarrow \\quad \\text{\\texttt{__syncthreads()}}`
    };
  }
}

export const PRESETS = [
  {
    id: "tile_4x4_t2",
    label: "Demo Nhỏ (N=4, Tile=2)",
    state: { matrixDim: 4, tileSize: 2, currentPhase: 0 }
  },
  {
    id: "tile_16x16_t4",
    label: "Mạng Vừa (N=16, Tile=4, Tiết kiệm 4x)",
    state: { matrixDim: 16, tileSize: 4, currentPhase: 0 }
  },
  {
    id: "tile_cuda_standard",
    label: "Chuẩn CUDA (N=1024, Tile=32, Tiết kiệm 32x)",
    state: { matrixDim: 1024, tileSize: 32, currentPhase: 0 }
  }
];
