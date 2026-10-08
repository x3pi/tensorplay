/**
 * Overfitting & Validation — Tập huấn luyện nói dối, tập kiểm định nói thật
 * Path: lessons/overfitting_validation/logic.js
 *
 * Robot đoán độ sáng đèn pha theo khoảng cách. Quy luật thật là y = x.
 * Train (có nhiễu): x = [0, 1, 2, 3], y = [0.5, 0.5, 2.5, 2.5]
 * Val   (sạch)    : x = [0.5, 1.5, 2.5, 3.5], y = x
 * Mô hình: đa thức bậc d = 0..3 khớp bình phương tối thiểu.
 */

export const TRAIN = { x: [0, 1, 2, 3], y: [0.5, 0.5, 2.5, 2.5] };
export const VAL = { x: [0.5, 1.5, 2.5, 3.5], y: [0.5, 1.5, 2.5, 3.5] };

const round = (v, n = 4) => Number(v.toFixed(n)) + 0;

/** Giải hệ A c = b bằng khử Gauss có chọn trụ. */
function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
    [M[i], M[p]] = [M[p], M[i]];
    for (let r = i + 1; r < n; r++) {
      const f = M[r][i] / M[i][i];
      for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let c = i + 1; c < n; c++) s -= M[i][c] * x[c];
    x[i] = s / M[i][i];
  }
  return x;
}

/** Hệ số đa thức [c0, c1, ..., cd] (c0 là hệ số tự do). */
export function polyfit(xs, ys, degree) {
  const n = degree + 1;
  const V = xs.map(x => Array.from({ length: n }, (_, j) => Math.pow(x, j)));
  const A = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => V.reduce((s, row) => s + row[i] * row[j], 0)));
  const b = Array.from({ length: n }, (_, i) => V.reduce((s, row, k) => s + row[i] * ys[k], 0));
  return solve(A, b);
}

export function polyval(coef, x) {
  return coef.reduce((s, c, j) => s + c * Math.pow(x, j), 0);
}

export function mse(pred, target) {
  return pred.reduce((s, p, i) => s + (p - target[i]) ** 2, 0) / pred.length;
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { degree: 1 };
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
    const { degree } = this.state;
    const coef = polyfit(TRAIN.x, TRAIN.y, degree);
    const trainPred = TRAIN.x.map(x => polyval(coef, x));
    const valPred = VAL.x.map(x => polyval(coef, x));
    const trainMse = mse(trainPred, TRAIN.y);
    const valMse = mse(valPred, VAL.y);

    // Bậc nào có val MSE nhỏ nhất trong 0..3 (để so sánh)
    const allVal = [0, 1, 2, 3].map(d => {
      const c = polyfit(TRAIN.x, TRAIN.y, d);
      return mse(VAL.x.map(x => polyval(c, x)), VAL.y);
    });
    const bestDegree = allVal.indexOf(Math.min(...allVal));

    let verdict;
    if (trainMse < 1e-9 && valMse > 1) {
      verdict = {
        type: 'danger',
        text: `❌ Quá khớp: lỗi train = 0 (thuộc lòng cả nhiễu) nhưng lỗi val = ${round(valMse)}. Đừng tin vào loss train!`
      };
    } else if (degree === 0) {
      verdict = {
        type: 'warning',
        text: `⚠️ Dưới khớp: mô hình chỉ đoán trung bình, cả lỗi train (${round(trainMse)}) lẫn val (${round(valMse)}) đều cao.`
      };
    } else if (degree === bestDegree || Math.abs(valMse - allVal[bestDegree]) < 1e-9) {
      verdict = {
        type: 'success',
        text: `✅ Vừa vặn: lỗi train ${round(trainMse)} nhưng lỗi val chỉ ${round(valMse)} — thấp nhất trong các bậc đã thử.`
      };
    } else {
      verdict = { type: 'warning', text: `⚠️ Lỗi val ${round(valMse)}; thử các bậc khác để so sánh.` };
    }

    return {
      degree,
      coef: coef.map(c => round(c)),
      trainPred: trainPred.map(v => round(v)),
      valPred: valPred.map(v => round(v)),
      trainMse: round(trainMse),
      valMse: round(valMse),
      gap: round(valMse - trainMse),
      allVal: allVal.map(v => round(v)),
      bestDegree,
      verdict,
      formulaKaTeX: `\\hat{y}(x) = ${coef.map((c, j) => `${round(c, 3)}${j === 0 ? '' : j === 1 ? 'x' : 'x^{' + j + '}'}`).join(' + ').replace(/\+ -/g, '- ')}`
    };
  }
}

export const PRESETS = [
  { id: 'underfit', label: 'Bậc 0: đoán trung bình (dưới khớp)', state: { degree: 0 } },
  { id: 'good_fit', label: 'Bậc 1: đường thẳng ✅', state: { degree: 1 } },
  { id: 'overfit', label: 'Bậc 3: đi qua mọi điểm train ❌', state: { degree: 3 } }
];
