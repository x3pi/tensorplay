import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const lessonsDir = path.join(rootDir, 'lessons');
const curriculumDir = path.join(rootDir, 'curriculum');
const pathsDir = path.join(curriculumDir, 'paths');

describe('Curriculum & Lesson Consistency', () => {
  it('examples/ directory must not exist', () => {
    expect(fs.existsSync(path.join(rootDir, 'examples'))).toBe(false);
  });

  it('tools/renumber.py must not exist', () => {
    expect(fs.existsSync(path.join(rootDir, 'tools', 'renumber.py'))).toBe(false);
  });

  const lessonDirs = fs.existsSync(lessonsDir)
    ? fs.readdirSync(lessonsDir).filter(name => fs.statSync(path.join(lessonsDir, name)).isDirectory())
    : [];

  it('lessons/ must contain at least 34 lessons', () => {
    expect(lessonDirs.length).toBeGreaterThanOrEqual(34);
  });

  it('no lesson slug contains hardcoded lesson numbers like bai_NN or hwN', () => {
    const forbiddenPatterns = [/^bai_\d+/i, /^hw\d+/i, /^bai\d+/i];
    for (const slug of lessonDirs) {
      for (const pat of forbiddenPatterns) {
        expect(pat.test(slug)).toBe(false);
      }
    }
  });

  it('each lesson directory contains index.html, logic.js, logic.test.js, lesson.json, kiem_tra.py', () => {
    for (const slug of lessonDirs) {
      const dir = path.join(lessonsDir, slug);
      expect(fs.existsSync(path.join(dir, 'index.html')), `${slug} missing index.html`).toBe(true);
      expect(fs.existsSync(path.join(dir, 'logic.js')), `${slug} missing logic.js`).toBe(true);
      expect(fs.existsSync(path.join(dir, 'logic.test.js')), `${slug} missing logic.test.js`).toBe(true);
      expect(fs.existsSync(path.join(dir, 'lesson.json')), `${slug} missing lesson.json`).toBe(true);
      expect(fs.existsSync(path.join(dir, 'kiem_tra.py')), `${slug} missing kiem_tra.py`).toBe(true);
    }
  });

  it('each lesson.json conforms to schema and has clean title without "Bài NN"', () => {
    const slugRegex = /^[a-z0-9_]+$/;
    for (const slug of lessonDirs) {
      const jsonPath = path.join(lessonsDir, slug, 'lesson.json');
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

      const lessonId = data.slug || data.id;
      expect(lessonId).toBe(slug);
      expect(slugRegex.test(lessonId)).toBe(true);
      expect(typeof data.title).toBe('string');
      expect(data.title.trim().length).toBeGreaterThan(0);
      expect(/\bBài\s+\d+\b/i.test(data.title)).toBe(false);
      expect(Array.isArray(data.prerequisites)).toBe(true);
      expect(typeof data.difficulty).toBe('string');
      expect(typeof (data.estimatedMinutes ?? data.estimated_minutes)).toBe('number');
    }
  });

  it('all prerequisites point to existing lesson slugs and graph is acyclic (DAG)', () => {
    const allSlugs = new Set(lessonDirs);
    const adj = new Map();

    for (const slug of lessonDirs) {
      const jsonPath = path.join(lessonsDir, slug, 'lesson.json');
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      adj.set(slug, data.prerequisites || []);

      for (const req of data.prerequisites || []) {
        expect(allSlugs.has(req), `Lesson "${slug}" requires non-existent lesson "${req}"`).toBe(true);
      }
    }

    // Check acyclic
    const visited = new Set();
    const recStack = new Set();

    function dfs(u) {
      visited.add(u);
      recStack.add(u);
      for (const v of adj.get(u) || []) {
        if (!visited.has(v)) {
          if (dfs(v)) return true;
        } else if (recStack.has(v)) {
          return true; // cycle found
        }
      }
      recStack.delete(u);
      return false;
    }

    for (const slug of lessonDirs) {
      if (!visited.has(slug)) {
        expect(dfs(slug)).toBe(false);
      }
    }
  });

  function extractPathLessons(pData) {
    if (Array.isArray(pData.lessons)) return pData.lessons;
    if (Array.isArray(pData.sections)) {
      return pData.sections.flatMap(s => s.lessons || []);
    }
    return [];
  }

  it('curriculum/paths/*.json only reference valid slugs', () => {
    const pathFiles = fs.readdirSync(pathsDir).filter(f => f.endsWith('.json'));
    expect(pathFiles.length).toBeGreaterThanOrEqual(4);

    const allSlugs = new Set(lessonDirs);
    for (const pf of pathFiles) {
      const pData = JSON.parse(fs.readFileSync(path.join(pathsDir, pf), 'utf-8'));
      const lessons = extractPathLessons(pData);
      if (pData.status !== 'planned') {
        expect(lessons.length).toBeGreaterThan(0);
      }
      for (const s of lessons) {
        expect(allSlugs.has(s), `Path ${pf} references non-existent lesson "${s}"`).toBe(true);
      }
    }
  });

  it('main path covers all 34 lessons in valid DAG order', () => {
    const mainPath = JSON.parse(fs.readFileSync(path.join(pathsDir, 'main.json'), 'utf-8'));
    const lessons = extractPathLessons(mainPath);
    expect(lessons.length).toBe(lessonDirs.length);

    const seen = new Set();
    for (const slug of lessons) {
      const lData = JSON.parse(fs.readFileSync(path.join(lessonsDir, slug, 'lesson.json'), 'utf-8'));
      for (const req of lData.prerequisites || []) {
        expect(seen.has(req), `In main path, prerequisite "${req}" must appear before "${slug}"`).toBe(true);
      }
      seen.add(slug);
    }
  });

  it('curriculum/legacy-map.json maps old routes to current slugs', () => {
    const legacyMapPath = path.join(curriculumDir, 'legacy-map.json');
    expect(fs.existsSync(legacyMapPath)).toBe(true);
    const map = JSON.parse(fs.readFileSync(legacyMapPath, 'utf-8'));
    const allSlugs = new Set(lessonDirs);

    for (const [oldUrl, target] of Object.entries(map)) {
      expect(oldUrl.startsWith('examples/')).toBe(true);
      const targetSlug = target.replace(/^lessons\//, '').replace(/\/$/, '');
      expect(allSlugs.has(targetSlug), `Legacy map target "${target}" (slug: ${targetSlug}) does not exist`).toBe(true);
    }
  });
});
