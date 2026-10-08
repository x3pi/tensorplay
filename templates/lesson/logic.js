/**
 * Logic Module for {{SLUG}}
 * Mathematical computation and state transitions.
 */

export function computeStep(input) {
  if (typeof input !== 'number') return 0;
  return input * 2;
}
