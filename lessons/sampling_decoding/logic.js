/**
 * Sampling & Decoding — Từ Logits Đến Token Được Chọn
 * Path: lessons/sampling_decoding/logic.js
 *
 * Robot chọn hành động kế tiếp trong 5 lựa chọn, logits z = [3, 2, 1, 0, -1].
 * Hai lựa chọn cuối ("bay", "nổ") là vô nghĩa: coi là "đuôi xấu".
 * Quy trình: chia logits cho nhiệt độ T -> softmax -> top-k -> top-p -> chuẩn hóa lại -> bốc ngẫu nhiên.
 *   T = 1: P = [0.6364, 0.2341, 0.0861, 0.0317, 0.0117]
 *   top-p = 0.9: giữ 3 token (tích lũy 0.6364, 0.8705, 0.9567) -> [0.6652, 0.2447, 0.0900]
 *   top-k = 2  : giữ 2 token                                  -> [0.7311, 0.2689]
 * Bốc ngẫu nhiên bằng nghịch đảo hàm phân phối tích lũy: số u in [0, 1) rơi vào đoạn của token nào.
 */

export const TOKENS = ['đi thẳng', 'rẽ trái', 'dừng', 'bay', 'nổ'];
export const LOGITS = [3, 2, 1, 0, -1];
export const BAD = [3, 4]; // chỉ số các token vô nghĩa

const round = (v, n = 4) => Number(v.toFixed(n)) + 0;

export function softmaxT(logits, T) {
  const z = logits.map(v => v / T);
  const m = Math.max(...z);
  const e = z.map(v => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map(v => v / s);
}

/** Trả về mảng boolean giữ/loại theo top-k (k = 0 nghĩa là không giới hạn) rồi top-p. */
export function keepMask(probs, topK, topP) {
  const order = probs.map((p, i) => i).sort((a, b) => probs[b] - probs[a]);
  const keep = new Array(probs.length).fill(false);
  const limit = topK > 0 ? Math.min(topK, probs.length) : probs.length;
  let cum = 0;
  for (let r = 0; r < limit; r++) {
    const i = order[r];
    keep[i] = true;
    cum += probs[i];
    if (topP < 1 && cum >= topP) break; // giữ tập nhỏ nhất có tổng xác suất >= p
  }
  return keep;
}

export function filterAndRenormalize(probs, topK, topP) {
  const keep = keepMask(probs, topK, topP);
  const mass = probs.reduce((s, p, i) => s + (keep[i] ? p : 0), 0);
  return { keep, probs: probs.map((p, i) => (keep[i] ? p / mass : 0)), keptMass: mass };
}

/** Nghịch đảo CDF theo thứ tự xác suất giảm dần. */
export function pickToken(probs, u) {
  const order = probs.map((p, i) => i).sort((a, b) => probs[b] - probs[a]);
  let cum = 0;
  for (const i of order) {
    if (probs[i] <= 0) continue;
    cum += probs[i];
    if (u < cum) return i;
  }
  return order.find(i => probs[i] > 0);
}

export function entropyBits(probs) {
  return -probs.reduce((s, p) => (p > 0 ? s + p * Math.log2(p) : s), 0);
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { T: 1, topK: 0, topP: 1, u: 0.5, greedy: false };
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
    const { T, topK, topP, u, greedy } = this.state;
    const base = softmaxT(LOGITS, T);
    const f = filterAndRenormalize(base, topK, topP);
    const finalProbs = greedy ? base.map((p, i) => (i === 0 ? 1 : 0)) : f.probs;
    const chosen = greedy ? 0 : pickToken(f.probs, u);

    const badBefore = BAD.reduce((s, i) => s + base[i], 0);
    const badAfter = BAD.reduce((s, i) => s + finalProbs[i], 0);
    const nKept = greedy ? 1 : f.keep.filter(Boolean).length;
    const in50 = 1 - Math.pow(1 - badAfter, 50);
    const in50Before = 1 - Math.pow(1 - badBefore, 50);

    let verdict;
    if (greedy) {
      verdict = {
        type: 'warning',
        text: '⚠️ Greedy: luôn chọn "đi thẳng". Không bao giờ sinh token vô nghĩa nhưng cũng hoàn toàn xác định, nên văn bản hay lặp và thiếu đa dạng.'
      };
    } else if (badAfter > 0.1) {
      verdict = {
        type: 'danger',
        text: `❌ Đuôi quá nặng: xác suất bốc phải token vô nghĩa mỗi bước là ${round(badAfter * 100, 1)}%. Sinh 50 token thì ${round(in50 * 100, 1)}% có ít nhất một token tệ.`
      };
    } else if (badAfter === 0) {
      verdict = {
        type: 'success',
        text: `✅ Đuôi đã bị cắt sạch: giữ ${nKept} token, xác suất token vô nghĩa 0%. Vẫn còn lựa chọn ngẫu nhiên giữa ${nKept} ứng viên hợp lý.`
      };
    } else if (in50 > 0.5) {
      verdict = {
        type: 'warning',
        text: `⚠️ Đuôi còn ${round(badAfter * 100, 2)}% mỗi bước, nghe nhỏ nhưng sinh 50 token thì ${round(in50 * 100, 1)}% có ít nhất một token tệ. Hãy cắt đuôi bằng top-k hoặc top-p.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ Đuôi còn ${round(badAfter * 100, 2)}% mỗi bước (sinh 50 token: ${round(in50 * 100, 1)}% có ít nhất một token tệ).`
      };
    }

    return {
      T, topK, topP, u, greedy,
      tokens: TOKENS,
      baseProbs: base.map(p => round(p)),
      keep: greedy ? [true, false, false, false, false] : f.keep,
      finalProbs: finalProbs.map(p => round(p)),
      keptMass: round(greedy ? base[0] : f.keptMass),
      chosen,
      chosenToken: TOKENS[chosen],
      nKept,
      entropyBefore: round(entropyBits(base), 3),
      entropyAfter: round(entropyBits(finalProbs), 3),
      badBefore: round(badBefore),
      badAfter: round(badAfter),
      in50: round(in50, 4),
      in50Before: round(in50Before, 4),
      verdict,
      formulaKaTeX: greedy
        ? `\\text{token} = \\arg\\max_i z_i = \\text{«${TOKENS[0]}»}`
        : `P_i = \\frac{e^{z_i / ${T}}}{\\sum_j e^{z_j / ${T}}},\\quad \\text{giữ ${nKept} token, tổng xác suất giữ} = ${round(f.keptMass, 4)}`
    };
  }
}

export const PRESETS = [
  { id: 'greedy', label: 'Greedy (luôn chọn cao nhất)', state: { T: 1, topK: 0, topP: 1, u: 0.5, greedy: true } },
  { id: 'plain_t1', label: 'Bốc thuần T = 1', state: { T: 1, topK: 0, topP: 1, u: 0.5, greedy: false } },
  { id: 'hot_t2', label: 'Quá nóng T = 2 ❌', state: { T: 2, topK: 0, topP: 1, u: 0.95, greedy: false } },
  { id: 'hot_top_p', label: 'T = 2 + top-p 0.9', state: { T: 2, topK: 0, topP: 0.9, u: 0.95, greedy: false } },
  { id: 'top_k_2', label: 'T = 1 + top-k 2 ✅', state: { T: 1, topK: 2, topP: 1, u: 0.8, greedy: false } }
];
