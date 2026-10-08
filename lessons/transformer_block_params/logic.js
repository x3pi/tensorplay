/**
 * Khối Transformer Hoàn Chỉnh — Tham Số Nằm Ở Đâu?
 * Path: lessons/transformer_block_params/logic.js
 *
 * Một khối (Pre-LN):  x <- x + MHA(LN(x));  x <- x + FFN(LN(x)).
 *   MHA : W_Q, W_K, W_V, W_O đều d x d                 -> 4 d^2
 *   FFN : d -> m d -> d (m = hệ số mở rộng, thường 4)   -> 2 m d^2
 *   => mỗi khối (4 + 2m) d^2; với m = 4: 12 d^2, trong đó FFN chiếm 8/12 = 2/3.
 * Bỏ qua bias và LayerNorm (< 0.1% với mô hình lớn).
 * Toàn mô hình: L khối + bảng embedding V x d (dùng chung với đầu ra, "tied").
 * FLOPs mỗi token (suy diễn, bỏ qua attention theo độ dài): 2 * (L * (4 + 2m) d^2 + V d).
 * Bộ nhớ: suy diễn FP16 = 2 byte/tham số; huấn luyện Adam mixed precision = 16 byte/tham số.
 */

const round = (v, n = 4) => Number(v.toFixed(n)) + 0;

export function attentionParams(d) {
  return 4 * d * d;
}

export function ffnParams(d, m = 4) {
  return 2 * m * d * d;
}

export function blockParams(d, m = 4) {
  return attentionParams(d) + ffnParams(d, m);
}

export function modelParams({ d, L, m = 4, V }) {
  return { body: L * blockParams(d, m), embed: V * d, total: L * blockParams(d, m) + V * d };
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { d: 4, L: 2, m: 4, V: 10 };
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
    const { d, L, m, V } = this.state;
    const attn = attentionParams(d);
    const ffn = ffnParams(d, m);
    const block = attn + ffn;
    const { body, embed, total } = modelParams({ d, L, m, V });
    const ffnShare = ffn / block;
    const flopsPerToken = 2 * (body + V * d);
    const inferBytes = 2 * total;
    const trainBytes = 16 * total;

    const fmt = (n) => {
      if (n >= 1e9) return `${round(n / 1e9, 2)} tỉ`;
      if (n >= 1e6) return `${round(n / 1e6, 2)} triệu`;
      return String(n);
    };

    let verdict;
    if (m === 4) {
      verdict = {
        type: 'success',
        text: `✅ Mỗi khối ${fmt(block)} tham số = ${(4 + 2 * m)}d²: attention ${fmt(attn)} (${round((1 - ffnShare) * 100, 1)}%), FFN ${fmt(ffn)} (${round(ffnShare * 100, 1)}%). Tổng mô hình ${fmt(total)} tham số.`
      };
    } else {
      verdict = {
        type: 'warning',
        text: `⚠️ Với hệ số mở rộng m = ${m}: mỗi khối ${4 + 2 * m}d², FFN chiếm ${round(ffnShare * 100, 1)}%. Chuẩn phổ biến là m = 4 (FFN chiếm 2/3).`
      };
    }

    return {
      d, L, m, V,
      attn, ffn, block,
      body, embed, total,
      ffnShare: round(ffnShare, 4),
      flopsPerToken,
      gflopsPerToken: round(flopsPerToken / 1e9, 3),
      inferGB: round(inferBytes / 1e9, 3),
      trainGB: round(trainBytes / 1e9, 3),
      human: { block: fmt(block), body: fmt(body), embed: fmt(embed), total: fmt(total) },
      verdict,
      formulaKaTeX: `P_{\\text{khối}} = \\underbrace{4d^2}_{\\text{attention}} + \\underbrace{2md^2}_{\\text{FFN}} = (4 + ${2 * m})\\,d^2 = ${4 + 2 * m} \\times ${d}^2 = ${block}`
    };
  }
}

export const PRESETS = [
  { id: 'toy', label: 'Đồ chơi: d=4, 2 tầng', state: { d: 4, L: 2, m: 4, V: 10 } },
  { id: 'gpt2_small', label: 'GPT-2 small: d=768, 12 tầng', state: { d: 768, L: 12, m: 4, V: 50257 } },
  { id: 'seven_b', label: 'Cỡ "7B": d=4096, 32 tầng', state: { d: 4096, L: 32, m: 4, V: 32000 } },
  { id: 'seventy_b', label: 'Cỡ "70B": d=8192, 80 tầng', state: { d: 8192, L: 80, m: 4, V: 32000 } },
  { id: 'narrow_ffn', label: 'FFN hẹp m=2', state: { d: 4, L: 2, m: 2, V: 10 } }
];
