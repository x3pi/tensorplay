/**
 * Multi-Head Attention — Nhiều Cặp Mắt Cùng Nhìn
 * Path: lessons/multi_head_attention/logic.js
 *
 * d_model = 4, 3 token, W_Q = W_K = W_V = W_O = I (đơn vị) để dễ nhẩm.
 * Chia d_model thành h đầu, mỗi đầu d_k = d_model / h cột liên tiếp.
 *   head_m: out_m = softmax(X_m X_m^T) X_m      (bỏ chia căn d_k để dễ nhẩm)
 *   MHA   = concat(out_1, ..., out_h)
 *
 * Quy ước dữ liệu: 2 cột đầu = "vai trò cú pháp", 2 cột sau = "chủ đề ngữ nghĩa".
 * Khi h = 2, đầu 1 nhìn vai trò, đầu 2 nhìn chủ đề -> hai mẫu chú ý khác nhau cho cùng một Query.
 */

export const TOKENS = ['Robot', 'nhặt', 'pin'];
export const D_MODEL = 4;
export const X = [
  [1, 0, 1, 0], // Robot
  [0, 1, 0, 1], // nhặt
  [1, 0, 0, 1]  // pin
];

const round = (v, n = 4) => Number(v.toFixed(n));

export function softmax(scores) {
  const m = Math.max(...scores);
  const e = scores.map(s => Math.exp(s - m));
  const z = e.reduce((a, b) => a + b, 0);
  return e.map(v => v / z);
}

/** Attention trên một lát cột [from, to) của X. Trả về trọng số (cho Query q) và toàn bộ đầu ra các token. */
export function attendSlice(Xm, qIdx) {
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const weightsAll = Xm.map(qi => softmax(Xm.map(kj => dot(qi, kj))));
  const outAll = weightsAll.map(w => Xm[0].map((_, c) => w.reduce((s, wj, j) => s + wj * Xm[j][c], 0)));
  return { weights: weightsAll[qIdx], out: outAll[qIdx] };
}

export function multiHead(Xfull, heads, qIdx) {
  const dk = Xfull[0].length / heads;
  const perHead = [];
  for (let m = 0; m < heads; m++) {
    const Xm = Xfull.map(row => row.slice(m * dk, (m + 1) * dk));
    perHead.push(attendSlice(Xm, qIdx));
  }
  return { dk, perHead, concat: perHead.flatMap(h => h.out) };
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      heads: 1,       // 1 | 2 | 4
      queryIdx: 2     // token "pin"
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
    const { heads, queryIdx } = this.state;
    const mha = multiHead(X, heads, queryIdx);

    // Số tham số 4 ma trận d x d: không đổi theo số đầu
    const params = 4 * D_MODEL * D_MODEL;
    // KV cache mỗi token mỗi tầng: 2 * h * d_k = 2 * d_model phần tử
    const kvPerToken = 2 * heads * mha.dk;

    const distinctPatterns = new Set(mha.perHead.map(h => h.weights.map(w => round(w, 3)).join(','))).size;

    let verdict;
    if (heads === 1) {
      verdict = {
        type: 'warning',
        text: `⚠️ 1 đầu: "${TOKENS[queryIdx]}" chỉ có một mẫu chú ý duy nhất [${mha.perHead[0].weights.map(w => round(w, 2)).join(', ')}], phải trộn lẫn "vai trò" và "chủ đề" vào cùng một điểm số.`
      };
    } else if (distinctPatterns > 1) {
      verdict = {
        type: 'success',
        text: `✅ ${heads} đầu cho ${distinctPatterns} mẫu chú ý khác nhau trên cùng một Query. Mỗi đầu chuyên một kiểu quan hệ, rồi nối lại thành vector ${D_MODEL} chiều. Số tham số vẫn là ${params}, bằng khi dùng 1 đầu.`
      };
    } else {
      verdict = {
        type: 'warning',
        text: `⚠️ ${heads} đầu nhưng mọi đầu đều ra cùng một mẫu chú ý với Query này. Thử đổi Query sang token khác để thấy các đầu tách ra.`
      };
    }

    return {
      heads,
      queryIdx,
      query: TOKENS[queryIdx],
      dk: mha.dk,
      perHead: mha.perHead.map((h, m) => ({
        head: m + 1,
        cols: `${m * mha.dk}–${(m + 1) * mha.dk - 1}`,
        weights: h.weights.map(w => round(w)),
        out: h.out.map(v => round(v))
      })),
      concat: mha.concat.map(v => round(v)),
      distinctPatterns,
      params,
      kvPerToken,
      verdict,
      formulaKaTeX: `\\text{MHA}(X) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_{${heads}})\\, W_O, \\quad d_k = \\frac{d_{\\text{model}}}{h} = \\frac{${D_MODEL}}{${heads}} = ${mha.dk}`
    };
  }
}

export const PRESETS = [
  {
    id: 'single_head',
    label: '1 đầu (trộn lẫn) ❌',
    state: { heads: 1, queryIdx: 2 }
  },
  {
    id: 'two_heads',
    label: '2 đầu (chuyên môn hóa) ✅',
    state: { heads: 2, queryIdx: 2 }
  },
  {
    id: 'four_heads',
    label: '4 đầu (mỗi đầu 1 chiều)',
    state: { heads: 4, queryIdx: 2 }
  }
];
