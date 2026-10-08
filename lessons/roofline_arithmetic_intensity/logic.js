/**
 * Roofline — Chậm Vì Tính Toán Hay Vì Chờ Dữ Liệu?
 * Path: lessons/roofline_arithmetic_intensity/logic.js
 *
 * GPU đồ chơi: đỉnh tính toán P = 200 TFLOP/s (FP16), băng thông bộ nhớ B = 2 TB/s.
 * Điểm gấp ("ridge") = P / B = 100 FLOP/byte.
 * Cường độ số học (arithmetic intensity) AI = FLOPs / byte truyền.
 *   Hiệu năng đạt được = min(P, AI * B).
 *
 * Phép tính (FP16 = 2 byte/phần tử):
 *   - Elementwise (ReLU, cộng residual) trên n phần tử: FLOPs = n, byte = 3 * 2n  -> AI = 1/6
 *   - GEMM: b hàng kích hoạt nhân ma trận trọng số n x n: FLOPs = 2 b n^2,
 *     byte = 2 (n^2 + 2 b n)  ->  AI = b / (1 + 2b/n)   (b = 1 là giải mã từng token)
 * Mô hình 7B tham số (14 GB trọng số FP16): thời gian 1 bước giải mã cho b chuỗi
 *   = max(2 * 7e9 * b / P, 14e9 / B).
 */

export const PEAK_TFLOPS = 200;
export const BANDWIDTH_TBS = 2;
export const RIDGE = PEAK_TFLOPS / BANDWIDTH_TBS; // 100 FLOP/byte
export const N_DIM = 4096;
export const MODEL_PARAMS = 7e9;
export const MODEL_BYTES = 14e9;

const round = (v, n = 4) => Number(v.toFixed(n)) + 0;

export function intensityElementwise() {
  return 1 / 6;
}

export function intensityGemm(b, n = N_DIM) {
  const flops = 2 * b * n * n;
  const bytes = 2 * (n * n + 2 * b * n);
  return flops / bytes;
}

export function attainableTflops(ai) {
  return Math.min(PEAK_TFLOPS, ai * BANDWIDTH_TBS);
}

export function decodeStep(b) {
  const flops = 2 * MODEL_PARAMS * b;
  const tCompute = flops / (PEAK_TFLOPS * 1e12);
  const tMemory = MODEL_BYTES / (BANDWIDTH_TBS * 1e12);
  const time = Math.max(tCompute, tMemory);
  return { tCompute, tMemory, time, tokensPerSec: b / time, bound: tCompute > tMemory ? 'compute' : 'memory' };
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { op: 'gemm', logB: 0 };
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
    const { op, logB } = this.state;
    const b = Math.pow(2, logB);
    const ai = op === 'elementwise' ? intensityElementwise() : intensityGemm(b);
    const attain = attainableTflops(ai);
    const efficiency = attain / PEAK_TFLOPS;
    const memoryBound = ai < RIDGE;
    const dec = decodeStep(b);

    let verdict;
    if (op === 'elementwise') {
      verdict = {
        type: 'danger',
        text: `❌ Bị nghẽn băng thông: AI = ${round(ai, 3)} FLOP/byte, GPU chỉ dùng ${round(efficiency * 100, 2)}% sức tính toán. Loại phép tính này chỉ nhanh hơn nếu đọc/ghi ít byte hơn (ví dụ gộp kernel).`
      };
    } else if (memoryBound) {
      verdict = {
        type: 'danger',
        text: `❌ Bị nghẽn băng thông: batch ${b} cho AI = ${round(ai, 2)} < ${RIDGE}, GPU chỉ dùng ${round(efficiency * 100, 1)}% sức tính toán. Mỗi byte trọng số đọc ra chỉ được dùng cho ${b} phép nhân-cộng.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ Bị giới hạn bởi tính toán: AI = ${round(ai, 1)} ≥ ${RIDGE}, GPU chạy 100% đỉnh ${PEAK_TFLOPS} TFLOP/s. Tăng thêm batch không làm nhanh hơn nữa.`
      };
    }

    return {
      op,
      b,
      ai: round(ai, 4),
      attain: round(attain, 3),
      efficiency: round(efficiency, 4),
      memoryBound,
      ridge: RIDGE,
      peak: PEAK_TFLOPS,
      bandwidth: BANDWIDTH_TBS,
      decode: {
        timeMs: round(dec.time * 1e3, 3),
        memoryMs: round(dec.tMemory * 1e3, 3),
        computeMs: round(dec.tCompute * 1e3, 3),
        tokensPerSec: round(dec.tokensPerSec, 1),
        bound: dec.bound
      },
      verdict,
      formulaKaTeX: op === 'elementwise'
        ? `\\text{AI} = \\frac{n}{3 \\cdot 2n} = \\frac{1}{6} \\approx 0.167,\\quad \\min(P,\\ \\text{AI} \\cdot B) = ${round(attain, 3)}\\ \\text{TFLOP/s}`
        : `\\text{AI} = \\frac{2bn^2}{2(n^2 + 2bn)} = \\frac{b}{1 + 2b/n} = ${round(ai, 2)},\\quad \\min(P,\\ \\text{AI} \\cdot B) = ${round(attain, 2)}\\ \\text{TFLOP/s}`
    };
  }
}

export const PRESETS = [
  { id: 'elementwise', label: 'Elementwise (ReLU, residual) ❌', state: { op: 'elementwise', logB: 0 } },
  { id: 'decode_b1', label: 'Giải mã từng token (batch 1) ❌', state: { op: 'gemm', logB: 0 } },
  { id: 'decode_b64', label: 'Gom batch 64', state: { op: 'gemm', logB: 6 } },
  { id: 'decode_b128', label: 'Batch 128: vượt điểm gấp ✅', state: { op: 'gemm', logB: 7 } },
  { id: 'training_gemm', label: 'Huấn luyện (batch 4096) ✅', state: { op: 'gemm', logB: 12 } }
];
