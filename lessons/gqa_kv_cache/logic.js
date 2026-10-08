/**
 * GQA / MQA — Chia Sẻ K, V Giữa Các Đầu Để Thu Nhỏ KV-Cache
 * Path: lessons/gqa_kv_cache/logic.js
 *
 * Mô hình cỡ 70B: L = 80 tầng, 64 đầu query, d_head = 128, d_model = 8192, FP16 (2 byte).
 *   KV-Cache mỗi token = 2 (K và V) * L * n_kv * d_head * 2 byte
 *   MHA : n_kv = 64 (mỗi đầu query có K,V riêng)  -> 2 621 440 B/token (2.5 MiB)
 *   GQA : n_kv = 8  (8 đầu query dùng chung 1 cặp K,V) -> 327 680 B/token (320 KiB)
 *   MQA : n_kv = 1  (mọi đầu dùng chung) -> 40 960 B/token (40 KiB)
 * Tham số W_K, W_V mỗi tầng: 2 * d_model * (n_kv * d_head).
 */

export const L = 80;
export const HEADS = 64;
export const D_HEAD = 128;
export const D_MODEL = 8192;
export const BYTES = 2;
export const GIB = 1024 ** 3;
export const WEIGHTS_GIB = 140e9 / GIB; // 70B tham số FP16 = 140 GB

const round = (v, n = 4) => Number(v.toFixed(n)) + 0;

export function kvBytesPerToken(nKv) {
  return 2 * L * nKv * D_HEAD * BYTES;
}

export function kvProjParams(nKv) {
  return L * 2 * D_MODEL * nKv * D_HEAD;
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { nKv: 64, logCtx: 12, logBatch: 4, budgetGiB: 40 };
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
    const { nKv, logCtx, logBatch, budgetGiB } = this.state;
    const ctx = Math.pow(2, logCtx);
    const batch = Math.pow(2, logBatch);
    const perToken = kvBytesPerToken(nKv);
    const perSeqGiB = (perToken * ctx) / GIB;
    const batchGiB = perSeqGiB * batch;
    const maxSeqs = Math.floor(budgetGiB / perSeqGiB);
    const group = HEADS / nKv;
    const reduction = HEADS / nKv;
    const mhaPerSeqGiB = (kvBytesPerToken(HEADS) * ctx) / GIB;
    const projParams = kvProjParams(nKv);
    const mhaProj = kvProjParams(HEADS);
    const kvVsWeights = batchGiB / WEIGHTS_GIB;

    const kind = nKv === HEADS ? 'MHA' : nKv === 1 ? 'MQA' : 'GQA';
    let verdict;
    if (batchGiB > WEIGHTS_GIB) {
      verdict = {
        type: 'danger',
        text: `❌ ${kind}: KV-Cache của ${batch} chuỗi dài ${ctx.toLocaleString('en-US')} token là ${round(batchGiB, 1)} GiB, LỚN HƠN cả trọng số mô hình (${round(WEIGHTS_GIB, 0)} GiB). Mỗi bước giải mã phải đọc cả đống này từ HBM.`
      };
    } else if (nKv === HEADS) {
      verdict = {
        type: 'warning',
        text: `⚠️ MHA: ${round(perToken / 1024, 0)} KiB mỗi token, một chuỗi ${ctx.toLocaleString('en-US')} token tốn ${round(perSeqGiB, 2)} GiB; ngân sách ${budgetGiB} GiB chỉ chứa ${maxSeqs} chuỗi cùng lúc.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ ${kind} (${group} đầu query dùng chung 1 cặp K,V): ${round(perToken / 1024, 0)} KiB mỗi token, nhỏ hơn MHA ${reduction} lần; ngân sách ${budgetGiB} GiB chứa được ${maxSeqs} chuỗi (MHA: ${Math.floor(budgetGiB / mhaPerSeqGiB)}).`
      };
    }

    return {
      kind, nKv, group, ctx, batch, budgetGiB,
      bytesPerToken: perToken,
      kibPerToken: round(perToken / 1024, 2),
      perSeqGiB: round(perSeqGiB, 4),
      batchGiB: round(batchGiB, 3),
      maxSeqs,
      reduction,
      mhaPerSeqGiB: round(mhaPerSeqGiB, 4),
      projParams,
      projSavedParams: mhaProj - projParams,
      kvVsWeights: round(kvVsWeights, 3),
      weightsGiB: round(WEIGHTS_GIB, 2),
      verdict,
      formulaKaTeX: `\\text{KV/token} = 2 \\times ${L} \\times ${nKv} \\times ${D_HEAD} \\times ${BYTES}\\,\\text{B} = ${perToken.toLocaleString('en-US')}\\,\\text{B}`
    };
  }
}

export const PRESETS = [
  { id: 'mha', label: 'MHA: 64 đầu K,V (Llama-1 70B kiểu cũ)', state: { nKv: 64, logCtx: 12, logBatch: 4 } },
  { id: 'gqa8', label: 'GQA: 8 nhóm K,V (Llama-2/3 70B) ✅', state: { nKv: 8, logCtx: 12, logBatch: 4 } },
  { id: 'mqa', label: 'MQA: 1 cặp K,V dùng chung', state: { nKv: 1, logCtx: 12, logBatch: 4 } },
  { id: 'long_context_mha', label: 'MHA + ngữ cảnh 32k, batch 8 ❌', state: { nKv: 64, logCtx: 15, logBatch: 3 } },
  { id: 'long_context_gqa', label: 'GQA + ngữ cảnh 32k, batch 8', state: { nKv: 8, logCtx: 15, logBatch: 3 } }
];
