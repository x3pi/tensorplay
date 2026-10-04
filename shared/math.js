/**
 * Pure Mathematical Utilities for TensorPlay
 * Reusable across multiple Deep Learning Systems lessons.
 */

/**
 * Calculates dot product of two 1D arrays: a · b
 */
export function dot(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    throw new Error(`Array lengths must match: ${a?.length} vs ${b?.length}`);
  }
  return a.reduce((sum, val, idx) => sum + val * b[idx], 0);
}

/**
 * Numerically stable Softmax calculation (prevents FP32 overflow):
 * softmax(z_i) = exp(z_i - max(z)) / sum(exp(z_j - max(z)))
 */
export function safeSoftmax(logits) {
  if (!Array.isArray(logits) || logits.length === 0) return [];
  const maxLogit = Math.max(...logits);
  const exps = logits.map(z => Math.exp(z - maxLogit));
  const sumExp = exps.reduce((acc, v) => acc + v, 0);
  if (sumExp === 0 || isNaN(sumExp)) {
    return logits.map(() => 1 / logits.length);
  }
  return exps.map(v => v / sumExp);
}

/**
 * Rectified Linear Unit activation: max(0, x)
 */
export function relu(x) {
  return Math.max(0, x);
}

/**
 * Clamp a number between min and max
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Calculates 1D Row-major memory offset for 2D coordinate:
 * index = r * numCols + c
 */
export function offset2D(r, c, numCols) {
  if (r < 0 || c < 0 || c >= numCols) {
    throw new Error(`Invalid 2D coordinates (${r}, ${c}) for width ${numCols}`);
  }
  return r * numCols + c;
}
