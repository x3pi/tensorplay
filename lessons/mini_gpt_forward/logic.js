/**
 * Mini-GPT — Một Lượt Thuận Từ Token Đến Xác Suất Token Kế Tiếp
 * Path: lessons/mini_gpt_forward/logic.js
 *
 * Ghép mọi bài trước thành một mô hình nhỏ chạy thật: V = 4 token, d = 4, 1 khối Pre-LN, 2 đầu attention (d_k = 2).
 *   Embedding E = ma trận đơn vị (token i -> one-hot i), mã vị trí PE(p) = [0, 0, sin(p*pi/2), cos(p*pi/2)].
 *   W_Q = W_K = W_V = W_O = I; FFN: h -> ReLU(h [I | -I]) [I ; 0] = ReLU(h) (m = 2); đầu ra dùng chung E (tied).
 *   LayerNorm không có gamma/beta, eps = 1e-5. Attention có mặt nạ nhân quả.
 * Mô hình CHƯA huấn luyện: bài này theo dõi đường đi của dữ liệu và kích thước tensor, không phải chất lượng dự đoán.
 */

export const VOCAB = ['Robot', 'nhặt', 'pin', 'sạc'];
export const D = 4;
export const HEADS = 2;
export const SEQUENCES = {
  seqA: [0, 1, 2],  // Robot nhặt pin
  seqB: [0, 1, 3],  // Robot nhặt sạc  (chỉ khác token cuối)
  seqC: [2, 1, 0]   // pin nhặt Robot  (đảo thứ tự)
};
export const STAGE_NAMES = [
  'Token → id',
  'Embedding E[id]',
  '+ Mã vị trí PE',
  'LayerNorm 1',
  'Multi-Head Attention (2 đầu, nhân quả)',
  'Residual 1: x + Attn',
  'LayerNorm 2 + FFN (ReLU)',
  'Residual 2: x + FFN',
  'LayerNorm cuối → Logits (E tied)',
  'Softmax → P(token kế tiếp)'
];

const clean = (v) => Math.round(v * 1e9) / 1e9 + 0;
const round = (v, n = 4) => Number(v.toFixed(n)) + 0;
const mapM = (M, f) => M.map(r => r.map(f));
const addM = (A, B) => A.map((r, i) => r.map((v, j) => v + B[i][j]));
const T_ = (M) => M[0].map((_, j) => M.map(r => r[j]));
const matmul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));

export function layerNorm(X, eps = 1e-5) {
  return X.map(row => {
    const mu = row.reduce((a, b) => a + b, 0) / row.length;
    const va = row.reduce((s, v) => s + (v - mu) ** 2, 0) / row.length;
    return row.map(v => (v - mu) / Math.sqrt(va + eps));
  });
}

export function softmaxRows(M) {
  return M.map(r => {
    const m = Math.max(...r);
    const e = r.map(v => Math.exp(v - m));
    const s = e.reduce((a, b) => a + b, 0);
    return e.map(v => v / s);
  });
}

export function posEnc(T) {
  return Array.from({ length: T }, (_, p) => [0, 0, clean(Math.sin((p * Math.PI) / 2)), clean(Math.cos((p * Math.PI) / 2))]);
}

export function attention(H, heads = HEADS) {
  const T = H.length;
  const dk = H[0].length / heads;
  const weights = [];
  const outs = Array.from({ length: T }, () => []);
  for (let h = 0; h < heads; h++) {
    const S = H.map(r => r.slice(h * dk, (h + 1) * dk));
    const scores = matmul(S, T_(S)).map((row, i) => row.map((v, j) => (j > i ? -Infinity : v / Math.sqrt(dk))));
    const P = softmaxRows(scores);
    weights.push(P);
    const O = matmul(P, S);
    O.forEach((row, i) => outs[i].push(...row));
  }
  return { out: outs, weights };
}

