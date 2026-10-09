import { describe, it, expect } from 'vitest';
import { resolveRefs } from './curriculum.js';
import { renderRichText } from './katex-render.js';
import { LESSON_TITLES } from './lesson-titles.js';

describe('[[lesson:slug]] được thay đồng bộ, không cần nạp catalog', () => {
  it('resolveRefs dùng bảng tiêu đề sinh sẵn khi chưa có catalog', () => {
    const out = resolveRefs('Xem [[lesson:batch_norm_dynamics]] trước.', null);
    expect(out).toBe(`Xem «${LESSON_TITLES.batch_norm_dynamics}» trước.`);
    expect(out).not.toContain('[[');
  });

  it('renderRichText biến token thành liên kết tương đối tới thư mục bài', () => {
    const html = renderRichText('Như trong [[lesson:kv_cache_anatomy]] ở trên.');
    expect(html).not.toContain('[[lesson:');
    expect(html).toContain('href="../kv_cache_anatomy/"');
    expect(html).toContain('tp-lesson-ref');
  });

  it('slug không tồn tại rơi về tên slug, không ném lỗi', () => {
    expect(resolveRefs('[[lesson:khong_ton_tai]]', null)).toBe('«khong_ton_tai»');
  });
});

import { timeRange, formatHours } from './curriculum.js';

describe('thời gian học', () => {
  it('timeRange: hiểu thật gấp 2-4 lần thời gian lướt, làm tròn 5 phút', () => {
    expect(timeRange(12)).toEqual({ skim: 12, low: 25, high: 50 });
    expect(timeRange(8)).toEqual({ skim: 8, low: 15, high: 30 });
    expect(timeRange(1).low).toBeGreaterThanOrEqual(5);
  });

  it('formatHours làm tròn 1 chữ số thập phân', () => {
    expect(formatHours(671)).toBe('11.2 giờ');
    expect(formatHours(90)).toBe('1.5 giờ');
  });
});
