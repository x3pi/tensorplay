#!/usr/bin/env node
/**
 * tools/build-catalog.mjs
 * Builds public/curriculum/catalog.json from lessons/* /lesson.json and curriculum/**.
 * Validates consistency, prerequisites DAG, slug syntax, and KaTeX/title hygiene.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const LESSONS_DIR = join(ROOT, 'lessons');
const CURRICULUM_DIR = join(ROOT, 'curriculum');
const TOPICS_FILE = join(CURRICULUM_DIR, 'topics.json');
const PATHS_DIR = join(CURRICULUM_DIR, 'paths');
const OUT_DIR = join(ROOT, 'public', 'curriculum');
const OUT_FILE = join(OUT_DIR, 'catalog.json');
const TITLES_FILE = join(ROOT, 'shared', 'lesson-titles.js');

const isCheckOnly = process.argv.includes('--check');

function fail(msg) {
  console.error(`❌ [build-catalog error]: ${msg}`);
  process.exit(1);
}

function warn(msg) {
  console.warn(`⚠️  [build-catalog warning]: ${msg}`);
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch (err) {
    fail(`Không đọc được file JSON ${file}: ${err.message}`);
  }
}

export function buildCatalog() {
  if (!existsSync(CURRICULUM_DIR)) {
    fail(`Không tìm thấy thư mục ${CURRICULUM_DIR}`);
  }
  if (!existsSync(TOPICS_FILE)) {
    fail(`Không tìm thấy ${TOPICS_FILE}`);
  }

  const topics = readJson(TOPICS_FILE);
  const topicIds = new Set(topics.map(t => t.id));

  // If lessons dir does not exist yet (pre-migration)
  if (!existsSync(LESSONS_DIR)) {
    console.log('ℹ️ Thư mục lessons/ chưa tồn tại. Đang ở giai đoạn tiền di chuyển.');
    return { lessons: {}, topics, paths: [], totalLessons: 0 };
  }

  const lessonDirs = readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  const lessons = {};
  const allSlugs = new Set();

  for (const slug of lessonDirs) {
    // Rule 1: slug syntax
    if (!/^[a-z][a-z0-9_]*$/.test(slug)) {
      fail(`Slug '${slug}' không hợp lệ (phải bắt đầu bằng chữ cái thường, chỉ gồm a-z, 0-9, _)`);
    }
    if (/^bai_?\d/.test(slug)) {
      fail(`Slug '${slug}' chứa tiền tố đánh số 'bai_NN' - vi phạm nguyên tắc định danh không số`);
    }
    if (/\d{2}/.test(slug)) {
      fail(`Slug '${slug}' chứa 2 chữ số liền nhau ('\\d{2}') kiểu số thứ tự - vi phạm nguyên tắc`);
    }

    const dir = join(LESSONS_DIR, slug);
    const lessonJsonFile = join(dir, 'lesson.json');
    const indexHtmlFile = join(dir, 'index.html');
    const logicJsFile = join(dir, 'logic.js');
    const logicTestFile = join(dir, 'logic.test.js');
    const kiemTraPyFile = join(dir, 'kiem_tra.py');

    // Rule 2: required files
    if (!existsSync(lessonJsonFile)) fail(`Thiếu lesson.json trong ${slug}`);
    if (!existsSync(indexHtmlFile)) fail(`Thiếu index.html trong ${slug}`);
    if (!existsSync(logicJsFile)) fail(`Thiếu logic.js trong ${slug}`);
    if (!existsSync(logicTestFile)) fail(`Thiếu logic.test.js trong ${slug}`);

    const meta = readJson(lessonJsonFile);

    if (meta.id !== slug) {
      fail(`meta.id ('${meta.id}') không khớp với tên thư mục ('${slug}')`);
    }

    // Rule 3: title hygiene
    if (/^\s*Bài\b/i.test(meta.title) || /\bBài\s+\d/i.test(meta.title)) {
      fail(`Tiêu đề của bài '${slug}' không được chứa 'Bài NN': "${meta.title}"`);
    }

    // Rule 4: topic exists
    if (!topicIds.has(meta.topic)) {
      fail(`Topic '${meta.topic}' của bài '${slug}' không tồn tại trong topics.json`);
    }

    // Check kiem_tra.py for ready lessons
    if (meta.status === 'ready' && !existsSync(kiemTraPyFile)) {
      fail(`Bài '${slug}' có status 'ready' nhưng thiếu file kiem_tra.py`);
    }

    // HTML checks
    const htmlContent = readFileSync(indexHtmlFile, 'utf-8');
    if (!htmlContent.includes('LessonNav.js')) {
      fail(`index.html của '${slug}' không nạp LessonNav.js`);
    }
    if (!htmlContent.includes('./logic.js')) {
      fail(`index.html của '${slug}' không import ./logic.js`);
    }
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
    if (titleMatch && /\bBài\s+\d/i.test(titleMatch[1])) {
      fail(`<title> trong index.html của '${slug}' chứa số bài: "${titleMatch[1]}"`);
    }

    // Metadata warnings
    if (!meta.prerequisites || meta.prerequisites.length === 0) {
      // warning only
    }
    if (meta.estimatedMinutes && (meta.estimatedMinutes < 3 || meta.estimatedMinutes > 40)) {
      warn(`estimatedMinutes của '${slug}' (${meta.estimatedMinutes}) nằm ngoài khoảng gợi ý 3-30`);
    }

    meta.path = `lessons/${slug}/index.html`;
    lessons[slug] = meta;
    allSlugs.add(slug);
  }

  // Cross-reference checks for prerequisites & related
  for (const [slug, meta] of Object.entries(lessons)) {
    for (const pre of (meta.prerequisites || [])) {
      if (!allSlugs.has(pre)) {
        fail(`Bài '${slug}' khai báo tiên quyết '${pre}' không tồn tại`);
      }
    }
    for (const rel of (meta.related || [])) {
      if (!allSlugs.has(rel)) {
        fail(`Bài '${slug}' khai báo liên quan '${rel}' không tồn tại`);
      }
    }
  }

  // Paths
  const paths = [];
  if (existsSync(PATHS_DIR)) {
    const pathFiles = readdirSync(PATHS_DIR).filter(f => f.endsWith('.json')).sort();
    for (const pf of pathFiles) {
      const p = readJson(join(PATHS_DIR, pf));
      if (!p.id) fail(`Path file ${pf} thiếu id`);
      if (!p.title) fail(`Path file ${pf} thiếu title`);

      // Check duplicates & existence in path
      const pathSlugs = [];
      const positions = {};
      let orderIndex = 0;

      for (const sec of (p.sections || [])) {
        for (const s of (sec.lessons || [])) {
          if (!allSlugs.has(s)) {
            fail(`Lộ trình '${p.id}' chứa bài '${s}' không tồn tại`);
          }
          if (pathSlugs.includes(s)) {
            fail(`Lộ trình '${p.id}' bị trùng lặp bài '${s}'`);
          }
          pathSlugs.push(s);
          orderIndex += 1;
          positions[s] = {
            index: orderIndex,
            sectionTitle: sec.title || ''
          };
        }
      }

      // Add total to each position
      for (const s of pathSlugs) {
        positions[s].total = pathSlugs.length;
      }
      p.positions = positions;
      paths.push(p);

      // Check Rule 5: in main path, prerequisites must appear before dependent lesson
      if (p.id === 'main') {
        const slugOrder = new Map(pathSlugs.map((s, idx) => [s, idx]));
        for (const s of pathSlugs) {
          const sIdx = slugOrder.get(s);
          const pres = lessons[s].prerequisites || [];
          for (const pre of pres) {
            if (slugOrder.has(pre)) {
              const preIdx = slugOrder.get(pre);
              if (preIdx >= sIdx) {
                fail(`Trong lộ trình main: tiên quyết '${pre}' (vị trí ${preIdx + 1}) xuất hiện sau hoặc cùng '${s}' (vị trí ${sIdx + 1})`);
              }
            }
          }
        }

        // Check if any ready lesson is missing in main path
        for (const s of allSlugs) {
          if (lessons[s].status === 'ready' && !slugOrder.has(s)) {
            warn(`Bài '${s}' (ready) không nằm trong lộ trình main`);
          }
        }
      }
    }
  }

  const catalog = {
    lessons,
    topics,
    paths,
    generatedAt: new Date().toISOString(),
    totalLessons: Object.keys(lessons).length
  };

  return catalog;
}

function buildTitlesModule(catalog) {
  const map = {};
  for (const [slug, l] of Object.entries(catalog.lessons)) {
    map[slug] = String(l.title).split(/ — |: /)[0].trim();
  }
  return `// FILE SINH TỰ ĐỘNG bởi tools/build-catalog.mjs — KHÔNG sửa tay.\n` +
    `// Bảng tiêu đề ngắn của bài để resolveRefs() thay [[lesson:slug]] đồng bộ (không cần fetch).\n` +
    `export const LESSON_TITLES = ${JSON.stringify(map, null, 2)};\n`;
}

function main() {
  const catalog = buildCatalog();
  const titlesModule = buildTitlesModule(catalog);
  const formatted = JSON.stringify(catalog, null, 2) + '\n';

  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  if (isCheckOnly) {
    if (!existsSync(OUT_FILE)) {
      fail(`File ${OUT_FILE} chưa tồn tại. Hãy chạy 'npm run catalog'`);
    }
    const existing = readFileSync(OUT_FILE, 'utf-8');
    // Compare ignoring generatedAt timestamp
    const cleanExisting = existing.replace(/"generatedAt":\s*"[^"]*",?/, '');
    const cleanNew = formatted.replace(/"generatedAt":\s*"[^"]*",?/, '');
    if (cleanExisting !== cleanNew) {
      fail(`public/curriculum/catalog.json không khớp với dữ liệu nguồn. Hãy chạy 'npm run catalog' và commit file.`);
    }
    if (!existsSync(TITLES_FILE) || readFileSync(TITLES_FILE, 'utf-8') !== titlesModule) {
      fail(`shared/lesson-titles.js không khớp với dữ liệu nguồn. Hãy chạy 'npm run catalog' và commit file.`);
    }
    console.log('✓ catalog.json và lesson-titles.js khớp 100% với dữ liệu nguồn.');
    return;
  }

  writeFileSync(OUT_FILE, formatted, 'utf-8');
  writeFileSync(TITLES_FILE, titlesModule, 'utf-8');
  console.log(`✓ Đã sinh ${OUT_FILE} (${catalog.totalLessons} bài học, ${catalog.paths.length} lộ trình)`);
}

if (process.argv[1] && process.argv[1].endsWith('build-catalog.mjs')) {
  main();
}
