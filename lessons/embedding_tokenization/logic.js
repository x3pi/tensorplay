/**
 * Tokenization (BPE) & Embedding — Chuỗi Ngắn Hơn Đổi Lấy Bảng Từ Vựng Lớn Hơn
 * Path: lessons/embedding_tokenization/logic.js
 *
 * Văn bản đồ chơi: "aaabdaaabac" (11 ký tự). BPE lặp lại: gộp cặp token liền kề xuất hiện NHIỀU NHẤT
 * (hòa thì chọn cặp xuất hiện sớm nhất) thành một token mới.
 *   0 lần gộp: a a a b d a a a b a c            (N = 11, V = 4)
 *   1 lần    : aa a b d aa a b a c              (N = 9,  V = 5)
 *   2 lần    : aaa b d aaa b a c                (N = 7,  V = 6)
 *   3 lần    : aaab d aaab a c                  (N = 5,  V = 7)
 * Embedding là bảng E (V x d). Tra token id: hàng id, bắt đầu ở offset id * d trong bộ nhớ 1D.
 */

export const TEXT = 'aaabdaaabac';
export const D_MODEL = 4;
export const MAX_MERGES = 3;

/** Thực hiện tối đa `merges` lần gộp BPE; trả về lịch sử từng bước. */
export function bpe(text, merges) {
  let tokens = text.split('');
  const base = [...new Set(tokens)].sort();
  const vocab = [...base];
  const history = [{ tokens: [...tokens], vocabSize: vocab.length, merged: null }];

  for (let m = 0; m < merges; m++) {
    const counts = new Map();
    const firstSeen = new Map();
    for (let i = 0; i < tokens.length - 1; i++) {
      const key = `${tokens[i]}\u0001${tokens[i + 1]}`;
      counts.set(key, (counts.get(key) || 0) + 1);
      if (!firstSeen.has(key)) firstSeen.set(key, i);
    }
    let best = null;
    for (const [key, c] of counts) {
      if (best === null || c > counts.get(best) || (c === counts.get(best) && firstSeen.get(key) < firstSeen.get(best))) {
        best = key;
      }
    }
    if (best === null || counts.get(best) < 2) break;
    const [l, r] = best.split('\u0001');
    const merged = l + r;
    const out = [];
    for (let i = 0; i < tokens.length; i++) {
      if (i < tokens.length - 1 && tokens[i] === l && tokens[i + 1] === r) {
        out.push(merged);
        i++;
      } else {
        out.push(tokens[i]);
      }
    }
    tokens = out;
    vocab.push(merged);
    history.push({ tokens: [...tokens], vocabSize: vocab.length, merged: { left: l, right: r, result: merged, count: counts.get(best) } });
  }
  return { history, vocab };
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { merges: 0, queryIdx: 4 };
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
    const { merges, queryIdx } = this.state;
    const { history, vocab } = bpe(TEXT, merges);
    const cur = history[history.length - 1];
    const tokens = cur.tokens;
    const N = tokens.length;
    const V = cur.vocabSize;
    const ids = tokens.map(t => vocab.indexOf(t));
    const idx = Math.min(queryIdx, N - 1);
    const lookupId = ids[idx];
    const baseN = TEXT.length;

    // Giả thuyết thực tế: V = 50 000, d = 4096, FP16 (2 byte)
    const realTableParams = 50000 * 4096;
    const realTableMB = (realTableParams * 2) / 1e6;
    const charLevelAttnFactor = 16; // 1 token ≈ 4 ký tự -> N lớn gấp 4 -> N^2 gấp 16

    let verdict;
    if (merges === 0) {
      verdict = {
        type: 'warning',
        text: `⚠️ Mức ký tự: bảng từ vựng nhỏ nhất (V = ${V}) nhưng chuỗi dài N = ${N}, chi phí attention $N^2$ = ${N * N}.`
      };
    } else if (merges === MAX_MERGES || N <= 5) {
      verdict = {
        type: 'success',
        text: `✅ Sau ${merges} lần gộp: N giảm từ ${baseN} xuống ${N} (attention rẻ đi ${((baseN * baseN) / (N * N)).toFixed(1)} lần) nhưng bảng embedding lớn hơn: V = ${V}, ${V * D_MODEL} số.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ Sau ${merges} lần gộp: N = ${N}, V = ${V}. Chuỗi ngắn đi, bảng embedding to ra: đó là sự đánh đổi của tokenizer.`
      };
    }

    return {
      merges,
      tokens,
      ids,
      vocab: [...vocab],
      N,
      V,
      attnCost: N * N,
      baseAttnCost: baseN * baseN,
      embedElems: V * D_MODEL,
      d: D_MODEL,
      lookupIdx: idx,
      lookupToken: tokens[idx],
      lookupId,
      lookupOffset: lookupId * D_MODEL,
      lookupRow: Array.from({ length: D_MODEL }, (_, j) => lookupId * D_MODEL + j),
      lastMerge: cur.merged,
      history: history.map(h => ({ tokens: [...h.tokens], vocabSize: h.vocabSize, merged: h.merged })),
      roundTrip: tokens.join('') === TEXT,
      realTableParams,
      realTableMB,
      charLevelAttnFactor,
      verdict,
      formulaKaTeX: `\\text{offset}(\\text{id}) = \\text{id} \\times d = ${lookupId} \\times ${D_MODEL} = ${lookupId * D_MODEL}`
    };
  }
}

export const PRESETS = [
  { id: 'chars', label: 'Mức ký tự (0 lần gộp)', state: { merges: 0, queryIdx: 4 } },
  { id: 'one_merge', label: 'Gộp 1 lần: aa', state: { merges: 1, queryIdx: 0 } },
  { id: 'full_bpe', label: 'Gộp 3 lần: aaab ✅', state: { merges: 3, queryIdx: 0 } }
];