export function forward(ids) {
  const T = ids.length;
  const E = Array.from({ length: VOCAB.length }, (_, i) => Array.from({ length: D }, (_, j) => (i === j ? 1 : 0)));
  const x0 = ids.map(i => E[i]);
  const x = addM(x0, posEnc(T));
  const h1 = layerNorm(x);
  const attn = attention(h1);
  const x1 = addM(x, attn.out);
  const h2 = layerNorm(x1);
  const ffn = mapM(h2, v => Math.max(0, v));
  const x2 = addM(x1, ffn);
  const hf = layerNorm(x2);
  const logits = matmul(hf, T_(E));
  const P = softmaxRows(logits);
  return { x0, x, h1, attn, x1, h2, ffn, x2, hf, logits, P };
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { seq: 'seqA', stage: 0 };
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
    const { seq, stage } = this.state;
    const ids = SEQUENCES[seq];
    const tokens = ids.map(i => VOCAB[i]);
    const f = forward(ids);
    const R = (M) => M.map(r => r.map(v => round(v, 3)));
    const last = f.P[f.P.length - 1];
    const nextId = last.indexOf(Math.max(...last));

    const matrices = [
      [ids],
      R(f.x0), R(f.x), R(f.h1), R(f.attn.out), R(f.x1), R(f.ffn), R(f.x2), R(f.logits), R(f.P)
    ];
    const descriptions = [
      'Từ điển biến chữ thành số: mỗi token một chỉ số (chỉ là một hàng bảng tra, không phép nhân).',
      'Tra bảng embedding: token id i lấy hàng i của E (ở đây E = I nên là one-hot).',
      'Cộng mã vị trí để attention biết thứ tự (bài Positional Encoding).',
      'Chuẩn hóa từng hàng (từng token) về trung bình 0, phương sai 1 trước khi vào attention (Pre-LN).',
      'Mỗi token trộn thông tin từ chính nó và các token TRƯỚC nó (mặt nạ nhân quả), 2 đầu × 2 chiều rồi nối lại.',
      'Cộng đường tắt residual: gradient có đường đi thẳng, tín hiệu gốc được giữ lại.',
      'LayerNorm lần 2 rồi FFN; ở bản toy FFN = ReLU(h) (kênh âm bị chặn về 0).',
      'Cộng residual lần 2: kết thúc một khối Transformer.',
      'LayerNorm cuối rồi nhân với Eᵀ (dùng chung bảng embedding) ra điểm số cho cả 4 token từ vựng.',
      'Softmax từng hàng. Hàng cuối là phân phối của TOKEN KẾ TIẾP (bài Sampling: bốc hoặc lấy lớn nhất).'
    ];

    const paramsAttn = 4 * D * D;
    const paramsFfn = 2 * 2 * D * D;
    const paramsEmbed = VOCAB.length * D;
    const params = paramsAttn + paramsFfn + paramsEmbed;

    // Tính nhân quả: hàng của các token đứng trước không phụ thuộc token sau
    const causalNote = seq === 'seqB'
      ? 'seqB chỉ khác seqA ở token cuối: hai hàng đầu của mọi tensor GIỐNG HỆT seqA (nhân quả), chỉ hàng cuối đổi.'
      : '';

    const verdict = {
      type: 'success',
      text: `✅ Giai đoạn ${stage + 1}/${STAGE_NAMES.length}: ${STAGE_NAMES[stage]}. Mô hình chưa huấn luyện nên dự đoán token kế tiếp ("${VOCAB[nextId]}", ${round(last[nextId] * 100, 1)}%) không có ý nghĩa; hãy nhìn đường đi và kích thước dữ liệu. ${causalNote}`.trim()
    };

    return {
      seq, stage, ids, tokens, vocab: VOCAB,
      stageNames: STAGE_NAMES,
      stageName: STAGE_NAMES[stage],
      description: descriptions[stage],
      matrix: matrices[stage],
      shape: stage === 0 ? [1, ids.length] : [matrices[stage].length, matrices[stage][0].length],
      all: matrices,
      attnWeights: f.attn.weights.map(P => R(P)),
      nextToken: VOCAB[nextId],
      nextProb: round(last[nextId], 4),
      lastProbs: last.map(v => round(v, 4)),
      params: { attention: paramsAttn, ffn: paramsFfn, embedding: paramsEmbed, total: params },
      flopsPerToken: 2 * params,
      verdict,
      formulaKaTeX: [
        `\\text{ids} = [${ids.join(', ')}]`,
        `X_0 = E[\\text{ids}] \\in \\mathbb{R}^{${ids.length} \\times ${D}}`,
        `X = X_0 + \\text{PE}`,
        `H_1 = \\text{LN}(X)`,
        `A = \\text{MHA}(H_1) \\quad (h = ${HEADS},\\ d_k = ${D / HEADS})`,
        `X_1 = X + A`,
        `F = \\text{ReLU}(\\text{LN}(X_1)) \\quad \\text{(đầu ra FFN, chưa cộng residual)}`,
        `X_2 = X_1 + \\text{FFN}(\\text{LN}(X_1))`,
        `Z = \\text{LN}(X_2)\\, E^\\top`,
        `P = \\text{softmax}(Z)`
      ][stage]
    };
  }
}

export const PRESETS = [
  { id: 'robot_nhat_pin', label: '"Robot nhặt pin"', state: { seq: 'seqA', stage: 0 } },
  { id: 'robot_nhat_sac', label: '"Robot nhặt sạc" (đổi token cuối)', state: { seq: 'seqB', stage: 4 } },
  { id: 'pin_nhat_robot', label: '"pin nhặt Robot" (đảo thứ tự)', state: { seq: 'seqC', stage: 2 } },
  { id: 'final_probs', label: 'Xem kết quả cuối', state: { seq: 'seqA', stage: 9 } }
];
