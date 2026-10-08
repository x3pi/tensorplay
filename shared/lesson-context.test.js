import { describe, it, expect } from 'vitest';
import { getLessonSlug } from './lesson-context.js';

describe('shared/lesson-context.js', () => {
  it('lấy slug từ meta[name="tp-lesson"] nếu có', () => {
    const fakeWin = {
      document: {
        querySelector: (sel) => {
          if (sel === 'meta[name="tp-lesson"]') return { content: 'softmax_stability' };
          return null;
        }
      },
      location: { pathname: '/random/path/' }
    };
    expect(getLessonSlug(fakeWin)).toBe('softmax_stability');
  });

  it('lấy slug từ pathname dạng /lessons/<slug>/', () => {
    const fakeWin = {
      document: { querySelector: () => null },
      location: { pathname: '/lessons/robot_vision/' }
    };
    expect(getLessonSlug(fakeWin)).toBe('robot_vision');
  });

  it('lấy slug từ pathname dạng /lessons/<slug>/index.html', () => {
    const fakeWin = {
      document: { querySelector: () => null },
      location: { pathname: '/lessons/layernorm_residual/index.html' }
    };
    expect(getLessonSlug(fakeWin)).toBe('layernorm_residual');
  });

  it('trả về rỗng nếu không tìm thấy', () => {
    const fakeWin = {
      document: { querySelector: () => null },
      location: { pathname: '/' }
    };
    expect(getLessonSlug(fakeWin)).toBe('');
  });
});
