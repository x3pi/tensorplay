/**
 * TensorPlay C++ RAM Memory Visualizer
 * Simulates contiguous 1D memory array in C/C++ (float array float* ptr).
 */

export class MemoryVisualizer {
  constructor(mountElement) {
    this.mountEl = mountElement;
  }

  render(memoryData) {
    if (!this.mountEl) return;

    const {
      arrayName = 'Z_flat',
      cells = [0, 0, 0, 0],
      activeOffset = 0,
      baseAddress = '0x7ffd90a0',
      elementSize = 4, // 4 bytes for float32
      row = 0,
      col = 0,
      colsTotal = 2
    } = memoryData || {};

    const offsetFormula = `r * N + c = ${row} * ${colsTotal} + ${col} = ${activeOffset}`;
    const byteOffset = activeOffset * elementSize;
    const currentByteAddr = `0x${(parseInt(baseAddress, 16) + byteOffset).toString(16)}`;

    this.mountEl.innerHTML = `
      <div class="memory-cells-wrapper">
        <div class="memory-meta">
          <span>Array: <code>float ${arrayName}[${cells.length}]</code></span>
          <span style="float: right; color: var(--color-info);">Contiguous (Row-major)</span>
        </div>
        <div class="memory-row" style="margin-top: 8px;">
          ${cells.map((val, idx) => {
            const isHigh = idx === activeOffset;
            const formattedVal = typeof val === 'number' ? (Number.isInteger(val) ? val.toFixed(1) : val.toFixed(2)) : val;
            return `
              <div class="memory-cell ${isHigh ? 'highlight' : ''}" title="Chỉ số: [${idx}], Offset: ${idx * elementSize} bytes">
                <span class="memory-cell-idx">[${idx}]</span>
                <span class="memory-cell-val">${formattedVal}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="memory-meta">
          <div>Offset: <code>${offsetFormula}</code> (Cell [${activeOffset}])</div>
          <div>Pointer: <code>*(${arrayName} + ${activeOffset})</code> &rarr; Byte Address: <code>${currentByteAddr}</code></div>
        </div>
      </div>
    `;
  }
}
