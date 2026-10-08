import { describe, it, expect } from 'vitest';
import { LessonLogic, PRESETS, kvBytesPerToken, kvProjParams } from './logic.js';

const pick = (id) => PRESETS.find(p => p.id === id).state;

describe('lessons/gqa_kv_cache/logic.js', () => {
  it('KV mỗi token: MHA 2 621 440 B (2.5 MiB), GQA-8 327 680 B (320 KiB), MQA 40 960 B (40 KiB)', () => {
    expect(kvBytesPerToken(64)).toBe(2621440);
    expect(kvBytesPerToken(8)).toBe(327680);
    expect(kvBytesPerToken(1)).toBe(40960);
  });

  it('chuỗi 4096 token: MHA 10 GiB, GQA 1.25 GiB, MQA 0.15625 GiB', () => {
    const a = new LessonLogic().applyPreset(pick('mha'));
    const b = new LessonLogic().applyPreset(pick('gqa8'));
    const c = new LessonLogic().applyPreset(pick('mqa'));
    expect([a.perSeqGiB, b.perSeqGiB, c.perSeqGiB]).toEqual([10, 1.25, 0.1563]);
    expect(b.reduction).toBe(8);
    expect(c.reduction).toBe(64);
  });

  it('batch 16 x 4096 token: MHA 160 GiB > trọng số 130 GiB (danger), GQA 20 GiB, MQA 2.5 GiB', () => {
    const a = new LessonLogic().applyPreset(pick('mha'));
    expect(a.batchGiB).toBe(160);
    expect(a.batchGiB).toBeGreaterThan(a.weightsGiB);
    expect(a.verdict.type).toBe('danger');
    expect(new LessonLogic().applyPreset(pick('gqa8')).batchGiB).toBe(20);
    expect(new LessonLogic().applyPreset(pick('mqa')).batchGiB).toBe(2.5);
  });

  it('ngân sách 40 GiB chứa được 4 / 32 / 256 chuỗi 4096 token (MHA / GQA / MQA)', () => {
    expect(new LessonLogic().applyPreset(pick('mha')).maxSeqs).toBe(4);
    expect(new LessonLogic().applyPreset(pick('gqa8')).maxSeqs).toBe(32);
    expect(new LessonLogic().applyPreset(pick('mqa')).maxSeqs).toBe(256);
  });

  it('tham số W_K, W_V: MHA 10 737 418 240, GQA-8 1 342 177 280 (tiết kiệm 9.4 tỉ)', () => {
    expect(kvProjParams(64)).toBe(10737418240);
    expect(kvProjParams(8)).toBe(1342177280);
    expect(new LessonLogic().applyPreset(pick('gqa8')).projSavedParams).toBe(10737418240 - 1342177280);
  });
});
