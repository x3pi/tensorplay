/**
 * Data Parallel & All-Reduce — Chia Batch Cho Nhiều GPU, Cộng Gradient Bằng Vòng Tròn
 * Path: lessons/data_parallel_allreduce/logic.js
 *
 * Phần 1 (đúng/sai của phép gộp): hồi quy y = w x, mất mát (1/2)(w x - y)^2, w = 1.
 *   x = [1, 2, 3, 4], y = [2, 4, 3, 8]  =>  g_i = (w x_i - y_i) x_i = [-1, -4, 0, -16]
 *   Gradient cả batch = trung bình = -5.25.
 * Phần 2 (chi phí truyền thông): ring all-reduce cho N GPU, mỗi GPU gửi 2 (N-1)/N * S byte
 *   (S = kích thước gradient), gần như KHÔNG đổi khi N tăng; cách "ai cũng gửi hết cho mọi người"
 *   tốn (N-1) * S.
 */

export const X = [1, 2, 3, 4];
export const Y = [2, 4, 3, 8];
export const W0 = 1;
export const LR = 0.1;
export const GRAD_GB = 14; // gradient mô hình 7B ở FP16
export const LINK_GBPS = 100; // GB/s mỗi liên kết

const round = (v, n = 4) => Number(v.toFixed(n)) + 0;

export function sampleGrads(w = W0) {
  return X.map((x, i) => (w * x - Y[i]) * x);
}

export function shardsOf(mode) {
  return mode === 'equal' ? [[0, 1], [2, 3]] : [[0, 1, 2], [3]];
}

export function aggregate(shardGrads, shardSizes, how) {
  const means = shardGrads.map(g => g.reduce((a, b) => a + b, 0) / g.length);
  if (how === 'sum') return means.reduce((a, b) => a + b, 0);
  if (how === 'avg_of_means') return means.reduce((a, b) => a + b, 0) / means.length;
  const total = shardSizes.reduce((a, b) => a + b, 0);
  return means.reduce((acc, m, i) => acc + m * shardSizes[i], 0) / total; // trung bình có trọng số theo cỡ shard
}

/** Mô phỏng ring all-reduce (cộng). Mỗi GPU có vector độ dài N (N chunk). */
export function ringAllReduce(vectors) {
  const N = vectors.length;
  const data = vectors.map(v => [...v]);
  let sent = new Array(N).fill(0);
  // Reduce-scatter
  for (let s = 0; s < N - 1; s++) {
    const out = data.map((d, i) => ({ chunk: ((i - s) % N + N) % N, val: d[((i - s) % N + N) % N] }));
    for (let i = 0; i < N; i++) {
      const dst = (i + 1) % N;
      data[dst][out[i].chunk] += out[i].val;
      sent[i] += 1;
    }
  }
  // All-gather
  for (let s = 0; s < N - 1; s++) {
    const out = data.map((d, i) => ({ chunk: (((i + 1 - s) % N) + N) % N, val: d[(((i + 1 - s) % N) + N) % N] }));
    for (let i = 0; i < N; i++) {
      const dst = (i + 1) % N;
      data[dst][out[i].chunk] = out[i].val;
      sent[i] += 1;
    }
  }
  return { result: data, sentChunksPerGpu: sent, steps: 2 * (N - 1) };
}

export function ringTrafficGB(N, S = GRAD_GB) {
  return (2 * (N - 1) / N) * S;
}

