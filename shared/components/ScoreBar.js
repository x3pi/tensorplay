/**
 * ScoreBar Component
 * Horizontal bar measuring probabilities, scores, or loss with semantic colors.
 */

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
        <span class="tp-score-label">${label}</span>
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
    setVariant: (newVariant) => {
      variant = newVariant;
      render();
    }
  };
}
