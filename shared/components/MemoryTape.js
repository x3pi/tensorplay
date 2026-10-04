/**
 * MemoryTape Component
 * 1D array tape visualizer simulating contiguous C/C++ memory buffer with pointer highlights.
 */

export function createMemoryTape(container, options = {}) {
  const {
    arrayName = 'ptr',
    initialValues = [0, 0, 0, 0],
    highlightIndex = 0,
    baseAddress = '0x7ffd90a0',
    elementSize = 4 // 4 bytes for float32
  } = options;

  let values = [...initialValues];
  let activeIndex = highlightIndex;

  function render() {
    const currentByteAddr = `0x${(parseInt(baseAddress, 16) + activeIndex * elementSize).toString(16)}`;

    container.innerHTML = `
      <div class="tp-memory-tape">
        <div style="display: flex; justify-content: space-between; font-size: var(--text-xs); margin-bottom: 6px;">
          <span><code>float ${arrayName}[${values.length}]</code></span>
          <span style="color: var(--color-info);">Contiguous 1D RAM</span>
        </div>
        <div class="tp-tape-row">
          ${values.map((v, i) => `
            <div class="tp-mem-cell ${i === activeIndex ? 'highlight' : ''}">
              <span class="tp-mem-idx">[${i}]</span>
              <span class="tp-mem-val">${typeof v === 'number' ? (Number.isInteger(v) ? v.toString() : v.toFixed(1)) : v}</span>
            </div>
          `).join('')}
        </div>
        <div class="tp-tape-meta">
          <div>Con trỏ: <code>*(${arrayName} + ${activeIndex})</code> &rarr; Địa chỉ: <code>${currentByteAddr}</code></div>
          <div>Offset byte: <code>${activeIndex} × ${elementSize} = ${activeIndex * elementSize} bytes</code></div>
        </div>
      </div>
    `;
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
    }
  };
}
