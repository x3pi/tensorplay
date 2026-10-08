/**
 * shared/curriculum.js
 * Curriculum catalog loader, path navigation, and cross-reference resolver.
 */

let cachedCatalog = null;

export function setCatalog(catalog) {
  cachedCatalog = catalog;
}

export function getCachedCatalog() {
  return cachedCatalog;
}

/**
 * Loads catalog.json from public directory or custom path/URL.
 */
export async function loadCatalog(customUrl) {
  if (cachedCatalog && !customUrl) return cachedCatalog;

  let url = customUrl;
  if (!url) {
    if (typeof window !== 'undefined' && window.location) {
      // Determine root-relative URL based on current pathname
      const path = window.location.pathname || '';
      if (path.includes('/lessons/')) {
        url = '../../curriculum/catalog.json';
      } else {
        url = './curriculum/catalog.json';
      }
    } else {
      url = '/curriculum/catalog.json';
    }
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      // Fallback try absolute path
      const res2 = await fetch('/curriculum/catalog.json');
      if (res2.ok) {
        cachedCatalog = await res2.json();
        return cachedCatalog;
      }
      return null;
    }
    cachedCatalog = await res.json();
    return cachedCatalog;
  } catch (err) {
    console.warn('curriculum.loadCatalog: Failed to fetch catalog.json', err);
    return null;
  }
}

export function getLesson(slug, catalog = cachedCatalog) {
  if (!catalog || !catalog.lessons) return null;
  return catalog.lessons[slug] || null;
}

export function getPath(pathId = 'main', catalog = cachedCatalog) {
  if (!catalog || !catalog.paths) return null;
  return catalog.paths.find(p => p.id === pathId) || null;
}

/**
 * Returns flattened array of lesson slugs for a given path, along with section info.
 */
export function getPathLessons(pathId = 'main', catalog = cachedCatalog) {
  const path = getPath(pathId, catalog);
  if (!path || !path.sections) return [];

  const items = [];
  path.sections.forEach(sec => {
    (sec.lessons || []).forEach(slug => {
      items.push({
        slug,
        sectionTitle: sec.title || ''
      });
    });
  });
  return items;
}

/**
 * Returns position info for a lesson within a specific path.
 */
export function positionIn(slug, pathId = 'main', catalog = cachedCatalog) {
  const items = getPathLessons(pathId, catalog);
  const idx = items.findIndex(item => item.slug === slug);
  if (idx < 0) return null;

  return {
    index: idx + 1,
    total: items.length,
    sectionTitle: items[idx].sectionTitle
  };
}

/**
 * Returns previous and next lesson metadata for navigation within a path.
 */
export function neighbors(slug, pathId = 'main', catalog = cachedCatalog) {
  const path = getPath(pathId, catalog) || getPath('main', catalog);
  const effectivePathId = path ? path.id : 'main';
  const items = getPathLessons(effectivePathId, catalog);
  const idx = items.findIndex(item => item.slug === slug);

  if (idx < 0) {
    return {
      prev: null,
      next: null,
      currentPosition: null,
      pathId: effectivePathId,
      pathTitle: path ? path.title : 'Lộ trình'
    };
  }

  const prevItem = idx > 0 ? items[idx - 1] : null;
  const nextItem = idx < items.length - 1 ? items[idx + 1] : null;

  return {
    prev: prevItem ? getLesson(prevItem.slug, catalog) : null,
    next: nextItem ? getLesson(nextItem.slug, catalog) : null,
    currentPosition: {
      index: idx + 1,
      total: items.length,
      sectionTitle: items[idx].sectionTitle
    },
    pathId: effectivePathId,
    pathTitle: path ? path.title : 'Lộ trình'
  };
}

/**
 * Resolves cross-references like [[lesson:slug]] into «Short Title».
 * Fallback gracefully without throwing if catalog or lesson is missing.
 */
export function resolveRefs(text, catalog = cachedCatalog, options = {}) {
  if (typeof text !== 'string') return text;
  const asLink = options.asLink ?? false;

  return text.replace(/\[\[lesson:([a-z0-9_]+)\]\]/g, (match, slug) => {
    const lesson = getLesson(slug, catalog);
    if (!lesson || !lesson.title) {
      return asLink ? `<a href="../${slug}/" class="tp-lesson-ref">«${slug}»</a>` : `«${slug}»`;
    }
    // Extract short title before " — " or ": "
    const shortTitle = lesson.title.split(/ — |: /)[0].trim();
    if (asLink) {
      return `<a href="../${slug}/" class="tp-lesson-ref" title="${lesson.title}">«${shortTitle}»</a>`;
    }
    return `«${shortTitle}»`;
  });
}
