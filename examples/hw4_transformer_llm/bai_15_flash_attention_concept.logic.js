/**
 * Bài 15: FlashAttention SRAM Tiling & Online Softmax (Needle HW4)
 * Trực quan hóa đột phá FlashAttention:
 * 1. Cắt nhỏ Q, K, V thành các khối nạp vào SRAM của GPU.
 * 2. Thuật toán Online Softmax cập nhật động running max (m) và running sum (l).
 * 3. Triệt tiêu hoàn toàn việc ghi ma trận N x N ra bộ nhớ HBM chậm chạp.
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      seqLen: 8,      // N
      headDim: 64,    // d
      blockSize: 4,   // B_c, B_r
      currentBlockStep: 1 // 1 hoặc 2
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
    const { seqLen, headDim, blockSize, currentBlockStep } = this.state;
    const N = seqLen;
    const d = headDim;

    // 1. Phân tích lưu lượng bộ nhớ HBM (Bytes, FP16 = 2 bytes)
    // Standard Attention:
    // Ghi S (N x N) + Đọc S + Ghi P (N x N) + Đọc P = 4 * N^2 * 2 bytes
    const standardHbmBytes = 4 * Math.pow(N, 2) * 2;

    // FlashAttention:
    // Chỉ đọc Q, K, V (3 * N * d) và ghi O (N * d)
    // Tổng HBM = 4 * N * d * 2 bytes (Hoàn toàn O(N), không phụ thuộc N^2!)
    const flashHbmBytes = 4 * N * d * 2;

    const ioReductionRatio = Number((standardHbmBytes / flashHbmBytes).toFixed(1));

    // 2. Minh họa thuật toán Online Softmax với 2 khối mẫu
    // Khối 1: x_block1 = [2.0, 4.0]
    const x1 = [2.0, 4.0];
    const m1 = Math.max(...x1); // 4.0
    const l1 = x1.reduce((acc, v) => acc + Math.exp(v - m1), 0); // e^-2 + e^0 = 0.135 + 1.0 = 1.135

    // Khối 2: x_block2 = [3.0, 5.0]
    const x2 = [3.0, 5.0];
    const m2_local = Math.max(...x2); // 5.0
    const m_new = Math.max(m1, m2_local); // max(4, 5) = 5.0
    const alpha = Math.exp(m1 - m_new); // e^(4 - 5) = e^-1 = 0.368
    const l2_local = x2.reduce((acc, v) => acc + Math.exp(v - m_new), 0); // e^-2 + e^0 = 1.135
    const l_new = alpha * l1 + l2_local; // 0.368 * 1.135 + 1.135 = 1.553

    return {
      seqLen: N,
      headDim: d,
      blockSize,
      currentBlockStep,
      standardHbmBytes,
      flashHbmBytes,
      ioReductionRatio,
      onlineSoftmax: {
        m1: Number(m1.toFixed(2)),
        l1: Number(l1.toFixed(3)),
        m_new: Number(m_new.toFixed(2)),
        alpha: Number(alpha.toFixed(3)),
        l_new: Number(l_new.toFixed(3))
      },
      formulaHbmKaTeX: `\\text{Chuẩn (HBM)}: O(N^2) = ${standardHbmBytes} \\text{B} \\implies \\text{Flash}: O(N) = ${flashHbmBytes} \\text{B}`,
      formulaOnlineSoftmaxKaTeX: `m_{\\text{new}} = \\max(m^{(1)}, m^{(2)}) = ${m_new.toFixed(1)}, \\quad \\ell_{\\text{new}} = e^{m^{(1)} - m_{\\text{new}}} \\ell^{(1)} + \\dots = ${l_new.toFixed(3)}`
    };
  }
}

export const PRESETS = [
  {
    id: "seq_8_demo",
    label: "Ngữ Cảnh Ngắn N = 8",
    state: { seqLen: 8 }
  },
  {
    id: "seq_32_speedup",
    label: "Ngữ Cảnh N = 32 (Tiết kiệm I/O)",
    state: { seqLen: 32 }
  },
  {
    id: "seq_128_flash",
    label: "Ngữ Cảnh Dài N = 128 (FlashAttention thống trị)",
    state: { seqLen: 128 }
  }
];
