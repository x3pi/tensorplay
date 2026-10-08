/**
 * Bài 28: Activation Checkpointing — Đổi 33% Thời Gian Lấy 50% RAM GPU
 * Path: examples/hw3_cuda_architecture/activation_checkpointing.logic.js
 *
 * Aha: Khi huấn luyện mạng sâu, activation của forward pass chiếm phần lớn bộ nhớ GPU (O(L)).
 * Bằng cách chỉ lưu các điểm neo (checkpoints) cách nhau k tầng và tính lại (recompute)
 * forward khi backward đến từng đoạn, bộ nhớ đỉnh giảm từ O(L) xuống O(sqrt(L))
 * với chi phí chỉ thêm đúng 1 lượt forward (+33% thời gian).
 */

const round = (v, n = 4) => (typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(n)) + 0 : v);

export function peakMemory(L, k, useCheckpoint = true) {
  if (!useCheckpoint) return L;
  const numCheckpoints = Math.ceil(L / k);
  return numCheckpoints + k;
}

export function optimalK(L) {
  return Math.round(Math.sqrt(L));
}

export function computeOverhead(useCheckpoint = true) {
  if (!useCheckpoint) {
    return { fwd: 1, recompute: 0, bwd: 2, total: 3, ratio: 1.0, overheadPct: 0 };
  }
  return { fwd: 1, recompute: 1, bwd: 2, total: 4, ratio: 4 / 3, overheadPct: 33.33 };
}

export const PRESETS = [
  {
    id: 'optimal',
    label: 'Tối Ưu k=4 ✅ (Chuẩn √L)',
    desc: 'Neo mỗi k=4 tầng: RAM đỉnh chỉ 8 GB <= ngân sách 10 GB. Tiết kiệm 50% RAM!',
    state: { L: 16, k: 4, budget: 10, useCheckpoint: true }
  },
  {
    id: 'no_checkpoint',
    label: 'Không Checkpoint ❌ (OOM Tràn RAM)',
    desc: 'Lưu toàn bộ 16 tầng activation: 16 GB > ngân sách 10 GB -> GPU lập tức Out-Of-Memory!',
    state: { L: 16, k: 4, budget: 10, useCheckpoint: false }
  },
  {
    id: 'too_dense',
    label: 'Checkpoint Quá Dày (k=1) ⚠️',
    desc: 'Lưu điểm neo ở mọi tầng: 16 neo + 1 recompute = 17 GB. Lãng phí RAM nghiêm trọng.',
    state: { L: 16, k: 1, budget: 10, useCheckpoint: true }
  },
  {
    id: 'too_sparse',
    label: 'Checkpoint Quá Thưa (k=8) ⚠️',
    desc: 'Chỉ 2 điểm neo nhưng mỗi đoạn recompute chứa tới 8 activation: đỉnh RAM lên 10 GB.',
    state: { L: 16, k: 8, budget: 10, useCheckpoint: true }
  }
];

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      L: 16,               // Tổng số tầng mạng
      k: 4,                // Kích thước đoạn checkpoint (neo mỗi k tầng)
      budget: 10,          // Ngân sách RAM GPU (GB)
      useCheckpoint: true  // Bật/tắt Activation Checkpointing
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
    const { L, k, budget, useCheckpoint } = this.state;

    const numCheckpoints = useCheckpoint ? Math.ceil(L / k) : L;
    const recomputeBuffer = useCheckpoint ? k : 0;
    const peakMem = peakMemory(L, k, useCheckpoint);
    const kOpt = optimalK(L);
    const minPeak = peakMemory(L, kOpt, true);
    const isOOM = peakMem > budget;

    const overhead = computeOverhead(useCheckpoint);
    const savedMem = useCheckpoint ? L - peakMem : 0;
    const savedPercent = useCheckpoint ? Math.max(0, ((L - peakMem) / L) * 100) : 0;

    let verdict;
    if (!useCheckpoint) {
      if (isOOM) {
        verdict = {
          type: 'danger',
          text: `🚨 OUT OF MEMORY (OOM): Lưu toàn bộ ${L} activation ngốn ${peakMem} GB RAM, vượt quá ngân sách ${budget} GB của GPU!`
        };
      } else {
        verdict = {
          type: 'warning',
          text: `⚠️ KHÔNG CHECKPOINT: Đang dùng ${peakMem} GB RAM. Khi mô hình mở rộng số tầng, GPU sẽ cạn kiệt bộ nhớ ngay lập tức.`
        };
      }
    } else {
      if (isOOM) {
        verdict = {
          type: 'danger',
          text: `🚨 VẪN TRÀN RAM: Với k=${k}, đỉnh bộ nhớ ${peakMem} GB vẫn vượt ngân sách ${budget} GB! Hãy chọn k gần k* = ${kOpt} hơn.`
        };
      } else if (k === kOpt) {
        verdict = {
          type: 'success',
          text: `🎯 TỐI ƯU HOÀN HẢO (k = √${L} = ${kOpt}): Đỉnh bộ nhớ nhỏ nhất đạt ${peakMem} GB (tiết kiệm ${savedPercent.toFixed(0)}% RAM), nằm gọn an toàn trong ${budget} GB GPU!`
        };
      } else {
        verdict = {
          type: 'success',
          text: `✅ CHẠY ĐƯỢC: Đỉnh bộ nhớ ${peakMem} GB <= ${budget} GB (tiết kiệm ${savedPercent.toFixed(0)}% RAM). Bạn có thể tối ưu thêm bằng cách chọn k=${kOpt}.`
        };
      }
    }

    const formulaKaTeX = useCheckpoint
      ? `\\text{RAM Đỉnh} = \\frac{L}{k} + k = \\frac{${L}}{${k}} + ${k} = ${numCheckpoints} + ${k} = ${peakMem} \\text{ GB}`
      : `\\text{RAM Đỉnh} = L = ${L} \\text{ GB (Lưu toàn bộ forward)}`;

    // Tạo danh sách mô phỏng trực quan các tầng
    const layers = [];
    for (let i = 0; i < L; i++) {
      const isCheckpoint = useCheckpoint && i % k === 0;
      layers.push({
        layerIdx: i,
        isCheckpoint,
        role: isCheckpoint ? 'checkpoint' : useCheckpoint ? 'recompute' : 'stored'
      });
    }

    return {
      state: { ...this.state },
      peakMem,
      kOpt,
      minPeak,
      isOOM,
      numCheckpoints,
      recomputeBuffer,
      savedMem,
      savedPercent,
      overhead,
      layers,
      verdict,
      formulaKaTeX
    };
  }
}
