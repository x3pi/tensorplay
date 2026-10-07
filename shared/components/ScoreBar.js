/**
 * ScoreBar Component
 * Horizontal bar measuring probabilities, scores, or loss with semantic colors.
 */

import { renderInlineMath } from '../katex-render.js';

export function createScoreBar(container, options = {}) {
  let {
    label = 'Score',
    value = 0,
    min = 0,
    max = 2,
    variant = 'reward', // 'reward' | 'penalty' | 'neutral'
    showPercentage = false
  } = options;

  container.classList.add('tp-score-wrap');

  function render() {
    const range = max - min || 1;
    const clamped = Math.max(min, Math.min(max, value));
    const percent = Math.round(((clamped - min) / range) * 100);
    const displayVal = showPercentage ? `${percent}%` : (typeof value === 'number' ? value.toFixed(1) : value);

    container.innerHTML = `
      <div class="tp-score-header">
        <span class="tp-score-label">${renderInlineMath(label)}</span>
        <span class="tp-score-val" style="color: ${variant === 'reward' ? 'var(--color-positive)' : (variant === 'penalty' ? 'var(--color-negative)' : 'var(--color-info)')};">${displayVal}</span>
      </div>
      <div class="tp-score-track">
        <div class="tp-score-fill ${variant}" style="width: ${percent}%;"></div>
      </div>
    `;
  }

  render();

  return {
    setValue: (newVal, newLabel = null) => {
      value = newVal;
      if (newLabel) label = newLabel;
      render();
    },
    setLabel: (newLabel) => {
      label = newLabel;
      render();
    },
    setVariant: (newVariant) => {
      variant = newVariant;
      render();
    }
  };
}

export class ScoreBar {
  constructor(arg1, arg2) {
    let options = arg2 || {};
    let parent = null;
    if (arg1 instanceof HTMLElement || (typeof arg1 === 'object' && arg1 && arg1.nodeType === 1)) {
      parent = arg1;
    } else if (typeof arg1 === 'object' && arg1) {
      options = arg1;
      if (options.container) parent = options.container;
      else if (options.containerId) parent = document.getElementById(options.containerId);
    }
    if (!parent) return;
    this._instance = createScoreBar(parent, options);
  }
  setValue(...args) { return this._instance?.setValue(...args); }
  setLabel(...args) { return this._instance?.setLabel(...args); }
  setVariant(...args) { return this._instance?.setVariant(...args); }
}

