#!/usr/bin/env node
/**
 * tools/new-lesson.mjs
 * Scaffold a new self-contained lesson into lessons/<slug>/
 *
 * Usage:
 *   node tools/new-lesson.mjs <slug> --title "Tên Bài Học" --topic <topic_id> [--summary "..."]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const templatesDir = path.join(rootDir, 'templates', 'lesson');
const lessonsDir = path.join(rootDir, 'lessons');
const pathsDir = path.join(rootDir, 'curriculum', 'paths');

const args = process.argv.slice(2);
if (args.length === 0 || args[0].startsWith('-')) {
  console.log(`
Usage:
  node tools/new-lesson.mjs <slug> --title "Tiêu Đề Bài" --topic <topic_id> [--summary "..."]

Example:
  node tools/new-lesson.mjs spec_decoding --title "Speculative Decoding — Tăng Tốc Suy Luận LLM" --topic llm-serving
`);
  process.exit(1);
}

const slug = args[0].toLowerCase().trim();
const slugRegex = /^[a-z0-9_]+$/;
if (!slugRegex.test(slug)) {
  console.error(`Lỗi: Slug "${slug}" không hợp lệ. Chỉ chấp nhận chữ thường không dấu, số và gạch dưới (a-z, 0-9, _). Không chứa số bài học hardcode (bai_NN).`);
  process.exit(1);
}

if (/^bai_\d+/i.test(slug) || /^hw\d+/i.test(slug)) {
  console.error(`Lỗi: Slug không được chứa tiền tố số thứ tự như "bai_01" hay "hw0". Hãy dùng tên khái niệm (ví dụ: spec_decoding).`);
  process.exit(1);
}

const targetDir = path.join(lessonsDir, slug);
if (fs.existsSync(targetDir)) {
  console.error(`Lỗi: Bài học "${slug}" đã tồn tại tại ${targetDir}`);
  process.exit(1);
}

function getArg(flag, defaultVal = '') {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return defaultVal;
}

const title = getArg('--title', `${slug}`);
const topic = getArg('--topic', 'foundations');
const summary = getArg('--summary', `Mô tả trực quan và toán học cho ${title}.`);

// Create lesson directory
fs.mkdirSync(targetDir, { recursive: true });

// Copy and substitute templates
const templateFiles = ['lesson.json', 'index.html', 'logic.js', 'logic.test.js', 'kiem_tra.py'];

templateFiles.forEach(file => {
  const src = path.join(templatesDir, file);
  const dest = path.join(targetDir, file);
  if (!fs.existsSync(src)) {
    console.error(`Lỗi: Không tìm thấy template ${src}`);
    process.exit(1);
  }

  let content = fs.readFileSync(src, 'utf-8');
  content = content
    .replace(/\{\{SLUG\}\}/g, slug)
    .replace(/\{\{TITLE\}\}/g, title)
    .replace(/\{\{TOPIC\}\}/g, topic)
    .replace(/\{\{SUMMARY\}\}/g, summary);

  fs.writeFileSync(dest, content, 'utf-8');
});

// Add to main path in curriculum/paths/main.json if not present
const mainPathFile = path.join(pathsDir, 'main.json');
if (fs.existsSync(mainPathFile)) {
  const mainData = JSON.parse(fs.readFileSync(mainPathFile, 'utf-8'));
  const allCurrentSlugs = (mainData.sections || []).flatMap(s => s.lessons || []);
  if (!allCurrentSlugs.includes(slug)) {
    // Append to last section by default
    if (mainData.sections && mainData.sections.length > 0) {
      const lastSec = mainData.sections[mainData.sections.length - 1];
      lastSec.lessons = lastSec.lessons || [];
      lastSec.lessons.push(slug);
      fs.writeFileSync(mainPathFile, JSON.stringify(mainData, null, 2) + '\n', 'utf-8');
      console.log(`✓ Đã thêm "${slug}" vào chặng cuối của curriculum/paths/main.json`);
    }
  }
}

// Build catalog
try {
  execSync('node tools/build-catalog.mjs', { cwd: rootDir, stdio: 'inherit' });
} catch (e) {
  console.warn('Lưu ý: Không thể tự động chạy build-catalog.mjs');
}

console.log(`
🎉 Tạo bài học mới THÀNH CÔNG: lessons/${slug}/
- index.html
- logic.js
- logic.test.js
- lesson.json
- kiem_tra.py

Các lệnh tiếp theo:
1. Chạy test logic: npx vitest run lessons/${slug}/
2. Kiểm tra toán học: python3 tools/run_checks.py --lesson ${slug}
3. Mở dev server: http://localhost:3000/lessons/${slug}/
`);
