/**
 * ZeRO / FSDP — Chia Nhỏ Trạng Thái Huấn Luyện Cho Nhiều GPU
 * Path: lessons/zero_fsdp/logic.js
 *
 * Mỗi tham số khi huấn luyện Adam mixed precision cần 16 byte (bài mixed_precision):
 *   trọng số FP16 (2) + gradient FP16 (2) + bản master FP32 (4) + m (4) + v (4)  ->  2 + 2 + 12.
 * Data parallel thường (DP) NHÂN BẢN cả 16 byte lên mọi GPU. ZeRO chia nhỏ theo N GPU:
 *   ZeRO-1: chia optimizer (12)         -> 2 + 2 + 12/N
 *   ZeRO-2: chia thêm gradient (2)      -> 2 + (2 + 12)/N
 *   ZeRO-3 (= FSDP): chia thêm trọng số -> 16/N
 * Truyền thông mỗi GPU mỗi bước (gradient FP16 = 2 Psi byte):
 *   DP / ZeRO-1 / ZeRO-2 : 2 (N-1)/N * 2 Psi   (all-reduce = reduce-scatter + all-gather)
 *   ZeRO-3               : 3 (N-1)/N * 2 Psi   (thêm all-gather trọng số cho lượt thuận VÀ lượt ngược)
 * Bỏ qua activation (xem bài activation_checkpointing).
 */

export const STAGES = ['dp', 'zero1', 'zero2', 'zero3'];
export const STAGE_NAMES = { dp: 'Data parallel (nhân bản)', zero1: 'ZeRO-1', zero2: 'ZeRO-2', zero3: 'ZeRO-3 / FSDP' };

const round = (v, n = 4) => Number(v.toFixed(n)) + 0;

export function bytesPerParam(stage, N) {
  switch (stage) {
    case 'dp': return 16;
    case 'zero1': return 2 + 2 + 12 / N;
    case 'zero2': return 2 + (2 + 12) / N;
    case 'zero3': return 16 / N;
    default: throw new Error('stage?');
  }
}

export function trafficGB(stage, N, paramsB) {
  const gradGB = 2 * paramsB; // gradient FP16: 2 byte/tham số, paramsB tính bằng tỉ
  const factor = stage === 'zero3' ? 3 : 2;
  return (factor * (N - 1) / N) * gradGB;
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { stage: 'dp', logN: 3, paramsB: 7, gpuGB: 80 };
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
    const { stage, logN, paramsB, gpuGB } = this.state;
    const N = Math.pow(2, logN);
    const bpp = bytesPerParam(stage, N);
    const perGpuGB = bpp * paramsB;
    const dpGB = 16 * paramsB;
    const fits = perGpuGB <= gpuGB;
    const traffic = trafficGB(stage, N, paramsB);
    const dpTraffic = trafficGB('dp', N, paramsB);

    const table = STAGES.map(s => ({
      stage: s,
      name: STAGE_NAMES[s],
      bytesPerParam: round(bytesPerParam(s, N), 4),
      gb: round(bytesPerParam(s, N) * paramsB, 3),
      fits: bytesPerParam(s, N) * paramsB <= gpuGB,
      trafficGB: round(trafficGB(s, N, paramsB), 3)
    }));

    let verdict;
    if (!fits) {
      verdict = {
        type: 'danger',
        text: `❌ ${STAGE_NAMES[stage]}: mỗi GPU cần ${round(perGpuGB, 2)} GB > ${gpuGB} GB. Mô hình ${paramsB} tỉ tham số không nạp nổi (chưa tính activation).`
      };
    } else if (stage === 'dp') {
      verdict = {
        type: 'success',
        text: `✅ Nhân bản vẫn vừa: ${round(perGpuGB, 2)} GB ≤ ${gpuGB} GB. Mô hình nhỏ thì data parallel thường là đủ và rẻ truyền thông nhất.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ ${STAGE_NAMES[stage]}: mỗi GPU chỉ ${round(perGpuGB, 2)} GB (giảm ${round(dpGB / perGpuGB, 1)} lần so với nhân bản ${round(dpGB, 1)} GB). Truyền thông ${round(traffic, 2)} GB/bước (${round(traffic / dpTraffic, 2)} lần DP).`
      };
    }

    return {
      stage, stageName: STAGE_NAMES[stage], N, paramsB, gpuGB,
      bytesPerParam: round(bpp, 4),
      perGpuGB: round(perGpuGB, 3),
      dpGB: round(dpGB, 3),
      savings: round(dpGB / perGpuGB, 2),
      fits,
      trafficGB: round(traffic, 3),
      trafficRatio: round(traffic / dpTraffic, 3),
      table,
      verdict,
      formulaKaTeX: {
        dp: `16\\ \\text{B/param}`,
        zero1: `2 + 2 + \\frac{12}{N} = 4 + \\frac{12}{${N}} = ${round(bpp, 3)}\\ \\text{B/param}`,
        zero2: `2 + \\frac{2 + 12}{N} = 2 + \\frac{14}{${N}} = ${round(bpp, 3)}\\ \\text{B/param}`,
        zero3: `\\frac{2 + 2 + 12}{N} = \\frac{16}{${N}} = ${round(bpp, 3)}\\ \\text{B/param}`
      }[stage]
    };
  }
}

export const PRESETS = [
  { id: 'dp_7b', label: '7B, 8 GPU: nhân bản ❌', state: { stage: 'dp', logN: 3, paramsB: 7 } },
  { id: 'zero1_7b', label: '7B, 8 GPU: ZeRO-1 ✅', state: { stage: 'zero1', logN: 3, paramsB: 7 } },
  { id: 'zero2_7b', label: '7B, 8 GPU: ZeRO-2', state: { stage: 'zero2', logN: 3, paramsB: 7 } },
  { id: 'zero3_7b', label: '7B, 8 GPU: ZeRO-3 / FSDP', state: { stage: 'zero3', logN: 3, paramsB: 7 } },
  { id: 'zero3_70b', label: '70B, 64 GPU: chỉ ZeRO-3 vừa ✅', state: { stage: 'zero3', logN: 6, paramsB: 70 } }
];
