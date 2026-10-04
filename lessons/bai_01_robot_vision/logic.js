/**
 * Logic Module for Bài 1: Tự Chế Tạo 'Mắt' Cho Robot
 * Implements mathematical dot product, 2-class softmax competition, and memory telemetry.
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      pixels: [1, 1, 0, 0],
      weights: [1, 1, -1, -1],
      activeCell: { row: 0, col: 0, index: 0 },
      threshold: 1.0
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
    const { pixels, weights, activeCell } = this.state;

    // 1. Calculate Dot Product for Horizontal detector Z_horizontal
    const zHoriz = pixels.reduce((sum, p, i) => sum + p * weights[i], 0);

    // 2. Fixed weights for competing Vertical detector: [1, -1, 1, -1]
    const verticalWeights = [1, -1, 1, -1];
    const zVert = pixels.reduce((sum, p, i) => sum + p * verticalWeights[i], 0);

    // 3. Safe Softmax between Horizontal and Vertical logits
    const maxZ = Math.max(zHoriz, zVert);
    const expHoriz = Math.exp(zHoriz - maxZ);
    const expVert = Math.exp(zVert - maxZ);
    const sumExp = expHoriz + expVert;
    const probHoriz = sumExp > 0 ? (expHoriz / sumExp) : 0.5;
    const probVert = sumExp > 0 ? (expVert / sumExp) : 0.5;

    // 4. Construct KaTeX formula string
    const pStr = pixels.map(p => Number.isInteger(p) ? p.toString() : p.toFixed(1));
    const wStr = weights.map(w => w >= 0 ? `+${w}` : `${w}`);
    const terms = pixels.map((p, i) => {
      const pVal = Number.isInteger(p) ? p : p.toFixed(1);
      return `(${pVal} \\times ${wStr[i]})`;
    }).join(' + ');

    const formulaKaTeX = `Z = \\sum_{i=0}^{3} x_i w_i = ${terms} = ${zHoriz.toFixed(1)}`;

    // 5. Build Verdict
    let verdict = { type: 'neutral', text: 'Chưa đủ dữ liệu để phân loại' };
    const allOn = pixels.every(p => p >= 0.9);

    if (allOn && zHoriz === 0) {
      verdict = {
        type: 'success',
        text: '🛡️ Đèn pha chói lóa bị triệt tiêu hoàn hảo: Z = 0.0 (Không phanh nhầm!)'
      };
    } else if (zHoriz >= 1.5 && zHoriz > zVert) {
      verdict = {
        type: 'success',
        text: `🛑 Phát hiện BIỂN DỪNG (Gạch Ngang) với độ tin cậy ${(probHoriz * 100).toFixed(0)}%`
      };
    } else if (zVert >= 1.5 && zVert > zHoriz) {
      verdict = {
        type: 'warning',
        text: `⬆️ Phát hiện BIỂN ĐI THẲNG (Gạch Dọc) với độ tin cậy ${(probVert * 100).toFixed(0)}%`
      };
    } else if (zHoriz > 0.5) {
      verdict = {
        type: 'neutral',
        text: `⚠️ Khớp một phần với Biển Dừng (Z = ${zHoriz.toFixed(1)})`
      };
    } else {
      verdict = {
        type: 'neutral',
        text: '🔍 Không phát hiện biển báo rõ ràng (Z thấp)'
      };
    }

    // 6. Score items for probability bar
    const scoreItems = [
      {
        label: 'Khuôn Biển Dừng (Gạch Ngang)',
        score: zHoriz,
        prob: probHoriz,
        isTarget: zHoriz >= zVert
      },
      {
        label: 'Khuôn Đi Thẳng (Gạch Dọc)',
        score: zVert,
        prob: probVert,
        isTarget: zVert > zHoriz
      }
    ];

    // 7. Memory data for C++ visualizer
    const memoryData = {
      arrayName: 'X_flat',
      cells: pixels,
      activeOffset: activeCell?.index !== undefined ? activeCell.index : 0,
      row: activeCell?.row !== undefined ? activeCell.row : 0,
      col: activeCell?.col !== undefined ? activeCell.col : 0,
      colsTotal: 2,
      baseAddress: '0x7ffd90a0'
    };

    return {
      score: zHoriz,
      scoreVertical: zVert,
      probHorizontal: probHoriz,
      probVertical: probVert,
      formulaKaTeX,
      scoreItems,
      verdict,
      memoryData,
      isCorrect: zHoriz >= 1.5 || (allOn && zHoriz === 0)
    };
  }
}
