/**
 * shared/lesson-context.js
 * Identifies the current lesson slug from <meta name="tp-lesson"> or window.location.pathname.
 */

export function getLessonSlug(win = (typeof window !== 'undefined' ? window : null)) {
  if (win && win.document) {
    const meta = win.document.querySelector('meta[name="tp-lesson"]');
    if (meta && meta.content && meta.content.trim()) {
      return meta.content.trim();
    }
  }

  if (win && win.location) {
    const pathname = win.location.pathname || '';
    // Matches /lessons/<slug>/ or /lessons/<slug>/index.html
    const match = pathname.match(/\/lessons\/([a-z0-9_]+)(?:\/|$)/);
    if (match) {
      return match[1];
    }

    // Fallback: match last directory segment before index.html
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 2 && segments[segments.length - 1] === 'index.html' && segments[segments.length - 2] !== 'lessons') {
      return segments[segments.length - 2];
    }
  }

  return '';
}
