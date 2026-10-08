import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, attentionParams, ffnParams, blockParams, modelParams } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/transformer_block_params/logic.js', () => {
  it('d = 4, m = 4: attention 64, FFN 128, mỗi khối 192 = 12 d^2', () => {
    expect(attentionParams(4)).toBe(64);
    expect(ffnParams(4, 4)).toBe(128);
    expect(blockParams(4, 4)).toBe(192);
    expect(blockParams(4, 4)).toBe(12 * 16);
    const r = new LessonLogic().applyPreset(pick('toy'));
    expect(r.ffnShare).toBeCloseTo(2 / 3, 3);
    expect(r.body).toBe(384);
    expect(r.embed).toBe(40);
    expect(r.total).toBe(424);
  });

  it('m = 2: mỗi khối 8 d^2, FFN chỉ chiếm 50%', () => {
    const r = new LessonLogic().applyPreset(pick('narrow_ffn'));
    expect(r.block).toBe(8 * 16);
    expect(r.ffnShare).toBeCloseTo(0.5, 6);
    expect(r.verdict.type).toBe('warning');
  });

  it('GPT-2 small: thân 84 934 656 + embedding 38 597 376 ≈ 123.5 triệu tham số', () => {
    const p = modelParams({ d: 768, L: 12, m: 4, V: 50257 });
    expect(p.body).toBe(84934656);
    expect(p.embed).toBe(38597376);
    expect(p.total).toBe(123532032);
  });

  it('cỡ 7B: ≈ 6.57 tỉ tham số, 13.1 GB FP16, 105 GB huấn luyện (16 B/tham số), 13.1 GFLOPs/token', () => {
    const r = new LessonLogic().applyPreset(pick('seven_b'));
    expect(r.body).toBe(6442450944);
    expect(r.total).toBe(6573522944);
    expect(r.inferGB).toBeCloseTo(13.147, 3);
    expect(r.trainGB).toBeCloseTo(105.176, 3);
    expect(r.gflopsPerToken).toBeCloseTo(13.147, 3);
  });

  it('cỡ 70B: ≈ 64.7 tỉ tham số', () => {
    const r = new LessonLogic().applyPreset(pick('seventy_b'));
    expect(r.total).toBe(64_424_509_440 + 32000 * 8192);
    expect(r.total / 1e9).toBeCloseTo(64.69, 2);
  });
});
