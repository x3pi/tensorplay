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
});
