import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

describe('shared/catalog-consistency.test.js', () => {
  it('examples/catalog.json phải có 34 bài, order liên tục 1..34 và khớp <title> của các file html', () => {
    const catPath = path.join(ROOT, 'examples', 'catalog.json');
    expect(fs.existsSync(catPath)).toBe(true);

    const catalog = JSON.parse(fs.readFileSync(catPath, 'utf-8'));
    expect(catalog.length).toBe(34);

    const pad = (n) => String(n).padStart(2, '0');
    const seenIds = new Set();
    const seenOrders = new Set();

    catalog.forEach((entry, idx) => {
      const expectedOrder = idx + 1;
      const expectedPrefix = `Bài ${pad(expectedOrder)}:`;

      // 1. Kiểm tra order
      expect(entry.order).toBe(expectedOrder);
      expect(seenOrders.has(entry.order)).toBe(false);
      seenOrders.add(entry.order);

      // 2. Kiểm tra id duy nhất
      expect(seenIds.has(entry.id)).toBe(false);
      seenIds.add(entry.id);

      // 3. Kiểm tra title
      expect(entry.title).toMatch(new RegExp(`^${expectedPrefix}`));

      // 4. Kiểm tra file html tồn tại
      const relPath = entry.path.replace('./', '');
      const htmlPath = path.join(ROOT, relPath);
      expect(fs.existsSync(htmlPath), `File không tồn tại: ${htmlPath}`).toBe(true);

      // 5. Kiểm tra <title> trong file html khớp order
      const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
      expect(htmlContent).toContain(`<title>${expectedPrefix}`);

      // 6. Kiểm tra nạp LessonNav.js
      expect(htmlContent).toContain('LessonNav.js');
    });
  });
});
