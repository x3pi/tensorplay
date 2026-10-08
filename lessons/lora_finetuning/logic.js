/**
 * LoRA — Tinh Chỉnh Mô Hình Lớn Bằng Hai Ma Trận Hạng Thấp
 * Path: lessons/lora_finetuning/logic.js
 *
 * Đóng băng W (d x d). Chỉ học ΔW = (α / r) B A, với B (d x r), A (r x d), r << d.
 *   Số tham số học: 2 d r thay vì d^2.   Khởi tạo B = 0 nên ΔW = 0 lúc đầu: mô hình chưa đổi.
 * Toy: d = 4, r = 1, B = [1, 0, 2, 0]^T, A = [0, 1, 0, 1], α = r  =>  ΔW là ma trận hạng 1.
 * Thật: mô hình d = 4096, 32 tầng, thêm LoRA vào W_q và W_v (2 ma trận mỗi tầng = 64 ma trận);
 *   tổng tham số 6 573 522 944 (bài transformer_block_params); huấn luyện FP32 + Adam = 16 byte/tham số học.
 */

export const TOY_W = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
export const TOY_B = [1, 0, 2, 0];
export const TOY_A = [0, 1, 0, 1];
export const D = 4096;
export const ADAPTED_MATRICES = 64;
export const TOTAL_PARAMS = 6573522944;
export const BASE_FP16_GB = (TOTAL_PARAMS * 2) / 1e9;
export const FULL_FT_GB = (TOTAL_PARAMS * 16) / 1e9;

const round = (v, n = 4) => Number(v.toFixed(n)) + 0;

export function outer(b, a) {
  return b.map(bi => a.map(aj => bi * aj));
}

export function loraParams(d, r) {
  return 2 * d * r;
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { r: 8, alpha: 16, trained: true };
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
    const { r, alpha, trained } = this.state;
    // --- Toy 4x4 (r = 1) ---
    const delta = trained ? outer(TOY_B, TOY_A) : outer([0, 0, 0, 0], TOY_A);
    const wMerged = TOY_W.map((row, i) => row.map((v, j) => v + delta[i][j]));
    const x = [1, 2, 3, 4];
    const yBase = TOY_W.map(row => row.reduce((s, v, j) => s + v * x[j], 0));
    const yMerged = wMerged.map(row => row.reduce((s, v, j) => s + v * x[j], 0));
    // y = W x + B (A x): đường song song không cần hợp nhất
    const ax = TOY_A.reduce((s, v, j) => s + v * x[j], 0);
    const yLora = yBase.map((v, i) => v + (trained ? TOY_B[i] : 0) * ax);

    // --- Mô hình thật ---
    const perMatrix = loraParams(D, r);
    const trainable = perMatrix * ADAPTED_MATRICES;
    const pct = (trainable / TOTAL_PARAMS) * 100;
    const trainableMB = (trainable * 16) / 1e6;
    const totalGB = BASE_FP16_GB + trainableMB / 1000;
    const saving = FULL_FT_GB / totalGB;
    const scale = alpha / r;

    let verdict;
    if (!trained) {
      verdict = {
        type: 'success',
        text: `✅ Lúc khởi tạo B = 0 nên ΔW = 0: đầu ra y = W x = [${yBase.join(', ')}] giống hệt mô hình gốc. Tinh chỉnh bắt đầu từ đúng chỗ mô hình cũ đứng.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ r = ${r}: chỉ học ${trainable.toLocaleString('en-US')} tham số (${round(pct, 4)}% mô hình), RAM huấn luyện ≈ ${round(totalGB, 2)} GB thay vì ${round(FULL_FT_GB, 1)} GB (giảm ${round(saving, 1)} lần).`
      };
    }

    return {
      r, alpha, trained, scale: round(scale, 3),
      toy: { W: TOY_W, B: TOY_B, A: TOY_A, delta, wMerged, x, yBase, yMerged, yLora, rank: trained ? 1 : 0 },
      perMatrix,
      fullPerMatrix: D * D,
      matrixRatio: round(perMatrix / (D * D) * 100, 4),
      adapted: ADAPTED_MATRICES,
      trainable,
      pct: round(pct, 5),
      trainableMB: round(trainableMB, 3),
      baseGB: round(BASE_FP16_GB, 3),
      totalGB: round(totalGB, 3),
      fullFtGB: round(FULL_FT_GB, 3),
      saving: round(saving, 2),
      mergeIdentical: yMerged.every((v, i) => v === yLora[i]),
      verdict,
      formulaKaTeX: `W' = W + \\frac{\\alpha}{r} B A,\\quad \\text{học } 2dr = 2 \\times ${D} \\times ${r} = ${perMatrix.toLocaleString('en-US')} \\ll d^2 = ${(D * D).toLocaleString('en-US')}`
    };
  }
}

export const PRESETS = [
  { id: 'init_zero', label: 'Mới khởi tạo (B = 0)', state: { r: 8, alpha: 16, trained: false } },
  { id: 'trained_r8', label: 'Đã học, r = 8 ✅', state: { r: 8, alpha: 16, trained: true } },
  { id: 'rank1', label: 'r = 1 (nhỏ nhất)', state: { r: 1, alpha: 2, trained: true } },
  { id: 'rank64', label: 'r = 64 (nhiều dung lượng hơn)', state: { r: 64, alpha: 128, trained: true } }
];
