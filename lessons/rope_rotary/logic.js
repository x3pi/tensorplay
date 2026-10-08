/**
 * RoPE — Mã Hóa Vị Trí Bằng Phép Xoay: Điểm Chú Ý Chỉ Phụ Thuộc Khoảng Cách
 * Path: lessons/rope_rotary/logic.js
 *
 * Query q = [1, 0] ở vị trí m, Key k = [1, 0] ở vị trí n; góc xoay mỗi bước là theta.
 *   RoPE    : q' = R(m*theta) q,  k' = R(n*theta) k   =>  q'.k' = cos((m - n) * theta)   (chỉ phụ thuộc m - n)
 *   Cộng PE : q'' = q + PE(m), k'' = k + PE(n), PE(p) = [sin(p*theta), cos(p*theta)]
 *             => q''.k'' KHÔNG chỉ phụ thuộc m - n.
 * Dịch cả hai vị trí thêm s (cùng một câu nhưng bắt đầu muộn hơn trong ngữ cảnh) kiểm tra tính "tương đối".
 */

export const Q = [1, 0];
export const K = [1, 0];

const clean = (v) => Math.round(v * 1e12) / 1e12 + 0;
const round = (v, n = 4) => Number(v.toFixed(n)) + 0;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const rad = (deg) => (deg * Math.PI) / 180;

export function rotate(v, angleRad) {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return [clean(v[0] * c - v[1] * s), clean(v[0] * s + v[1] * c)];
}

export function ropeScore(m, n, thetaDeg, q = Q, k = K) {
  return clean(dot(rotate(q, rad(m * thetaDeg)), rotate(k, rad(n * thetaDeg))));
}

export function addScore(m, n, thetaDeg, q = Q, k = K) {
  const pe = (p) => [Math.sin(rad(p * thetaDeg)), Math.cos(rad(p * thetaDeg))];
  const qa = [q[0] + pe(m)[0], q[1] + pe(m)[1]];
  const ka = [k[0] + pe(n)[0], k[1] + pe(n)[1]];
  return clean(dot(qa, ka));
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { m: 3, n: 1, thetaDeg: 90, shift: 0 };
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
    const { m, n, thetaDeg, shift } = this.state;
    const m2 = m + shift;
    const n2 = n + shift;
    const rope1 = ropeScore(m, n, thetaDeg);
    const rope2 = ropeScore(m2, n2, thetaDeg);
    const add1 = addScore(m, n, thetaDeg);
    const add2 = addScore(m2, n2, thetaDeg);
    const qRot = rotate(Q, rad(m * thetaDeg));
    const kRot = rotate(K, rad(n * thetaDeg));
    const diff = m - n;
    const ropeInvariant = Math.abs(rope1 - rope2) < 1e-9;
    const addInvariant = Math.abs(add1 - add2) < 1e-9;
    const curve = Array.from({ length: 9 }, (_, d) => ({ diff: d, score: round(clean(Math.cos(rad(d * thetaDeg))), 4) }));

    let verdict;
    if (shift === 0) {
      verdict = {
        type: 'success',
        text: `✅ Khoảng cách m − n = ${diff}: RoPE cho điểm cos(${diff} × ${thetaDeg}°) = ${round(rope1)}. Hãy dịch cả hai vị trí (thanh "dịch") để so sánh với cách cộng PE.`
      };
    } else if (ropeInvariant && !addInvariant) {
      verdict = {
        type: 'success',
        text: `✅ Dịch cả hai vị trí thêm ${shift}: RoPE giữ nguyên ${round(rope1)} → ${round(rope2)} (chỉ phụ thuộc m − n = ${diff}), còn cách cộng PE đổi ${round(add1)} → ${round(add2)}.`
      };
    } else if (ropeInvariant && addInvariant) {
      verdict = {
        type: 'warning',
        text: `⚠️ Với góc ${thetaDeg}° và dịch ${shift}, cả hai cách tình cờ cho cùng kết quả (chu kỳ lặp). Thử dịch khác đi.`
      };
    } else {
      verdict = { type: 'danger', text: '❌ RoPE không còn bất biến theo dịch: kiểm tra lại tính toán.' };
    }

    return {
      m, n, thetaDeg, shift, m2, n2, diff,
      qRot, kRot,
      rope1: round(rope1, 6), rope2: round(rope2, 6),
      add1: round(add1, 6), add2: round(add2, 6),
      ropeInvariant, addInvariant,
      curve,
      verdict,
      formulaKaTeX: `q'_m \\cdot k'_n = (R_{m\\theta} q)\\cdot(R_{n\\theta} k) = q^\\top R_{(n-m)\\theta}\\, k = \\cos\\big((m-n)\\theta\\big) = \\cos(${diff} \\times ${thetaDeg}^\\circ) = ${round(rope1)}`
    };
  }
}

export const PRESETS = [
  { id: 'quarter_turn', label: 'Xoay 90° mỗi vị trí', state: { m: 3, n: 1, thetaDeg: 90, shift: 0 } },
  { id: 'shift_invariance', label: 'Dịch cả hai thêm 2 (45°) ✅', state: { m: 3, n: 1, thetaDeg: 45, shift: 2 } },
  { id: 'eighth_turn', label: 'Xoay 45° mỗi vị trí', state: { m: 3, n: 1, thetaDeg: 45, shift: 0 } },
  { id: 'slow_rotation', label: 'Xoay chậm 30° (phạm vi dài hơn)', state: { m: 4, n: 1, thetaDeg: 30, shift: 0 } }
];
