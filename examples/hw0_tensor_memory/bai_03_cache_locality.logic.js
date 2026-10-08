/**
 * Logic Module for Bài 08: Row-Major vs Col-Major Cache Locality
 * Path: examples/hw0_tensor_memory/bai_03_cache_locality.logic.js
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      matrixDim: 4, // 4x4 matrix = 16 elements
      scanOrder: 'row', // 'row' | 'col'
      currentIndex: 0,
      cacheLineSize: 4, // 4 elements per cache line
      cachedLines: [], // indices currently in L1 cache
      hits: 0,
      misses: 0,
      history: []
    };
    return this.calculate();
  }

  applyPreset(presetState) {
    this.state = {
      ...this.state,
      ...presetState,
      currentIndex: 0,
      cachedLines: [],
      hits: 0,
      misses: 0,
      history: []
    };
    return this.calculate();
  }

  onUserUpdate(partialState) {
    this.state = { ...this.state, ...partialState };
    return this.calculate();
  }

  stepScan() {
    const { matrixDim, scanOrder, currentIndex, cacheLineSize, cachedLines, hits, misses, history } = this.state;
    const total = matrixDim * matrixDim;

    if (currentIndex >= total) {
      return this.calculate();
    }

    // Determine target (r, c) based on scanOrder
    let r, c, linearIdx;
    if (scanOrder === 'row') {
      r = Math.floor(currentIndex / matrixDim);
      c = currentIndex % matrixDim;
    } else {
      c = Math.floor(currentIndex / matrixDim);
      r = currentIndex % matrixDim;
    }
    // In row-major C memory: linear index is always r * matrixDim + c
    linearIdx = r * matrixDim + c;

    // Check if linearIdx is in any cached line
    const isHit = cachedLines.includes(linearIdx);
    let newCachedLines = [...cachedLines];
    let newHits = hits;
    let newMisses = misses;

    if (isHit) {
      newHits++;
    } else {
      newMisses++;
      // Load a full cache line aligned to cacheLineSize
      const lineStart = Math.floor(linearIdx / cacheLineSize) * cacheLineSize;
      const newLine = Array.from({ length: cacheLineSize }, (_, i) => lineStart + i);
      // Keep only most recent cache lines (e.g. 2 lines max for mini-cache)
      newCachedLines = [...newCachedLines, ...newLine].slice(-cacheLineSize * 2);
    }

    this.state = {
      ...this.state,
      currentIndex: currentIndex + 1,
      currentCoord: { r, c, linearIdx },
      cachedLines: newCachedLines,
      hits: newHits,
      misses: newMisses,
      lastEvent: isHit ? 'hit' : 'miss',
      history: [...history, { step: currentIndex + 1, r, c, linearIdx, isHit }]
    };

    return this.calculate();
  }

  calculate() {
    const { hits, misses, scanOrder, currentCoord, lastEvent, currentIndex, matrixDim } = this.state;
    const totalAccesses = hits + misses;
    const hitRate = totalAccesses > 0 ? (hits / totalAccesses) : 0;
    
    // Latency estimation: Hit = 1 cycle, Miss = 20 cycles
    const estimatedCycles = hits * 1 + misses * 20;

    let verdict;
    if (currentIndex === 0) {
      verdict = {
        type: 'neutral',
        text: 'Bấm "Bước Kế Tiếp" hoặc "Chạy Hết" để quan sát đầu đọc CPU quét bộ nhớ.'
      };
    } else if (lastEvent === 'hit') {
      verdict = {
        type: 'success',
        text: `🟢 CACHE HIT! Phần tử (${currentCoord?.r}, ${currentCoord?.c}) đã có sẵn trong L1 Cache (1 cycle).`
      };
    } else {
      verdict = {
        type: 'danger',
        text: `🔴 CACHE MISS! Phần tử (${currentCoord?.r}, ${currentCoord?.c}) chưa có trong cache. CPU phải dừng 20 cycles để nạp từ RAM!`
      };
    }

    const formulaKaTeX = `\\text{Hit Rate} = \\frac{${hits}}{${totalAccesses}} = ${(hitRate * 100).toFixed(0)}\\% \\quad | \\quad \\text{Latency} = ${estimatedCycles} \\text{ cycles}`;

    return {
      scanOrder,
      currentIndex,
      totalElements: matrixDim * matrixDim,
      currentCoord,
      hits,
      misses,
      hitRate,
      estimatedCycles,
      cachedLines: this.state.cachedLines,
      lastEvent,
      formulaKaTeX,
      verdict
    };
  }
}

export const PRESETS = [
  { id: 'row_major_scan', label: 'Quét Hàng (Row-Major: for r, for c)', state: { scanOrder: 'row' } },
  { id: 'col_major_scan', label: 'Quét Cột (Col-Major: for c, for r)', state: { scanOrder: 'col' } }
];
