/**
 * Memory Coalescing & Bank Conflicts (Needle HW3)
 * Mô phỏng hiện tượng gom giao dịch bộ nhớ (Coalesced Access) trong Warp 32 luồng
 * và xung đột ngân hàng bộ nhớ chia sẻ (Shared Memory Bank Conflicts).
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      warpSize: 32,
      stride: 1,      // 1, 2, 4, 8, 16, 32
      bytesPerWord: 4 // float = 4 bytes
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
    const { warpSize, stride, bytesPerWord } = this.state;
    const cacheLineBytes = 128; // Chuẩn 128 bytes cache line của GPU NVIDIA
    const wordsPerCacheLine = cacheLineBytes / bytesPerWord; // 32 floats

    // Tính toán số dòng cache / giao dịch DRAM cần phát ra
    // Stride 1: 32 threads đọc 32 floats liền kề = 128 bytes -> 1 giao dịch
    // Stride s: các luồng phân tán ra s * 32 words -> tối đa 32 giao dịch
    const numTransactions = Math.min(warpSize, stride);

    // Hiệu suất tận dụng băng thông (Bus Efficiency %)
    // Dữ liệu hữu ích luôn là 32 floats = 128 bytes
    // Dữ liệu bus phải nạp = numTransactions * 128 bytes
    const usefulBytes = warpSize * bytesPerWord;
    const transferredBytes = numTransactions * cacheLineBytes;
    const busEfficiencyPercent = Number(((usefulBytes / transferredBytes) * 100).toFixed(1));

    // Shared Memory 32 Banks conflict
    // bank_id = (threadIdx * stride) % 32
    const bankHits = new Array(32).fill(0);
    for (let t = 0; t < warpSize; t++) {
      const bank = (t * stride) % 32;
      bankHits[bank]++;
    }
    const maxBankConflictWay = Math.max(...bankHits); // 1 = không xung đột, 2 = 2-way, 32 = 32-way conflict

    return {
      warpSize,
      stride,
      numTransactions,
      usefulBytes,
      transferredBytes,
      busEfficiencyPercent,
      maxBankConflictWay,
      isFullyCoalesced: stride === 1,
      formulaDramKaTeX: `\\text{Giao dịch DRAM} = ${numTransactions} \\quad \\implies \\quad \\text{Hiệu suất Bus} = ${busEfficiencyPercent}\\%`,
      formulaBankKaTeX: `\\text{Xung đột Bank} = ${maxBankConflictWay}\\text{-way} \\quad (\\text{Trễ gấp } ${maxBankConflictWay}\\text{ lần})`
    };
  }
}

export const PRESETS = [
  {
    id: "perfect_coalesced",
    label: "Gom Liền Kề Tối Ưu (Stride = 1, 100% Bus)",
    state: { stride: 1 }
  },
  {
    id: "strided_step_2",
    label: "Bước Nhảy s = 2 (50% Bus, 2-way conflict)",
    state: { stride: 2 }
  },
  {
    id: "worst_col_stride",
    label: "Quét Theo Cột s = 32 (3.1% Bus, Tệ Nhất)",
    state: { stride: 32 }
  }
];
