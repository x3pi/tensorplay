/**
 * Logic Module for Bài 01: Robot Vision & Vector Dot Product
 * Path: examples/hw0_tensor_memory/bai_01_robot_vision.logic.js
 */

import { dot, safeSoftmax, offset2D } from '../../shared/math.js';

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      pixels: [1, 1, 0, 0],
      weights: [1, 1, -1, -1],
      verticalWeights: [1, -1, 1, -1],
      activeTemplate: 'horizontal', // 'horizontal' | 'vertical'
      activeIndex: 0
    };
    return this.calculate();
  }

  applyPreset(presetState) {
    this.state = {
      ...this.state,
      ...presetState
    };
    return this.calculate();
  }

  onUserUpdate(partialState) {
    this.state = {
      ...this.state,
      ...partialState
    };
    return this.calculate();
  }

  calculate() {
    const { pixels, activeIndex, activeTemplate = 'horizontal' } = this.state;
    const weights = this.state.weights || [1, 1, -1, -1];
    const verticalWeights = this.state.verticalWeights || [1, -1, 1, -1];

    // 1. Dot product with horizontal template W_ngang
    const score = dot(pixels, weights);

    // 2. Competing vertical detector: W_vertical = [1, -1, 1, -1]
    const scoreVertical = dot(pixels, verticalWeights);

    // 3. Safe Softmax probabilities
    const probs = safeSoftmax([score, scoreVertical]);
    const probHorizontal = probs[0];
    const probVertical = probs[1];

    // 4. Construct KaTeX formula strings for both templates
    const termsHoriz = pixels.map((p, i) => {
      const pStr = Number.isInteger(p) ? p.toString() : p.toFixed(1);
      const wStr = weights[i] >= 0 ? `+${weights[i]}` : `${weights[i]}`;
      return `(${pStr} \\times ${wStr})`;
    }).join(' + ');

    const termsVert = pixels.map((p, i) => {
      const pStr = Number.isInteger(p) ? p.toString() : p.toFixed(1);
      const wStr = verticalWeights[i] >= 0 ? `+${verticalWeights[i]}` : `${verticalWeights[i]}`;
      return `(${pStr} \\times ${wStr})`;
    }).join(' + ');

    const formulaKaTeXHoriz = `Z_{\\text{ngang}} = \\sum x_i w_i = ${termsHoriz} = ${score.toFixed(1)}`;
    const formulaKaTeXVert = `Z_{\\text{dọc}} = \\sum x_i w_i = ${termsVert} = ${scoreVertical.toFixed(1)}`;
    const formulaMatrixKaTeX = `Z = X \\cdot W = [Z_{\\text{ngang}}, \\; Z_{\\text{dọc}}] = [${score.toFixed(1)}, \\; ${scoreVertical.toFixed(1)}]`;

    // Active formula matches currently selected template
    const formulaKaTeX = activeTemplate === 'vertical' ? formulaKaTeXVert : formulaKaTeXHoriz;

    // 5. Verdict
    const allGlare = pixels.every(p => p >= 0.9);
    let verdict = { type: 'neutral', text: 'Chưa đủ dữ liệu để phân loại' };

    if (allGlare && score === 0) {
      verdict = {
        type: 'success',
        text: '🛡️ Đèn pha chói lóa bị triệt tiêu hoàn hảo: Z = 0.0 (Không phanh nhầm!)'
      };
    } else if (score >= 1.5 && score > scoreVertical) {
      verdict = {
        type: 'success',
        text: `🛑 Nhận diện BIỂN DỪNG (Gạch Ngang) • Điểm Z = +${score.toFixed(1)} (Vượt ngưỡng an toàn > 1.0)`
      };
    } else if (scoreVertical >= 1.5 && scoreVertical > score) {
      verdict = {
        type: 'warning',
        text: `⬆️ Nhận diện BIỂN ĐI THẲNG (Gạch Dọc) • Điểm Z = +${scoreVertical.toFixed(1)} (Vượt ngưỡng an toàn > 1.0)`
      };
    } else if (score > 0.5) {
      verdict = {
        type: 'neutral',
        text: `⚠️ Khớp một phần với Biển Dừng (Z = ${score.toFixed(1)} <= 1.0)`
      };
    }

    return {
      score,
      scoreVertical,
      probHorizontal,
      probVertical,
      weightsHorizontal: [...weights],
      weightsVertical: [...verticalWeights],
      activeTemplate,
      formulaKaTeX,
      formulaKaTeXHoriz,
      formulaKaTeXVert,
      formulaMatrixKaTeX,
      verdict,
      memoryCells: [...pixels],
      activeOffset: activeIndex,
      isCorrect: score >= 1.5 || (allGlare && score === 0)
    };
  }
}

export const PRESETS = [
  { id: 'horizontal_sign', label: 'Ảnh Chuẩn (Gạch Ngang)', state: { pixels: [1, 1, 0, 0] } },
  { id: 'dusty_sign', label: 'Ảnh Dính Bụi', state: { pixels: [1, 1, 0.5, 0] } },
  { id: 'headlight_glare', label: 'Đèn Pha Chói Lóa', state: { pixels: [1, 1, 1, 1] } },
  { id: 'vertical_sign', label: 'Ảnh Gạch Dọc', state: { pixels: [1, 0, 1, 0] } }
];
