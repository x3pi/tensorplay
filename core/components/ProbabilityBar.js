/**
 * TensorPlay Probability & Score Breakdown Component
 * Renders live scores, Softmax probabilities, and classification verdicts.
 */

export class ProbabilityBar {
  constructor(mountElement) {
    this.mountEl = mountElement;
  }

  render(data) {
    if (!this.mountEl) return;

    const { items = [], verdict = null } = data || {};

    this.mountEl.innerHTML = `
      <div class="prob-list" style="display: flex; flex-direction: column; gap: 10px;">
        ${items.map(item => {
          const score = typeof item.score === 'number' ? item.score.toFixed(1) : item.score;
          const prob = item.prob !== undefined ? (item.prob * 100).toFixed(0) : null;
          const isHigh = item.score > 0;
          const barColor = isHigh ? 'var(--color-positive)' : 'var(--color-negative)';
          const barWidth = Math.min(100, Math.max(0, prob !== null ? prob : (item.score > 0 ? Math.min(100, item.score * 35) : 5)));

          return `
            <div class="prob-item" style="font-size: var(--text-xs);">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-weight: 600; color: ${item.isTarget ? 'var(--text-main)' : 'var(--text-muted)'};">
                  ${item.label}
                </span>
                <span style="font-family: var(--font-mono); font-weight: 600; color: ${barColor};">
                  Điểm Z: ${score} ${prob !== null ? `(${prob}%)` : ''}
                </span>
              </div>
              <div style="height: 6px; background: rgba(255,255,255,0.08); border-radius: var(--radius-full); overflow: hidden;">
                <div style="height: 100%; width: ${barWidth}%; background: ${barColor}; transition: width 0.25s ease;"></div>
              </div>
            </div>
          `;
        }).join('')}

        ${verdict ? `
          <div style="margin-top: 6px; padding: 6px 10px; border-radius: var(--radius-sm); font-size: var(--text-xs); font-weight: 600; background: ${verdict.type === 'success' ? 'var(--color-positive-bg)' : 'var(--color-warning-bg)'}; color: ${verdict.type === 'success' ? 'var(--color-positive)' : 'var(--color-warning)'}; border: 1px solid ${verdict.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'};">
            ${verdict.text}
          </div>
        ` : ''}
      </div>
    `;
  }
}
