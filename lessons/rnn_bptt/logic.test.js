import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, simulateRNN, CLIP_THRESHOLD } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/rnn_bptt/logic.js', () => {
  it('Linear RNN w=0.5, T=10: gradient dội về x1 = 0.5^9 ≈ 0.001953', () => {
    const res = simulateRNN({ w: 0.5, T: 10, mode: 'linear', clipping: false });
    expect(res.rawGradX1).toBeCloseTo(Math.pow(0.5, 9), 6);
    expect(res.isClipped).toBe(false);
  });

  it('Linear RNN w=1.5, T=10: gradient bùng nổ 1.5^9 ≈ 38.443', () => {
    const res = simulateRNN({ w: 1.5, T: 10, mode: 'linear', clipping: false });
    expect(res.rawGradX1).toBeCloseTo(Math.pow(1.5, 9), 2);
  });

  it('Linear RNN bùng nổ được kìm hãm khi bật Gradient Clipping', () => {
    const res = simulateRNN({ w: 1.5, T: 10, mode: 'linear', clipping: true });
    expect(res.isClipped).toBe(true);
    expect(res.finalGradX1).toBe(CLIP_THRESHOLD);
  });

  it('LSTM highway với f=0.95 giữ gradient cao sau 10 bước: 0.95^9 ≈ 0.63', () => {
    const res = simulateRNN({ w: 1.0, T: 10, mode: 'lstm_highway', clipping: false });
    expect(res.rawGradX1).toBeCloseTo(Math.pow(0.95, 9), 3);
  });

  it('LessonLogic calculate trả về đúng trạng thái và verdict cho các preset', () => {
    const logic = new LessonLogic();
    const r1 = logic.applyPreset(pick('vanish_linear'));
    expect(r1.status).toBe('vanishing');
    expect(r1.verdict.type).toBe('danger');

    const r2 = logic.applyPreset(pick('explode_linear'));
    expect(r2.status).toBe('exploding');
    expect(r2.verdict.type).toBe('danger');

    const r3 = logic.applyPreset(pick('clipped_explode'));
    expect(r3.isClipped).toBe(true);
    expect(r3.verdict.type).toBe('warning');

    const r4 = logic.applyPreset(pick('lstm_highway'));
    expect(r4.verdict.type).toBe('success');
  });
});
