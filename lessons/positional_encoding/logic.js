/**
 * Positional Encoding — Self-Attention Không Biết Thứ Tự
 * Path: lessons/positional_encoding/logic.js
 *
 * Embedding 2 chiều: chó = [1, 0], cắn = [0, 1], người = [1, 1].
 * Hai câu cùng tập từ nhưng khác thứ tự:
 *   A: "chó cắn người"      B: "người cắn chó"
 * Self-attention rút gọn (Q = K = V = X, bỏ chia căn d_k để dễ nhẩm):
 *   out_i = sum_j softmax_j(x_i . x_j) * x_j
 * Mã hóa vị trí dạng sin/cos với tần số pi/2 (chu kỳ 4 vị trí), cho số tròn:
 *   PE(pos) = [sin(pos * pi/2), cos(pos * pi/2)]  ->  [0,1], [1,0], [0,-1], [-1,0]
 */

export const EMBED = {
  'chó': [1, 0],
  'cắn': [0, 1],
  'người': [1, 1]
};

export const SENTENCES = {
  A: ['chó', 'cắn', 'người'],
  B: ['người', 'cắn', 'chó']
};

const clean = (v) => Math.round(v * 1e9) / 1e9 + 0; // "+ 0" đổi -0 thành 0
const round = (v, n = 4) => Number(v.toFixed(n));

export function positionalEncoding(pos) {
  const w = Math.PI / 2;
  return [clean(Math.sin(pos * w)), clean(Math.cos(pos * w))];
}

export function softmax(scores) {
  const m = Math.max(...scores);
  const e = scores.map(s => Math.exp(s - m));
  const z = e.reduce((a, b) => a + b, 0);
  return e.map(v => v / z);
}

/** Chạy self-attention cho một câu, trả về trọng số và đầu ra của token ở vị trí `queryPos`. */
export function attendSentence(tokens, usePE, queryToken) {
  const X = tokens.map((t, pos) => {
    const pe = usePE ? positionalEncoding(pos) : [0, 0];
    return EMBED[t].map((v, k) => v + pe[k]);
  });
  const queryPos = tokens.indexOf(queryToken);
  const q = X[queryPos];
  const scores = X.map(x => q[0] * x[0] + q[1] * x[1]);
  const weights = softmax(scores);
  const out = [0, 1].map(k => weights.reduce((s, w, j) => s + w * X[j][k], 0));
  return { X, queryPos, scores, weights, out };
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      usePE: false,
      queryToken: 'cắn'
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
    const { usePE, queryToken } = this.state;
    const a = attendSentence(SENTENCES.A, usePE, queryToken);
    const b = attendSentence(SENTENCES.B, usePE, queryToken);
    const diff = Math.hypot(a.out[0] - b.out[0], a.out[1] - b.out[1]);
    const orderBlind = diff < 1e-9;

    let verdict;
    if (orderBlind) {
      verdict = {
        type: 'danger',
        text: `❌ Không có thông tin vị trí: "${queryToken}" nhận cùng một vector [${a.out.map(v => round(v)).join(', ')}] trong cả hai câu. Mô hình không phân biệt được "chó cắn người" với "người cắn chó"!`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ Đã cộng mã vị trí: "${queryToken}" nhận [${a.out.map(v => round(v)).join(', ')}] ở câu A nhưng [${b.out.map(v => round(v)).join(', ')}] ở câu B (khoảng cách ${round(diff)}). Thứ tự từ giờ đã ảnh hưởng đến kết quả.`
      };
    }

    const peTable = [0, 1, 2, 3].map(pos => ({ pos, pe: positionalEncoding(pos) }));
    const formulaKaTeX = usePE
      ? `x_i = e_i + \\text{PE}(i), \\quad \\text{PE}(i) = \\left[\\sin\\tfrac{i\\pi}{2},\\ \\cos\\tfrac{i\\pi}{2}\\right]`
      : `x_i = e_i \\quad (\\text{không có thông tin vị trí})`;

    return {
      usePE,
      queryToken,
      A: { tokens: SENTENCES.A, X: a.X.map(r => r.map(v => round(v))), weights: a.weights.map(v => round(v)), out: a.out.map(v => round(v)), queryPos: a.queryPos },
      B: { tokens: SENTENCES.B, X: b.X.map(r => r.map(v => round(v))), weights: b.weights.map(v => round(v)), out: b.out.map(v => round(v)), queryPos: b.queryPos },
      diff: round(diff),
      orderBlind,
      peTable,
      formulaKaTeX,
      verdict
    };
  }
}

export const PRESETS = [
  {
    id: 'no_pe',
    label: 'Không mã vị trí ❌',
    state: { usePE: false, queryToken: 'cắn' }
  },
  {
    id: 'with_pe',
    label: 'Cộng mã vị trí sin/cos ✅',
    state: { usePE: true, queryToken: 'cắn' }
  },
  {
    id: 'pe_query_dog',
    label: 'Soi từ "chó" khi có mã vị trí',
    state: { usePE: true, queryToken: 'chó' }
  }
];
