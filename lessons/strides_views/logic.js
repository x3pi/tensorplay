/**
 * Logic Module: Strides & View — một vùng nhớ phẳng, nhiều cách nhìn.
 * Path: lessons/strides_views/logic.js
 *
 * Mô hình NDArray (giống backend Needle / PyTorch / NumPy):
 *   phần tử (i, j) nằm ở ô nhớ  addr = offset + i * s0 + j * s1
 * Reshape / Transpose / Slice / Broadcast chỉ đổi (shape, strides, offset),
 * KHÔNG sao chép dữ liệu. Chỉ compact() mới cấp phát vùng nhớ mới.
 */

// Vùng nhớ gốc: 6 ô float liên tục. Dùng chữ cái để KHÔNG nhầm "giá trị" với "địa chỉ".
export const MEMORY = ['a', 'b', 'c', 'd', 'e', 'f'];
export const ELEMENT_BYTES = 4; // float32

/** Strides "chuẩn" (row-major, liền mạch) cho một shape 2D: [cols, 1] */
export function compactStrides(shape) {
  const [, cols] = shape;
  return [cols, 1];
}

/** View có liền mạch (contiguous) không? Bỏ qua chiều có kích thước 1 vì stride của nó không bao giờ được dùng. */
export function isContiguous(shape, strides, offset = 0) {
  const expected = compactStrides(shape);
  for (let k = 0; k < 2; k++) {
    if (shape[k] === 1) continue;
    if (strides[k] !== expected[k]) return false;
  }
  // offset ≠ 0 vẫn là một khối liền mạch (chỉ dời điểm bắt đầu), nên không cần kiểm tra offset.
  return true;
}

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      viewId: 'base',
      shape: [2, 3],
      strides: [3, 1],
      offset: 0,
      selected: [1, 2] // ô (i, j) đang được chọn trong lưới logic
    };
    return this.calculate();
  }

  applyPreset(presetState) {
    this.state = { ...this.state, ...presetState };
    this._clampSelection();
    return this.calculate();
  }

  onUserUpdate(partialState) {
    this.state = { ...this.state, ...partialState };
    this._clampSelection();
    return this.calculate();
  }

  _clampSelection() {
    const [rows, cols] = this.state.shape;
    let [i, j] = this.state.selected || [0, 0];
    i = Math.max(0, Math.min(rows - 1, i));
    j = Math.max(0, Math.min(cols - 1, j));
    this.state.selected = [i, j];
  }

  calculate() {
    const { shape, strides, offset, selected } = this.state;
    const [rows, cols] = shape;
    const [s0, s1] = strides;

    // 1. Bảng địa chỉ cho từng phần tử logic
    const addresses = [];
    const values = [];
    let outOfBounds = false;
    for (let i = 0; i < rows; i++) {
      const addrRow = [];
      const valRow = [];
      for (let j = 0; j < cols; j++) {
        const addr = offset + i * s0 + j * s1;
        const oob = addr < 0 || addr >= MEMORY.length;
        if (oob) outOfBounds = true;
        addrRow.push(addr);
        valRow.push(oob ? '⚠' : MEMORY[addr]);
      }
      addresses.push(addrRow);
      values.push(valRow);
    }

    // 2. Ô đang chọn
    const [si, sj] = selected;
    const selectedAddr = offset + si * s0 + sj * s1;
    const selectedOob = selectedAddr < 0 || selectedAddr >= MEMORY.length;

    // 3. Thống kê bộ nhớ
    const numElements = rows * cols;
    const usedAddrs = new Set(addresses.flat().filter(a => a >= 0 && a < MEMORY.length));
    const uniqueCells = usedAddrs.size;
    const contiguous = isContiguous(shape, strides, offset);
    const hasZeroStride = (s0 === 0 && rows > 1) || (s1 === 0 && cols > 1);

    // 4. compact(): sao chép theo thứ tự logic sang vùng nhớ mới
    const compacted = outOfBounds ? null : values.flat();
    const copyBytesIfCompact = numElements * ELEMENT_BYTES;

    // 5. Công thức
    const formulaKaTeX = `\\text{addr}(${si}, ${sj}) = ${offset} + ${si} \\cdot ${s0} + ${sj} \\cdot ${s1} = ${selectedAddr}`;
    const cppSnippet = `float* p = data + ${offset};\nfloat v = p[${si} * ${s0} + ${sj} * ${s1}]; // = data[${selectedAddr}]${selectedOob ? '  ❌ VƯỢT BIÊN!' : ` → '${MEMORY[selectedAddr]}'`}`;

    // 6. Kết luận
    let verdict;
    if (outOfBounds) {
      verdict = {
        type: 'danger',
        text: `❌ Có phần tử trỏ ra ngoài vùng nhớ 0…${MEMORY.length - 1}. Trong C++ đây là lỗi đọc rác/segfault — NDArray phải kiểm tra shape/strides trước khi tạo view.`
      };
    } else if (hasZeroStride) {
      verdict = {
        type: 'success',
        text: `📡 Broadcast bằng stride 0: ${numElements} phần tử logic nhưng chỉ dùng ${uniqueCells} ô nhớ thật. Không tốn thêm byte nào.`
      };
    } else if (!contiguous) {
      verdict = {
        type: 'warning',
        text: `🔀 View KHÔNG liền mạch (strides [${s0}, ${s1}] ≠ chuẩn [${compactStrides(shape).join(', ')}]). Muốn reshape hoặc gửi cho kernel cần dữ liệu liền mạch → phải gọi compact() (sao chép ${copyBytesIfCompact} bytes).`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ View liền mạch: đọc tuần tự từ ô ${offset}. Reshape/flatten miễn phí, 0 byte sao chép.`
      };
    }

    return {
      shape: [...shape],
      strides: [...strides],
      offset,
      addresses,
      values,
      selected: [si, sj],
      selectedAddr,
      selectedOob,
      numElements,
      uniqueCells,
      usedAddrs: [...usedAddrs].sort((a, b) => a - b),
      contiguous,
      hasZeroStride,
      outOfBounds,
      compacted,
      copyBytesIfCompact,
      formulaKaTeX,
      cppSnippet,
      verdict
    };
  }
}

export const PRESETS = [
  {
    id: 'base',
    label: 'Gốc $2 \\times 3$',
    state: { viewId: 'base', shape: [2, 3], strides: [3, 1], offset: 0 }
  },
  {
    id: 'transpose',
    label: 'Transpose $X^T$',
    state: { viewId: 'transpose', shape: [3, 2], strides: [1, 3], offset: 0 }
  },
  {
    id: 'slice',
    label: 'Cắt X[:, 1:]',
    state: { viewId: 'slice', shape: [2, 2], strides: [3, 1], offset: 1 }
  },
  {
    id: 'broadcast',
    label: 'Broadcast hàng 0 → $3 \\times 3$',
    state: { viewId: 'broadcast', shape: [3, 3], strides: [0, 1], offset: 0 }
  },
  {
    id: 'reshape',
    label: 'Reshape $3 \\times 2$',
    state: { viewId: 'reshape', shape: [3, 2], strides: [2, 1], offset: 0 }
  }
];
