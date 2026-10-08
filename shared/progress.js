/**
 * TensorPlay Lightweight Progress Storage
 * Saves completed state and last visited steps to localStorage.
 * Uses clean lesson slugs as primary keys with seamless backward-compatible legacy alias resolution.
 */

const STORAGE_KEY = 'tensorplay:progress';

export const LEGACY_ALIASES = {
  bai_01: 'robot_vision',
  bai_01_robot_vision: 'robot_vision',
  bai_02: 'softmax_stability',
  bai_02_softmax_loss: 'softmax_stability',
  bai_03: 'softmax_regression',
  bai_03_softmax_regression: 'softmax_regression',
  bai_04: 'twolayer_relu_backprop',
  bai_04_twolayer_relu_backprop: 'twolayer_relu_backprop',
  bai_05: 'minibatch_sgd',
  bai_05_minibatch_sgd: 'minibatch_sgd',
  bai_06a: 'cpp_matmul_loops',
  bai_06a_cpp_matmul_loops: 'cpp_matmul_loops',
  bai_03b: 'memory_leak',
  bai_03b_memory_leak: 'memory_leak',
  bai_03_cache: 'cache_locality',
  bai_03_cache_locality: 'cache_locality',
  bai_04_autograd: 'autograd_graph',
  bai_04_autograd_graph: 'autograd_graph',
  bai_05_reverse: 'reverse_vs_forward_ad',
  bai_05_reverse_vs_forward_ad: 'reverse_vs_forward_ad',
  bai_06: 'activation_valves',
  bai_06_activation_valves: 'activation_valves',
  bai_07: 'minibatch_assembly',
  bai_07_minibatch_assembly: 'minibatch_assembly',
  bai_08: 'conv2d_im2col',
  bai_08_conv2d_im2col: 'conv2d_im2col',
  bai_09: 'batch_norm_dynamics',
  bai_09_batch_norm_dynamics: 'batch_norm_dynamics',
  bai_10: 'cuda_threads',
  bai_10_cuda_threads: 'cuda_threads',
  bai_11: 'shared_memory_tiling',
  bai_11_shared_memory_tiling: 'shared_memory_tiling',
  bai_12: 'coalescing_and_banks',
  bai_12_coalescing_and_banks: 'coalescing_and_banks',
  bai_13: 'self_attention',
  bai_13_self_attention: 'self_attention',
  bai_14: 'kv_cache_anatomy',
  bai_14_kv_cache_anatomy: 'kv_cache_anatomy',
  bai_15: 'flash_attention',
  bai_15_flash_attention_concept: 'flash_attention'
};

/**
 * Resolves any legacy lesson ID or alias to its official slug.
 */
export function resolveLessonKey(key) {
  if (!key || typeof key !== 'string') return '';
  const clean = key.trim().replace(/^\/examples\/[^/]+\//, '').replace(/\.html$/, '');
  return LEGACY_ALIASES[clean] || LEGACY_ALIASES[key] || clean;
}

export function getProgress() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveLessonProgress(lessonId, data) {
  if (!lessonId) return;
  const canonicalSlug = resolveLessonKey(lessonId);
  try {
    const current = getProgress();
    current[canonicalSlug] = {
      ...(current[canonicalSlug] || {}),
      ...data
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
  } catch (e) {}
}

export function markCompleted(lessonId, isCompleted = true) {
  saveLessonProgress(lessonId, { completed: isCompleted });
}

export function isLessonCompleted(lessonId) {
  if (!lessonId) return false;
  const current = getProgress();
  const canonicalSlug = resolveLessonKey(lessonId);

  // 1. Direct check with canonical slug
  if (current[canonicalSlug]?.completed) {
    return true;
  }

  // 2. Direct check with original input key
  if (current[lessonId]?.completed) {
    return true;
  }

  // 3. Fallback check for any legacy key that resolves to canonicalSlug
  for (const [legacyKey, slug] of Object.entries(LEGACY_ALIASES)) {
    if (slug === canonicalSlug && current[legacyKey]?.completed) {
      // Migrate forward to canonical key
      saveLessonProgress(canonicalSlug, { completed: true });
      return true;
    }
  }

  return false;
}

export function resetAllProgress() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {}
}
