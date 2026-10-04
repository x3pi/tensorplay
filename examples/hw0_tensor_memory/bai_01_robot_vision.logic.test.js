import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS } from './bai_01_robot_vision.logic.js';

describe('examples/hw0_tensor_memory/bai_01_robot_vision.logic.js', () => {
  it('Khởi tạo mặc định cho điểm số chuẩn Z = 2.0', () => {
    const logic = new LessonLogic();
    const result = logic.calculate();
    expect(result.score).toBe(2.0);
    expect(result.probHorizontal).toBeGreaterThan(0.85);
  });

  it('Đèn pha chói lóa bị trọng số âm triệt tiêu hoàn toàn về 0', () => {
    const logic = new LessonLogic();
    const glarePreset = PRESETS.find(p => p.id === 'headlight_glare');
    expect(glarePreset).toBeDefined();

    const result = logic.applyPreset(glarePreset.state);
    expect(result.score).toBe(0);
    expect(result.verdict.text).toContain('triệt tiêu hoàn hảo');
  });

  it('Ảnh dính bụi 0.5 vẫn giữ điểm số Z = 1.5 vượt ngưỡng phát hiện', () => {
    const logic = new LessonLogic();
    const dustyPreset = PRESETS.find(p => p.id === 'dusty_sign');
    const result = logic.applyPreset(dustyPreset.state);
    expect(result.score).toBe(1.5);
  });

  it('Khuôn dọc chiến thắng khi gặp ảnh gạch dọc', () => {
    const logic = new LessonLogic();
    const verticalPreset = PRESETS.find(p => p.id === 'vertical_sign');
    const result = logic.applyPreset(verticalPreset.state);
    expect(result.score).toBe(0);
    expect(result.scoreVertical).toBe(2);
    expect(result.probVertical).toBeGreaterThan(0.85);
  });
});
