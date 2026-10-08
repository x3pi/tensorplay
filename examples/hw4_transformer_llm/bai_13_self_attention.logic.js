/**
 * Bài 27: Scaled Dot-Product Self-Attention (Needle HW4)
 * Trực quan hóa cơ chế Attention: QK^T / sqrt(d_k) + Causal Mask + Softmax.
 * So sánh Softmax có scale vs không scale (bão hòa gradient)
 * và vai trò của Causal Mask tam giác trên chặn nhìn trước tương lai.
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      tokens: ["Deep", "Learning", "Systems"],
      d_k: 4,               // Chiều vector Q, K
      isScaled: true,       // Chia sqrt(d_k)
      isCausalMask: true,   // Mặt nạ tam giác trên (-inf)
      selectedTokenIdx: 1   // Token đang chiếu spotlight
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
    const { tokens, d_k, isScaled, isCausalMask, selectedTokenIdx } = this.state;
    const N = tokens.length;
    const scaleFactor = isScaled ? Math.sqrt(d_k) : 1.0;

    // Giả lập ma trận QK^T thô (N x N)
    const rawScores = [
      [4.0, 2.0, 1.0],
      [3.0, 6.0, 2.0],
      [2.0, 4.0, 5.0]
    ];

    // 1. Áp dụng scale factor
    const scaledScores = rawScores.map(row =>
      row.map(val => val / scaleFactor)
    );

    // 2. Áp dụng Causal Mask (nếu bật, gán -Infinity cho j > i)
    const maskedScores = scaledScores.map((row, i) =>
      row.map((val, j) => {
        if (isCausalMask && j > i) {
          return -Infinity;
        }
        return val;
      })
    );

    // 3. Tính Softmax từng hàng (Safe Softmax)
    const attentionMatrix = maskedScores.map(row => {
      // Tìm max hữu hạn
      const validVals = row.filter(v => v !== -Infinity);
      const maxVal = validVals.length > 0 ? Math.max(...validVals) : 0;

      const expVals = row.map(v => (v === -Infinity ? 0 : Math.exp(v - maxVal)));
      const sumExp = expVals.reduce((a, b) => a + b, 0);

      return expVals.map(v => (sumExp > 0 ? Number((v / sumExp).toFixed(3)) : 0));
    });

    // Spotlight weights cho token được chọn
    const activeWeights = attentionMatrix[selectedTokenIdx] || [0, 0, 0];

    // Kiểm tra tính chất causal: token i không bao giờ nhìn token j > i
    let isStrictlyCausal = true;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        if (attentionMatrix[i][j] > 1e-4) {
          isStrictlyCausal = false;
        }
      }
    }

    return {
      tokens,
      d_k,
      scaleFactor: Number(scaleFactor.toFixed(2)),
      isScaled,
      isCausalMask,
      selectedTokenIdx,
      rawScores,
      scaledScores: scaledScores.map(r => r.map(v => Number(v.toFixed(2)))),
      attentionMatrix,
      activeWeights,
      isStrictlyCausal,
      formulaScaleKaTeX: `\\text{Scale}: \\frac{1}{\\sqrt{d_k}} = \\frac{1}{\\sqrt{${d_k}}} = ${scaleFactor === 1 ? '1.0 \\; (\\text{TẮT})' : scaleFactor.toFixed(2)}`,
      formulaMaskKaTeX: `M_{ij} = ${isCausalMask ? '\\begin{cases} 0 & j \\le i \\\\ -\\infty & j > i \\end{cases}' : '0 \\; (\\text{Song hướng})'}`
    };
  }
}

export const PRESETS = [
  {
    id: "gpt_causal_standard",
    label: "Mô Hình GPT (Causal Mask + Scale Chuẩn)",
    state: { isScaled: true, isCausalMask: true, selectedTokenIdx: 1 }
  },
  {
    id: "bert_bidirectional",
    label: "Mô Hình BERT (Không Mask, Song hướng)",
    state: { isScaled: true, isCausalMask: false, selectedTokenIdx: 1 }
  },
  {
    id: "unscaled_hazard",
    label: "Không Scale (Bão hòa softmax, vanishing grad)",
    state: { isScaled: false, isCausalMask: true, selectedTokenIdx: 2 }
  }
];
