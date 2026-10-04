/**
 * TensorPlay Lightweight Progress Storage
 * Saves completed state and last visited steps to localStorage.
 */

const STORAGE_KEY = 'tensorplay:progress';

export function getProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveLessonProgress(lessonId, data) {
  if (!lessonId) return;
  try {
    const current = getProgress();
    current[lessonId] = {
      ...(current[lessonId] || {}),
      ...data
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {}
}

export function markCompleted(lessonId, isCompleted = true) {
  saveLessonProgress(lessonId, { completed: isCompleted });
}

export function isLessonCompleted(lessonId) {
  const current = getProgress();
  return Boolean(current[lessonId]?.completed);
}

export function resetAllProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}
