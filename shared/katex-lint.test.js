import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function findFiles(dir, exts = ['.js', '.html'], out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      findFiles(full, exts, out);
    } else if (exts.some(ext => name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

describe('KaTeX Syntax Safety Linter', () => {
  it('Chặn đứng bare _ và \\text{___} trong môi trường toán học của toàn bộ thư mục examples', () => {
    const files = findFiles('examples', ['.js', '.html']);
    
    files.forEach(filePath => {
      const content = readFileSync(filePath, 'utf-8');
      
      // Check 1: No \text{___} or \text{_...}
      expect(content, `Lỗi KaTeX trong file ${filePath}: Chứa \\text{___}`).not.toMatch(/\\text\{_+\}/);

      // Check 2: No triple underscore inside math $...$
      const mathMatches = content.match(/\$([^\$]+)\$/g);
      if (mathMatches) {
        mathMatches.forEach(m => {
          expect(m, `Lỗi KaTeX trong file ${filePath}: Chứa ___ bên trong math mode`).not.toMatch(/_{3,}/);
        });
      }
    });
  });
});