export function naiveTrafficGB(N, S = GRAD_GB) {
  return (N - 1) * S;
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { shards: 'equal', how: 'weighted', logN: 2 };
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
    const { shards, how, logN } = this.state;
    const g = sampleGrads();
    const full = g.reduce((a, b) => a + b, 0) / g.length;
    const idx = shardsOf(shards);
    const shardGrads = idx.map(ix => ix.map(i => g[i]));
    const shardSizes = idx.map(ix => ix.length);
    const shardMeans = shardGrads.map(s => s.reduce((a, b) => a + b, 0) / s.length);
    const agg = aggregate(shardGrads, shardSizes, how);
    const correct = Math.abs(agg - full) < 1e-9;
    const wFull = W0 - LR * full;
    const wAgg = W0 - LR * agg;

    const N = Math.pow(2, logN);
    const ring = ringTrafficGB(N);
    const naive = naiveTrafficGB(N);
    const ringSeconds = ring / LINK_GBPS;
    const naiveSeconds = naive / LINK_GBPS;

    // mô phỏng ring với vector minh họa: GPU i giữ [1,2,3,4,...] * (i + 1) rút gọn cho N chunk
    const demoVectors = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, c) => (c + 1) * (i + 1)));
    const sim = ringAllReduce(demoVectors);
    const expectedSum = Array.from({ length: N }, (_, c) => (c + 1) * (N * (N + 1) / 2));
    const ringCorrect = sim.result.every(row => row.every((v, c) => Math.abs(v - expectedSum[c]) < 1e-9));

    let verdict;
    if (!correct && how === 'sum') {
      verdict = {
        type: 'danger',
        text: `❌ Quên chia cho số GPU: gradient gộp = ${round(agg, 3)} gấp ${round(agg / full, 2)} lần gradient thật ${round(full, 3)}, tức bước học thực tế gấp ${round(agg / full, 2)} lần. w mới = ${round(wAgg, 3)} thay vì ${round(wFull, 3)}.`
      };
    } else if (!correct) {
      verdict = {
        type: 'danger',
        text: `❌ Trung bình các trung bình sai khi shard không đều: ${round(agg, 3)} khác gradient cả batch ${round(full, 3)}. Shard nhỏ (1 mẫu) bị nhân trọng số quá lớn.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ Gradient gộp ${round(agg, 3)} đúng bằng gradient cả batch ${round(full, 3)}. Với ${N} GPU, ring all-reduce mỗi GPU gửi ${round(ring, 2)} GB (cách ngây thơ: ${round(naive, 2)} GB).`
      };
    }

    return {
      shards,
      how,
      N,
      g: g.map(v => round(v, 3)),
      full: round(full, 4),
      shardMeans: shardMeans.map(v => round(v, 4)),
      shardSizes,
      agg: round(agg, 4),
      correct,
      wFull: round(wFull, 4),
      wAgg: round(wAgg, 4),
      ringGB: round(ring, 3),
      naiveGB: round(naive, 3),
      ringSeconds: round(ringSeconds, 4),
      naiveSeconds: round(naiveSeconds, 4),
      steps: sim.steps,
      sentChunksPerGpu: sim.sentChunksPerGpu[0],
      ringCorrect,
      verdict,
      formulaKaTeX: `\\bar{g} = \\frac{\\sum_k n_k\\, \\bar{g}_k}{\\sum_k n_k} = \\frac{${shardMeans.map((m, k) => `${shardSizes[k]}\\times(${round(m, 3)})`).join(' + ')}}{${shardSizes.reduce((a, b) => a + b, 0)}} = ${round(full, 3)}`
    };
  }
}

export const PRESETS = [
  { id: 'correct_equal', label: '2 GPU, shard đều, trung bình ✅', state: { shards: 'equal', how: 'weighted', logN: 2 } },
  { id: 'forgot_divide', label: 'Quên chia cho số GPU (cộng thẳng) ❌', state: { shards: 'equal', how: 'sum', logN: 2 } },
  { id: 'unequal_naive', label: 'Shard 3+1, trung bình các trung bình ❌', state: { shards: 'unequal', how: 'avg_of_means', logN: 2 } },
  { id: 'unequal_weighted', label: 'Shard 3+1, có trọng số theo cỡ ✅', state: { shards: 'unequal', how: 'weighted', logN: 2 } },
  { id: 'many_gpus', label: '8 GPU: ring vẫn ≈ 2S', state: { shards: 'equal', how: 'weighted', logN: 3 } }
];
