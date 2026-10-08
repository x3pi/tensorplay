import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const LESSONS = path.resolve(__dirname, '..', 'lessons');

describe('HTML của bài học phải parse được bởi Vite (parse5)', () => {
  it('không có ký tự "<" trần trong văn bản HTML (phải viết &lt; hoặc \\lt trong KaTeX)', () => {
    const offenders = [];
    for (const slug of fs.readdirSync(LESSONS)) {
      const file = path.join(LESSONS, slug, 'index.html');
      if (!fs.existsSync(file)) continue;
      const html = fs.readFileSync(file, 'utf-8');
      const cut = html.indexOf('<script type="module">');
      // Bỏ giá trị thuộc tính (trong đó "<" hợp lệ), chỉ xét phần văn bản/thẻ
      const markup = (cut >= 0 ? html.slice(0, cut) : html).replace(/="[^"]*"/g, '=""');
      const m = markup.match(/<(?![a-zA-Z/!])/);
      if (m) offenders.push(`${slug}: ...${markup.slice(Math.max(0, m.index - 30), m.index + 20).replace(/\n/g, ' ')}...`);
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('trang chuyển hướng URL cũ dùng đường dẫn tương đối và trỏ tới bài tồn tại (chạy được dưới thư mục con)', () => {
    const root = path.resolve(__dirname, '..', 'public', 'examples');
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
    const stubs = walk(root).filter(f => f.endsWith('.html'));
    expect(stubs.length).toBeGreaterThan(0);
    for (const f of stubs) {
      const html = fs.readFileSync(f, 'utf-8');
      const url = html.match(/url=([^"]+)"/)[1];
      expect(url.startsWith('/'), `${f}: chuyển hướng tuyệt đối`).toBe(false);
      expect(url.endsWith('/'), `${f}: thiếu dấu / cuối`).toBe(true);
      // Trang nằm ở public/examples/... sẽ được phục vụ ở /examples/..., nên phân giải đích từ gốc dự án
      const served = path.resolve(path.resolve(__dirname, '..'), path.relative(path.resolve(__dirname, '..', 'public'), path.dirname(f)));
      expect(fs.existsSync(path.join(served, url, 'index.html')), `${f}: đích không tồn tại`).toBe(true);
    }
  });
});
