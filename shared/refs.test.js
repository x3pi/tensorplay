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
