/**
 * MemoryTape Component
 * 1D array tape visualizer simulating contiguous C/C++ memory buffer with pointer highlights.
 * Supports bidirectional interaction with 2D grids (Row-major order), click events,
 * and contextual expand/collapse states.
 */

export function createMemoryTape(container, options = {}) {
  const {
    arrayName = 'ptr',
    initialValues = [0, 0, 0, 0],
    highlightIndex = 0,
    baseAddress = '0x7ffd90a0',
    elementSize = 4, // 4 bytes for float32
    cols = 2,
    initiallyCollapsed = false,
    onCellClick = null
  } = options;

  let values = [...initialValues];
  let activeIndex = highlightIndex;
  let isCollapsed = initiallyCollapsed;
  let isFocused = false;

  container.classList.add('tp-memory-tape-wrap');

  function render() {
    const currentByteAddr = `0x${(parseInt(baseAddress, 16) + activeIndex * elementSize).toString(16)}`;
    const r = Math.floor(activeIndex / cols);
    const c = activeIndex % cols;

    container.innerHTML = `
      <div class="tp-memory-tape ${isFocused ? 'focused' : ''} ${isCollapsed ? 'collapsed' : ''}" style="${isFocused ? 'border-color: rgba(56, 189, 248, 0.6); box-shadow: 0 0 16px rgba(56, 189, 248, 0.15);' : ''}">
        <div class="tp-tape-header" style="display: flex; justify-content: space-between; align-items: center; font-size: var(--text-xs); margin-bottom: ${isCollapsed ? '0' : '8px'};">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span><code>float ${arrayName}[${values.length}]</code></span>
            ${isFocused ? '<span style="font-size: 0.62rem; color: var(--color-info); background: rgba(56, 189, 248, 0.12); padding: 1px 6px; border-radius: 3px; font-weight: 600; border: 1px solid rgba(56, 189, 248, 0.25);">🎯 TRỌNG TÂM</span>' : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="color: var(--color-info); font-size: 0.72rem; font-weight: 500;">Contiguous 1D RAM</span>
            <button type="button" class="btn-tape-toggle" style="background: rgba(255,255,255,0.06); border: 1px solid var(--border-subtle); color: var(--text-dim); font-size: 0.65rem; padding: 2px 7px; border-radius: 4px; cursor: pointer; transition: all 0.15s ease;">
              ${isCollapsed ? 'Mở rộng ▾' : 'Thu gọn ▴'}
            </button>
          </div>
        </div>

        ${isCollapsed ? `
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; font-family: var(--font-mono); display: flex; align-items: center; gap: 6px;">
            <span style="color: var(--text-dim);">Buffer 1D:</span>
            <span>[${values.map((v, i) => `<span style="${i === activeIndex ? 'color: var(--color-info); font-weight: 700;' : ''}">${typeof v === 'number' && Number.isInteger(v) ? v : (typeof v === 'number' ? v.toFixed(1) : v)}</span>`).join(', ')}]</span>
            <span style="color: var(--text-dim); margin-left: auto; font-size: 0.65rem;">(Bấm để mở)</span>
          </div>
        ` : `
          <div class="tp-tape-row" style="display: flex; gap: 6px; overflow-x: auto; padding: 4px 0;">
            ${values.map((v, i) => {
              const cellR = Math.floor(i / cols);
              const cellC = i % cols;
              return `
                <div class="tp-mem-cell ${i === activeIndex ? 'highlight' : ''}" data-idx="${i}" style="cursor: pointer;" title="Nhấp để định vị pixel (${cellR}, ${cellC})">
                  <span class="tp-mem-idx">[${i}] <small style="color: var(--text-dim); font-size: 0.6rem;">(${cellR},${cellC})</small></span>
                  <span class="tp-mem-val">${typeof v === 'number' ? (Number.isInteger(v) ? v.toString() : v.toFixed(1)) : v}</span>
                </div>
              `;
            }).join('')}
          </div>
          <div class="tp-tape-meta" style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); margin-top: 0.6rem; line-height: 1.6; background: rgba(0, 0, 0, 0.28); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <div style="color: var(--color-info); font-weight: 600;">
              📍 Ánh xạ 2D &rarr; 1D: Pixel (${r}, ${c}) &rarr; <code>index = ${r} × ${cols} + ${c} = ${activeIndex}</code>
            </div>
            <div>Con trỏ C++: <code>*(${arrayName} + ${activeIndex})</code> &rarr; Địa chỉ RAM: <code>${currentByteAddr}</code></div>
            <div style="font-size: 0.7rem; color: var(--text-dim);">Offset bộ nhớ: <code>${activeIndex} × ${elementSize} = ${activeIndex * elementSize} bytes</code> (CPU nạp trực tiếp)</div>
          </div>
        `}
      </div>
    `;

    // Bind toggle button
    const toggleBtn = container.querySelector('.btn-tape-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isCollapsed = !isCollapsed;
        render();
      });
    }

    // Bind collapsed card click
    if (isCollapsed) {
      const cardEl = container.querySelector('.tp-memory-tape');
      if (cardEl) {
        cardEl.style.cursor = 'pointer';
        cardEl.addEventListener('click', () => {
          isCollapsed = false;
          render();
        });
      }
    } else {
      // Bind click on cells for bidirectional interaction
      const cells = container.querySelectorAll('.tp-mem-cell');
      cells.forEach(cell => {
        cell.addEventListener('click', () => {
          const idx = parseInt(cell.getAttribute('data-idx'), 10);
          activeIndex = idx;
          render();
          if (typeof onCellClick === 'function') {
            const cellR = Math.floor(idx / cols);
            const cellC = idx % cols;
            onCellClick(idx, { row: cellR, col: cellC, value: values[idx] });
          }
        });
      });
    }
  }

  render();

  return {
    setValues: (newVals) => {
      values = [...newVals];
      render();
    },
    setHighlight: (idx) => {
      activeIndex = idx;
      render();
    },
    setCollapsed: (collapsed) => {
      isCollapsed = Boolean(collapsed);
      render();
    },
    setFocused: (focused) => {
      isFocused = Boolean(focused);
      render();
    },
    toggleCollapsed: () => {
      isCollapsed = !isCollapsed;
      render();
    }
  };
}

export class MemoryTape {
  constructor(arg1, arg2) {
    let options = arg2 || {};
    let parent = null;
    const isElement = (typeof HTMLElement !== 'undefined' && arg1 instanceof HTMLElement) ||
      (typeof arg1 === 'object' && arg1 !== null && (arg1.nodeType === 1 || (!arg1.container && !arg1.containerId)));
    if (isElement) {
      parent = arg1;
    } else if (typeof arg1 === 'object' && arg1) {
      options = arg1;
      if (options.container) parent = options.container;
      else if (options.containerId && typeof document !== 'undefined') parent = document.getElementById(options.containerId);
    }
    if (!parent) return;
    this._instance = createMemoryTape(parent, options);
  }
  setValues(...args) { return this._instance?.setValues(...args); }
  setHighlight(...args) { return this._instance?.setHighlight(...args); }
  setCollapsed(...args) { return this._instance?.setCollapsed(...args); }
  setFocused(...args) { return this._instance?.setFocused(...args); }
  toggleCollapsed(...args) { return this._instance?.toggleCollapsed(...args); }
}
