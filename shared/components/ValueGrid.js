/**
 * ValueGrid Component
 * Reusable N x N interactive matrix/tensor grid (pixels, weights, kernel, attention map).
 */

export function createValueGrid(container, options = {}) {
  const {
    title = 'Matrix Grid',
    rows = 2,
    cols = 2,
    initial = [],
    variant = 'pixel', // 'pixel' | 'weight'
    cycleValues = variant === 'pixel' ? [1, 0, 0.5] : [1, -1, 0],
    onChange = () => {}
  } = options;

  let values = initial.length === rows * cols ? [...initial] : new Array(rows * cols).fill(0);
  let activeIndex = 0;

  container.innerHTML = `
    <div class="tp-val-grid-wrap">
      <div class="tp-val-grid-title" style="color: ${variant === 'pixel' ? 'var(--color-warning)' : 'var(--color-info)'};">${title}</div>
      <div class="tp-val-grid" style="grid-template-columns: repeat(${cols}, 60px);">
        ${values.map((_, i) => `<button class="tp-grid-cell" data-idx="${i}"></button>`).join('')}
      </div>
      <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 8px;">Kích thước: ${rows}×${cols}</div>
    </div>
  `;

  const cells = container.querySelectorAll('.tp-grid-cell');

  function renderCells() {
    cells.forEach((cell, i) => {
      const val = values[i];
      const r = Math.floor(i / cols);
      const c = i % cols;
      const formatted = typeof val === 'number' ? (Number.isInteger(val) ? val.toString() : val.toFixed(1)) : val;

      cell.innerHTML = `
        <span style="font-size: 0.6rem; color: var(--text-dim);">(${r},${c})</span>
        <span style="font-size: 1.1rem; font-weight: 700; margin-top: 2px;">${val > 0 && variant === 'weight' ? `+${formatted}` : formatted}</span>
      `;

      cell.className = 'tp-grid-cell';

      if (variant === 'pixel') {
        if (val === 1) cell.classList.add('active-warning');
        else if (val === 0.5) cell.style.backgroundColor = 'rgba(245, 158, 11, 0.08)';
      } else {
        if (val > 0) cell.classList.add('active-positive');
        else if (val < 0) cell.classList.add('active-negative');
      }

      if (i === activeIndex) {
        cell.style.outline = '2px solid var(--color-info)';
      } else {
        cell.style.outline = 'none';
      }
    });
  }

  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      const idx = parseInt(cell.getAttribute('data-idx'), 10);
      activeIndex = idx;
      const cur = values[idx];
      const curCycleIdx = cycleValues.indexOf(cur);
      const nextVal = cycleValues[(curCycleIdx + 1) % cycleValues.length];
      values[idx] = nextVal;

      renderCells();
      onChange([...values], { row: Math.floor(idx / cols), col: idx % cols, index: idx });
    });
  });

  renderCells();

  return {
    getValues: () => [...values],
    setValues: (newVals) => {
      if (Array.isArray(newVals) && newVals.length === values.length) {
        values = [...newVals];
        renderCells();
      }
    },
    setActiveIndex: (idx) => {
      activeIndex = idx;
      renderCells();
    }
  };
}
