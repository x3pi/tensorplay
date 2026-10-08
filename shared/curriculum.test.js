import { describe, it, expect, beforeEach } from 'vitest';
import {
  setCatalog,
  getLesson,
  getPath,
  getPathLessons,
  positionIn,
  neighbors,
  resolveRefs
} from './curriculum.js';

describe('shared/curriculum.js', () => {
  const sampleCatalog = {
    lessons: {
      robot_vision: {
        id: 'robot_vision',
        title: 'Robot Vision & Vector Dot Product — Tích Vô Hướng & Nhận Diện Biển Báo',
        topic: 'foundations'
      },
      softmax_stability: {
        id: 'softmax_stability',
        title: 'Softmax & Ổn Định Số Học — Xử Lý Lóa Sáng & Tràn Số',
        topic: 'foundations'
      },
      self_attention: {
        id: 'self_attention',
        title: 'Self-Attention — Cơ Chế Tự Chú Ý Trong Transformer',
        topic: 'transformer'
      }
    },
    topics: [
      { id: 'foundations', label: 'Nền tảng Tensor' },
      { id: 'transformer', label: 'Transformer' }
    ],
    paths: [
      {
        id: 'main',
        title: 'Lộ trình đầy đủ',
        sections: [
          {
            title: 'Chặng 1',
            lessons: ['robot_vision', 'softmax_stability']
          },
          {
            title: 'Chặng 2',
            lessons: ['self_attention']
          }
        ]
      },
      {
        id: 'short',
        title: 'Rút gọn',
        sections: [
          {
            title: 'Chặng duy nhất',
            lessons: ['robot_vision', 'self_attention']
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    setCatalog(sampleCatalog);
  });

  it('lấy lesson bằng getLesson(slug)', () => {
    const l = getLesson('robot_vision');
    expect(l).not.toBeNull();
    expect(l.id).toBe('robot_vision');
  });

  it('lấy path bằng getPath(id)', () => {
    const p = getPath('main');
    expect(p).not.toBeNull();
    expect(p.title).toBe('Lộ trình đầy đủ');
  });

  it('tính đúng vị trí positionIn() theo lộ trình', () => {
    const pos = positionIn('softmax_stability', 'main');
    expect(pos).toEqual({
      index: 2,
      total: 3,
      sectionTitle: 'Chặng 1'
    });

    const pos2 = positionIn('softmax_stability', 'short');
    expect(pos2).toBeNull();
  });

  it('tính đúng láng giềng neighbors() theo lộ trình', () => {
    const nb1 = neighbors('robot_vision', 'main');
    expect(nb1.prev).toBeNull();
    expect(nb1.next.id).toBe('softmax_stability');
    expect(nb1.currentPosition.index).toBe(1);
    expect(nb1.currentPosition.total).toBe(3);

    const nb2 = neighbors('softmax_stability', 'main');
    expect(nb2.prev.id).toBe('robot_vision');
    expect(nb2.next.id).toBe('self_attention');

    // Trong lộ trình short, láng giềng của robot_vision là self_attention (bỏ qua softmax)
    const nbShort = neighbors('robot_vision', 'short');
    expect(nbShort.next.id).toBe('self_attention');
  });

  it('thay thế tham chiếu resolveRefs()', () => {
    const raw = 'Xem bài [[lesson:robot_vision]] và bài [[lesson:self_attention]].';
    const resolved = resolveRefs(raw);
    expect(resolved).toBe('Xem bài «Robot Vision & Vector Dot Product» và bài «Self-Attention».');
  });

  it('resolveRefs() rơi về slug an toàn khi bài không tồn tại', () => {
    const raw = 'Xem bài [[lesson:unknown_lesson]].';
    const resolved = resolveRefs(raw);
    expect(resolved).toBe('Xem bài «unknown_lesson».');
  });
});
