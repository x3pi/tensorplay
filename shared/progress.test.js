import { describe, it, expect, beforeEach } from 'vitest';
import {
  getProgress,
  saveLessonProgress,
  markCompleted,
  isLessonCompleted,
  resetAllProgress,
  resolveLessonKey
} from './progress.js';

describe('Progress Storage', () => {
  beforeEach(() => {
    const store = {};
    global.localStorage = {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = v; },
      removeItem: (k) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    };
  });

  it('resolves legacy aliases to canonical slugs', () => {
    expect(resolveLessonKey('bai_01')).toBe('robot_vision');
    expect(resolveLessonKey('bai_01_robot_vision')).toBe('robot_vision');
    expect(resolveLessonKey('/examples/hw0_tensor_memory/bai_01_robot_vision.html')).toBe('robot_vision');
    expect(resolveLessonKey('robot_vision')).toBe('robot_vision');
    expect(resolveLessonKey('flash_attention')).toBe('flash_attention');
  });

  it('saves and marks completed with canonical slug', () => {
    expect(isLessonCompleted('robot_vision')).toBe(false);
    markCompleted('robot_vision', true);
    expect(isLessonCompleted('robot_vision')).toBe(true);
    expect(getProgress()['robot_vision']?.completed).toBe(true);
  });

  it('reads legacy completed progress and migrates to canonical slug', () => {
    // Simulate legacy storage containing bai_01: { completed: true }
    global.localStorage.setItem('tensorplay:progress', JSON.stringify({
      bai_01: { completed: true }
    }));

    // Checking canonical slug should return true and migrate
    expect(isLessonCompleted('robot_vision')).toBe(true);
    expect(getProgress()['robot_vision']?.completed).toBe(true);
  });

  it('resets progress cleanly', () => {
    markCompleted('robot_vision', true);
    resetAllProgress();
    expect(isLessonCompleted('robot_vision')).toBe(false);
  });
});
