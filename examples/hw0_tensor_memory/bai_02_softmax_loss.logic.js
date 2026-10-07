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
      temperature: 1.0,
      isSafeMode: false
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
    const { logits, isSafeMode, temperature = 1.0 } = this.state;
    const T = Math.max(0.05, temperature); // Chống chia cho 0
    const [z0, z1] = logits;

    let p0, p1, formulaKaTeX;
    let isOverflow = false;

    if (!isSafeMode) {
      // Naive Softmax có tính cả hệ số nhiệt độ T: exp(z_i / T)
      const s0 = z0 / T;
      const s1 = z1 / T;
      const rawExp0 = Math.exp(s0);
      const rawExp1 = Math.exp(s1);
      const sum = rawExp0 + rawExp1;

      if (!isFinite(rawExp0) || !isFinite(rawExp1) || !isFinite(sum) || isNaN(sum)) {
        isOverflow = true;
        p0 = NaN;
        p1 = NaN;
        formulaKaTeX = `P_0 = \\frac{e^{${z0} / ${T.toFixed(1)}}}{e^{${z0} / ${T.toFixed(1)}} + e^{${z1} / ${T.toFixed(1)}}} = \\frac{\\infty}{\\infty} = \\text{NaN}`;
      } else {
        p0 = rawExp0 / sum;
        p1 = rawExp1 / sum;
        if (Math.abs(T - 1.0) < 0.01) {
          formulaKaTeX = `P_0 = \\frac{e^{${z0.toFixed(1)}}}{e^{${z0.toFixed(1)}} + e^{${z1.toFixed(1)}}} = ${(p0 * 100).toFixed(1)}\\%`;
        } else {
          formulaKaTeX = `P_0 = \\frac{e^{${z0.toFixed(1)} / ${T.toFixed(1)}}}{e^{${z0.toFixed(1)} / ${T.toFixed(1)}} + e^{${z1.toFixed(1)} / ${T.toFixed(1)}}} = \\frac{${rawExp0.toFixed(2)}}{${sum.toFixed(2)}} = ${(p0 * 100).toFixed(1)}\\%`;
        }
      }
    } else {
      // Safe Softmax có tính cả hệ số nhiệt độ T: exp((z_i - max(z)) / T)
      const maxZ = Math.max(z0, z1);
      const shift0 = (z0 - maxZ) / T;
      const shift1 = (z1 - maxZ) / T;
      const exp0 = Math.exp(shift0);
      const exp1 = Math.exp(shift1);
      const sum = exp0 + exp1;

      p0 = exp0 / sum;
      p1 = exp1 / sum;
      if (Math.abs(T - 1.0) < 0.01) {
        formulaKaTeX = `P_0 = \\frac{e^{${z0} - ${maxZ}}}{e^{${z0} - ${maxZ}} + e^{${z1} - ${maxZ}}} = \\frac{e^{${(z0 - maxZ).toFixed(1)}}}{${exp0.toFixed(2)} + ${exp1.toFixed(2)}} = ${(p0 * 100).toFixed(1)}\\%`;
      } else {
        formulaKaTeX = `P_0 = \\frac{e^{(${z0} - ${maxZ}) / ${T.toFixed(1)}}}{e^{(${z0} - ${maxZ}) / ${T.toFixed(1)}} + e^{(${z1} - ${maxZ}) / ${T.toFixed(1)}}} = \\frac{${exp0.toFixed(2)}}{${sum.toFixed(2)}} = ${(p0 * 100).toFixed(1)}\\%`;
      }
    }

    let verdict;
    if (isOverflow) {
      verdict = {
        type: 'danger',
        text: '💥 THẢM HỌA TRÀN SỐ! exp(z/T) = Infinity dẫn đến Softmax = NaN. Hệ thống tê liệt!'
      };
    } else if (isSafeMode && (z0 >= 500 || z1 >= 500)) {
      verdict = {
        type: 'success',
        text: '🛡️ Safe Softmax đã cứu nguy! Nhờ trừ max(z), số mũ <= 0 không bao giờ tràn số.'
      };
    } else if (T <= 0.3) {
      verdict = {
        type: 'success',
        text: `❄️ Nhiệt độ thấp (T = ${T.toFixed(1)}): Softmax tiệm cận ArgMax! Quyết định dứt khoát ${(p0 * 100).toFixed(1)}%.`
      };
    } else if (T >= 3.0) {
      verdict = {
        type: 'neutral',
        text: `🔥 Nhiệt độ cao (T = ${T.toFixed(1)}): Mọi chênh lệch bị san phẳng! Phân phối đều (~50% - 50%).`
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
      temperature: T,
      isSafeMode,
      isOverflow,
      p0,
      p1,
      formulaKaTeX,
      verdict
    };
  }
}

export const PRESETS = [
  { id: 'normal_logits', label: 'Điểm Số Chuẩn (z=[2, 1], T=1.0)', state: { logits: [2.0, 1.0], temperature: 1.0, isSafeMode: false } },
  { id: 'cold_temp', label: '❄️ Đóng Băng T=0.2 (ArgMax Quyết Đoán)', state: { logits: [2.0, 1.0], temperature: 0.2, isSafeMode: false } },
  { id: 'hot_temp', label: '🔥 Nóng Rực T=5.0 (San Phẳng Đều)', state: { logits: [2.0, 1.0], temperature: 5.0, isSafeMode: false } },
  { id: 'headlight_glare', label: '💥 Đèn Pha Tràn Số (1000, 1000)', state: { logits: [1000, 1000], temperature: 1.0, isSafeMode: false } },
  { id: 'safe_glare', label: '🛡️ Bật Safe Softmax (1000, 1000)', state: { logits: [1000, 1000], temperature: 1.0, isSafeMode: true } },
  { id: 'large_gap', label: 'Khoảng Cách Lớn (1000, 990)', state: { logits: [1000, 990], temperature: 1.0, isSafeMode: true } }
];
