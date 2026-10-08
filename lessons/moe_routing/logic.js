/**
 * Mixture-of-Experts — Nhiều Chuyên Gia, Mỗi Token Chỉ Gọi Vài Người
 * Path: lessons/moe_routing/logic.js
 *
 * 8 token, E = 4 chuyên gia (mỗi chuyên gia là một FFN như bài transformer_block_params).
 * Router chấm điểm (logits) từng token cho từng chuyên gia, softmax, chọn top-k chuyên gia.
 *   Dung lượng mỗi chuyên gia: cap = ceil(capacityFactor * T * k / E). Token đến muộn khi chuyên gia đầy bị BỎ (drop).
 *   Loss cân bằng tải (Switch): aux = E * sum_i f_i * P_i, với f_i = tỉ lệ phân công cho chuyên gia i,
 *   P_i = xác suất router trung bình dành cho i. Cân bằng hoàn hảo cho aux = 1.
 * "Cân bằng" ở đây = cộng thêm bias [-1.5, 0, 0.5, 0.5] vào logits (kiểu bias điều chỉnh tải, không cần loss phụ).
 * Tham số: dense FFN d = 4, m = 4: 128; MoE 4 chuyên gia: 512 (tổng), mỗi token chỉ dùng k * 128.
 */

export const LOGITS = [
  [2, 0, 0, 0], [2, 1, 0, 0], [1, 2, 0, 0], [3, 0, 0, 0],
  [2, 0, 1, 0], [0, 0, 2, 1], [1, 0, 0, 2], [2, 0, 0, 1]
];
export const BIAS = [-1.5, 0, 0.5, 0.5];
export const E = 4;
export const FFN_PARAMS = 128;

const round = (v, n = 4) => Number(v.toFixed(n)) + 0;

export function softmaxRows(rows) {
  return rows.map(r => {
    const m = Math.max(...r);
    const e = r.map(v => Math.exp(v - m));
    const s = e.reduce((a, b) => a + b, 0);
    return e.map(v => v / s);
  });
}

export function topK(row, k) {
  return row.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).slice(0, k).map(x => x[1]);
}

export function route(logits, k, capacityFactor, balanced) {
  const T = logits.length;
  const biased = logits.map(r => r.map((v, i) => v + (balanced ? BIAS[i] : 0)));
  const P = softmaxRows(biased);
  const choice = P.map(r => topK(r, k));
  const counts = new Array(E).fill(0);
  choice.forEach(c => c.forEach(e => counts[e]++));
  const cap = Math.ceil((capacityFactor * T * k) / E);
  const load = new Array(E).fill(0);
  const dropped = [];
  choice.forEach((c, t) => c.forEach(e => {
    if (load[e] < cap) load[e]++;
    else dropped.push([t, e]);
  }));
  const f = counts.map(c => c / (T * k));
  const Pmean = Array.from({ length: E }, (_, i) => P.reduce((s, r) => s + r[i], 0) / T);
  const aux = E * f.reduce((s, fi, i) => s + fi * Pmean[i], 0);
  const imbalance = Math.max(...counts) / ((T * k) / E);
  return { P, choice, counts, cap, load, dropped, f, Pmean, aux, imbalance };
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { k: 1, capacityFactor: 1.0, balanced: false };
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
    const { k, capacityFactor, balanced } = this.state;
    const r = route(LOGITS, k, capacityFactor, balanced);
    const T = LOGITS.length;
    const dropFrac = r.dropped.length / (T * k);

    let verdict;
    if (r.dropped.length > 0 && r.imbalance > 1.4) {
      verdict = {
        type: 'danger',
        text: `❌ Mất cân bằng: chuyên gia nặng nhất nhận gấp ${round(r.imbalance, 2)} lần mức đều, vượt dung lượng ${r.cap} nên ${r.dropped.length}/${T * k} lượt gọi bị BỎ (${round(dropFrac * 100, 1)}%). Các token đó đi qua mà không được xử lý.`
      };
    } else if (r.dropped.length > 0) {
      verdict = {
        type: 'warning',
        text: `⚠️ Tương đối cân bằng (gấp ${round(r.imbalance, 2)} lần mức đều) nhưng vẫn ${r.dropped.length} lượt gọi bị bỏ vì dung lượng ${r.cap} quá chặt. Tăng capacity factor.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ Không token nào bị bỏ (dung lượng ${r.cap}/chuyên gia). Loss cân bằng tải = ${round(r.aux, 3)} (lý tưởng = 1), tải nặng nhất gấp ${round(r.imbalance, 2)} lần mức đều.`
      };
    }

    return {
      k, capacityFactor, balanced, T,
      probs: r.P.map(row => row.map(v => round(v, 3))),
      choice: r.choice,
      counts: r.counts,
      cap: r.cap,
      load: r.load,
      dropped: r.dropped,
      dropFrac: round(dropFrac, 4),
      aux: round(r.aux, 4),
      imbalance: round(r.imbalance, 3),
      f: r.f.map(v => round(v, 3)),
      Pmean: r.Pmean.map(v => round(v, 3)),
      denseParams: FFN_PARAMS,
      moeTotalParams: E * FFN_PARAMS,
      activeParams: k * FFN_PARAMS,
      verdict,
      formulaKaTeX: `\\text{aux} = E \\sum_{i=1}^{E} f_i P_i = ${E} \\times ${round(r.aux / E, 4)} = ${round(r.aux, 3)},\\quad \\text{cap} = \\left\\lceil \\frac{${capacityFactor} \\times ${T} \\times ${k}}{${E}} \\right\\rceil = ${r.cap}`
    };
  }
}

export const PRESETS = [
  { id: 'collapse_top1', label: 'Top-1, dung lượng 1.0: một chuyên gia quá tải ❌', state: { k: 1, capacityFactor: 1.0, balanced: false } },
  { id: 'roomy_capacity', label: 'Top-1, dung lượng 2.5: không bỏ token nhưng lãng phí', state: { k: 1, capacityFactor: 2.5, balanced: false } },
  { id: 'balanced_top1', label: 'Top-1 + cân bằng tải ✅', state: { k: 1, capacityFactor: 1.0, balanced: true } },
  { id: 'top2', label: 'Top-2, dung lượng 1.0', state: { k: 2, capacityFactor: 1.0, balanced: false } },
  { id: 'top2_roomy', label: 'Top-2, dung lượng 2.5', state: { k: 2, capacityFactor: 2.5, balanced: false } }
];
