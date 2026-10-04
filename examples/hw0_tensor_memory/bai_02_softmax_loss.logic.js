/**
 * Logic Module for Bài 02: Softmax & Cơn Ác Mộng Lóa Sáng
 * Path: examples/hw0_tensor_memory/bai_02_softmax_loss.logic.js
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      logits: [2.0, 1.0],
      isSafeMode: false,
      targetClass: 0 // 0: Dừng xe, 1: Đi tiếp
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
    const { logits, isSafeMode, targetClass } = this.state;
    const [z0, z1] = logits;

    let p0, p1, rawExp0, rawExp1, formulaKaTeX;
    let isOverflow = false;

    if (!isSafeMode) {
      // Naive Softmax (có thể tràn số nếu z > 709 trong JS)
      rawExp0 = Math.exp(z0);
      rawExp1 = Math.exp(z1);
      const sum = rawExp0 + rawExp1;

      if (!isFinite(rawExp0) || !isFinite(rawExp1) || !isFinite(sum) || isNaN(sum)) {
        isOverflow = true;
        p0 = NaN;
        p1 = NaN;
        formulaKaTeX = `P_0 = \\frac{e^{${z0}}}{e^{${z0}} + e^{${z1}}} = \\frac{\\infty}{\\infty} = \\text{NaN}`;
      } else {
        p0 = rawExp0 / sum;
        p1 = rawExp1 / sum;
        formulaKaTeX = `P_0 = \\frac{e^{${z0.toFixed(1)}}}{e^{${z0.toFixed(1)}} + e^{${z1.toFixed(1)}}} = ${(p0 * 100).toFixed(1)}\\%`;
      }
    } else {
      // Safe Softmax: Trừ max(z)
      const maxZ = Math.max(z0, z1);
      const shift0 = z0 - maxZ;
      const shift1 = z1 - maxZ;
      const exp0 = Math.exp(shift0);
      const exp1 = Math.exp(shift1);
      const sum = exp0 + exp1;

      p0 = exp0 / sum;
      p1 = exp1 / sum;
      formulaKaTeX = `P_0 = \\frac{e^{${z0} - ${maxZ}}}{e^{${z0} - ${maxZ}} + e^{${z1} - ${maxZ}}} = \\frac{e^{${shift0.toFixed(1)}}}{${exp0.toFixed(2)} + ${exp1.toFixed(2)}} = ${(p0 * 100).toFixed(1)}\\%`;
    }

    // Cross-Entropy Loss: -log(p_target)
    const pTarget = targetClass === 0 ? p0 : p1;
    let loss;
    if (isNaN(pTarget)) {
      loss = NaN;
    } else if (pTarget <= 0) {
      loss = Infinity;
    } else {
      loss = -Math.log(Math.max(1e-15, pTarget));
    }

    let verdict;
    if (isOverflow) {
      verdict = {
        type: 'danger',
        text: '💥 THẢM HỌA TRÀN SỐ! exp(z) = Infinity dẫn đến Softmax = NaN. Hệ thống tê liệt!'
      };
    } else if (isSafeMode && (z0 >= 500 || z1 >= 500)) {
      verdict = {
        type: 'success',
        text: '🛡️ Safe Softmax đã cứu nguy! Nhờ trừ max(z), số mũ <= 0 không bao giờ tràn số.'
      };
    } else if (p0 > 0.8) {
      verdict = {
        type: 'success',
        text: `🛑 Phân loại tự tin: Lớp 0 (Biển Dừng) với xác suất ${(p0 * 100).toFixed(1)}%`
      };
    } else {
      verdict = {
        type: 'neutral',
        text: `🔍 Phân vân giữa 2 lớp: P0 = ${(p0 * 100).toFixed(0)}%, P1 = ${(p1 * 100).toFixed(0)}%`
      };
    }

    return {
      logits,
      isSafeMode,
      isOverflow,
      p0,
      p1,
      loss,
      formulaKaTeX,
      verdict
    };
  }
}

export const PRESETS = [
  { id: 'normal_logits', label: 'Điểm Số Bình Thường (2.0, 1.0)', state: { logits: [2.0, 1.0], isSafeMode: false } },
  { id: 'headlight_glare', label: 'Đèn Pha Tràn Số (1000, 1000)', state: { logits: [1000, 1000], isSafeMode: false } },
  { id: 'safe_glare', label: 'Bật Safe Softmax (1000, 1000)', state: { logits: [1000, 1000], isSafeMode: true } },
  { id: 'large_gap', label: 'Khoảng Cách Lớn (1000, 990)', state: { logits: [1000, 990], isSafeMode: true } }
];
