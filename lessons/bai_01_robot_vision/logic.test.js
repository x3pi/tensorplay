import { describe, it, expect } from 'vitest';
import { LessonLogic } from './logic.js';
import manifest from './manifest.json';

describe('Bài 1: Logic Robot Vision & Mathematical Verification', () => {
  it('Khởi tạo trạng thái mặc định cho kết quả chuẩn Z = 2.0', () => {
    const logic = new LessonLogic();
    const result = logic.calculate();

    expect(result.score).toBe(2.0);
    expect(result.scoreVertical).toBe(0.0);
    expect(result.probHorizontal).toBeGreaterThan(0.85);
    expect(result.isCorrect).toBe(true);
  });

  it('Preset Ảnh Chuẩn (Gạch Ngang) nhận điểm số tuyệt đối 2.0', () => {
    const logic = new LessonLogic();
    const preset = manifest.presets.find(p => p.id === 'horizontal_sign');
    expect(preset).toBeDefined();

    const result = logic.applyPreset(preset.state);
    expect(result.score).toBe(2.0);
    expect(result.verdict.type).toBe('success');
  });

  it('Preset Ảnh Dính Bụi: Bụi mờ 0.5 vẫn giữ điểm số Z = 1.5 > ngưỡng', () => {
    const logic = new LessonLogic();
    const preset = manifest.presets.find(p => p.id === 'dusty_sign');
    expect(preset).toBeDefined();

    const result = logic.applyPreset(preset.state);
    // 1*1 + 1*1 + 0.5*(-1) + 0*(-1) = 2.0 - 0.5 = 1.5
    expect(result.score).toBe(1.5);
    expect(result.verdict.type).toBe('success');
  });

  it('Preset Đèn Pha Chói Lóa: Trọng số âm triệt tiêu hoàn toàn điểm số về 0.0', () => {
    const logic = new LessonLogic();
    const preset = manifest.presets.find(p => p.id === 'headlight_glare');
    expect(preset).toBeDefined();

    const result = logic.applyPreset(preset.state);
    // 1*1 + 1*1 + 1*(-1) + 1*(-1) = 0.0
    expect(result.score).toBe(0.0);
    expect(result.isCorrect).toBe(true);
    expect(result.verdict.text).toContain('triệt tiêu hoàn hảo');
  });

  it('Khi chỉ dùng trọng số dương, Đèn Pha bị đánh lừa nhận nhầm thành 2.0', () => {
    const logic = new LessonLogic();
    logic.onUserUpdate({
      pixels: [1, 1, 1, 1],
      weights: [1, 1, 0, 0] // Chưa có trọng số âm
    });

    const result = logic.calculate();
    // 1*1 + 1*1 + 1*0 + 1*0 = 2.0 -> Nguy hiểm!
    expect(result.score).toBe(2.0);
  });

  it('Preset Ảnh Gạch Dọc: Khuôn Dọc chiến thắng Khuôn Ngang', () => {
    const logic = new LessonLogic();
    const preset = manifest.presets.find(p => p.id === 'vertical_sign');
    expect(preset).toBeDefined();

    const result = logic.applyPreset(preset.state);
    expect(result.score).toBe(0.0); // Z_horizontal = 0
    expect(result.scoreVertical).toBe(2.0); // Z_vertical = 2
    expect(result.probVertical).toBeGreaterThan(0.85);
    expect(result.verdict.text).toContain('BIỂN ĐI THẲNG');
  });

  it('Kiểm chứng công thức Memory Offset 1D C++ (Row-major)', () => {
    const logic = new LessonLogic();
    const N = 2; // cols total

    const testCoords = [
      { r: 0, c: 0, expectedIndex: 0 },
      { r: 0, c: 1, expectedIndex: 1 },
      { r: 1, c: 0, expectedIndex: 2 },
      { r: 1, c: 1, expectedIndex: 3 }
    ];

    testCoords.forEach(({ r, c, expectedIndex }) => {
      logic.onUserUpdate({ activeCell: { row: r, col: c, index: r * N + c } });
      const result = logic.calculate();
      expect(result.memoryData.activeOffset).toBe(expectedIndex);
      expect(result.memoryData.activeOffset).toBe(r * N + c);
    });
  });

  it('Kiểm tra an toàn cú pháp KaTeX trong manifest (Không chứa bare _ trong math)', () => {
    const checkText = (text) => {
      if (!text) return;
      // Find math segments $...$
      const mathMatches = text.match(/\$([^\$]+)\$/g);
      if (mathMatches) {
        mathMatches.forEach(m => {
          // Check for triple underscores or invalid underscores that cause KaTeX parse errors
          expect(m).not.toMatch(/_{3,}/);
          expect(m).not.toMatch(/\\text\{_+\}/);
        });
      }
    };

    manifest.steps.forEach(step => {
      checkText(step.problem);
      checkText(step.challenge);
      checkText(step.takeaway);
    });
  });
});
