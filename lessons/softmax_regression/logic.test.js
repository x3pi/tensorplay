import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS } from './logic.js';

describe('lessons/softmax_regression/logic.js', () => {
  it('Khởi tạo chuẩn: Forward, Softmax, Loss, G và ma trận gradient', () => {
    const logic = new LessonLogic();
    const st = logic.reset();

    // X = [2.0, 1.0], W = [[0,0],[0,0]], y=0, lr=0.1
    expect(st.z0).toBe(0);
    expect(st.z1).toBe(0);
    expect(st.p0).toBeCloseTo(0.5);
    expect(st.p1).toBeCloseTo(0.5);
    expect(st.loss).toBeCloseTo(Math.log(2), 3); // -ln(0.5) = ln(2) approx 0.693

    // Vector sai số dội ngược G = P - I_y (với y=0 => I_y = [1, 0])
    expect(st.g0).toBeCloseTo(-0.5);
    expect(st.g1).toBeCloseTo(0.5);
    expect(st.g0 + st.g1).toBeCloseTo(0.0); // Tổng lực kéo luôn triệt tiêu bằng 0

    // Gradient ma trận nabla_W = X^T * G
    // [[2*-0.5, 2*0.5], [1*-0.5, 1*0.5]] = [[-1.0, 1.0], [-0.5, 0.5]]
    expect(st.gradW00).toBeCloseTo(-1.0);
    expect(st.gradW01).toBeCloseTo(1.0);
    expect(st.gradW10).toBeCloseTo(-0.5);
    expect(st.gradW11).toBeCloseTo(0.5);
  });

  it('1 bước SGD step cập nhật trọng số đúng hướng giảm Loss', () => {
    const logic = new LessonLogic();
    logic.reset();
    const afterSgd = logic.stepSGD(1);

    // W_new = W - 0.1 * grad
    expect(afterSgd.w00).toBeCloseTo(0.1);
    expect(afterSgd.w01).toBeCloseTo(-0.1);
    expect(afterSgd.w10).toBeCloseTo(0.05);
    expect(afterSgd.w11).toBeCloseTo(-0.05);
    expect(afterSgd.stepCount).toBe(1);

    // Sau 1 bước, xác suất lớp đúng p0 phải tăng lên và loss phải giảm
    expect(afterSgd.p0).toBeGreaterThan(0.5);
    expect(afterSgd.loss).toBeLessThan(0.693);
  });

  it('Chuyển đổi sang nhãn y=1 (Đi Thẳng) đảo chiều lực kéo vector G', () => {
    const logic = new LessonLogic();
    logic.reset();
    const st = logic.onUserUpdate({ y: 1 });

    // Khi y=1, I_y = [0, 1]
    expect(st.g0).toBeCloseTo(0.5);   // Lớp 0 thừa 0.5 điểm
    expect(st.g1).toBeCloseTo(-0.5);  // Lớp 1 thiếu 0.5 điểm
    expect(st.targetName).toContain('Đi Thẳng');
  });

  it('Chạy 5 bước SGD liên tiếp giúp mô hình học rõ rệt (Loss giảm sâu)', () => {
    const logic = new LessonLogic();
    logic.reset();
    const initialLoss = logic.calculate().loss;
    const trained = logic.stepSGD(5);

    expect(trained.loss).toBeLessThan(initialLoss * 0.7);
    expect(trained.p0).toBeGreaterThan(0.7);
    expect(trained.stepCount).toBe(5);
  });

  it('Presets áp dụng đúng các trạng thái mô phỏng', () => {
    const logic = new LessonLogic();
    const highLossPreset = PRESETS.find(p => p.id === 'high_loss');
    const res = logic.applyPreset(highLossPreset.state);
    expect(res.loss).toBeGreaterThan(2.0); // Dự đoán sai nghiêm trọng
    expect(res.p0).toBeLessThan(0.15);
  });
});
