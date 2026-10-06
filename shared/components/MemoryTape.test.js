import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMemoryTape, MemoryTape } from './MemoryTape.js';

function createMockContainer() {
  const listeners = {};
  let _innerHTML = '';

  const container = {
    classList: {
      _classes: new Set(),
      add: (cls) => container.classList._classes.add(cls),
      remove: (cls) => container.classList._classes.delete(cls),
      contains: (cls) => container.classList._classes.has(cls)
    },
    get innerHTML() {
      return _innerHTML;
    },
    set innerHTML(html) {
      _innerHTML = html;
    },
    get textContent() {
      return _innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    },
    querySelector: (sel) => {
      if (sel === '.btn-tape-toggle') {
        const hasToggle = _innerHTML.includes('btn-tape-toggle');
        if (!hasToggle) return null;
        return {
          addEventListener: (evt, fn) => {
            listeners['toggle:' + evt] = fn;
          },
          click: () => {
            if (listeners['toggle:click']) listeners['toggle:click']({ stopPropagation: () => {} });
          }
        };
      }
      if (sel === '.tp-memory-tape') {
        return {
          classList: {
            contains: (c) => _innerHTML.includes(`tp-memory-tape`) && _innerHTML.includes(c)
          },
          style: {},
          addEventListener: (evt, fn) => {
            listeners['card:' + evt] = fn;
          },
          click: () => {
            if (listeners['card:click']) listeners['card:click']();
          }
        };
      }
      return null;
    },
    querySelectorAll: (sel) => {
      if (sel === '.tp-mem-cell') {
        const matches = [..._innerHTML.matchAll(/class="([^"]*tp-mem-cell[^"]*)"\s+data-idx="(\d+)"/g)];
        return matches.map((m) => {
          const classStr = m[1];
          const idx = parseInt(m[2], 10);
          return {
            getAttribute: (attr) => attr === 'data-idx' ? idx.toString() : null,
            classList: {
              contains: (c) => classStr.split(' ').includes(c)
            },
            textContent: _innerHTML,
            addEventListener: (evt, fn) => {
              listeners[`cell:${idx}:${evt}`] = fn;
            },
            click: () => {
              if (listeners[`cell:${idx}:click`]) listeners[`cell:${idx}:click`]();
            }
          };
        });
      }
      return [];
    }
  };

  return container;
}

describe('shared/components/MemoryTape.js', () => {
  let container;

  beforeEach(() => {
    container = createMockContainer();
  });

  it('Khởi tạo đúng cấu trúc DOM với 4 ô nhớ mặc định', () => {
    const tape = createMemoryTape(container, {
      arrayName: 'X_flat',
      initialValues: [1, 1, 0, 0],
      highlightIndex: 0
    });

    const cells = container.querySelectorAll('.tp-mem-cell');
    expect(cells.length).toBe(4);
    expect(cells[0].classList.contains('highlight')).toBe(true);
    expect(cells[1].classList.contains('highlight')).toBe(false);
    expect(container.textContent).toContain('float X_flat[4]');
    expect(container.textContent).toContain('0x7ffd90a0');
  });

  it('Hỗ trợ tương tác nhấp ô nhớ (onCellClick) và tính đúng toạ độ 2D', () => {
    const onCellClick = vi.fn();
    const tape = createMemoryTape(container, {
      arrayName: 'X_flat',
      initialValues: [1, 1, 0, 0],
      cols: 2,
      onCellClick
    });

    // Nhấp vào ô index [2] -> Hàng 1, Cột 0
    const cells = container.querySelectorAll('.tp-mem-cell');
    cells[2].click();

    expect(onCellClick).toHaveBeenCalledTimes(1);
    expect(onCellClick).toHaveBeenCalledWith(2, { row: 1, col: 0, value: 0 });

    // Kiểm tra ô [2] được highlight sau khi click
    const updatedCells = container.querySelectorAll('.tp-mem-cell');
    expect(updatedCells[2].classList.contains('highlight')).toBe(true);
    expect(container.textContent).toContain('Pixel (1, 0)');
    expect(container.textContent).toContain('index = 1 × 2 + 0 = 2');
  });

  it('Hỗ trợ cập nhật giá trị (setValues) và highlight từ bên ngoài (setHighlight)', () => {
    const tape = createMemoryTape(container, {
      arrayName: 'X_flat',
      initialValues: [1, 1, 0, 0]
    });

    tape.setValues([0.5, 0, 1, 0]);
    tape.setHighlight(3);

    const cells = container.querySelectorAll('.tp-mem-cell');
    expect(container.textContent).toContain('0.5');
    expect(cells[3].classList.contains('highlight')).toBe(true);
    expect(container.textContent).toContain('Pixel (1, 1)');
  });

  it('Hỗ trợ chế độ thu gọn (setCollapsed) và tiêu điểm (setFocused)', () => {
    const tape = createMemoryTape(container, {
      arrayName: 'X_flat',
      initialValues: [1, 1, 0, 0],
      initiallyCollapsed: false
    });

    expect(container.innerHTML).toContain('tp-tape-row');

    // Thu gọn
    tape.setCollapsed(true);
    expect(container.innerHTML).not.toContain('tp-tape-row');
    expect(container.textContent).toContain('Buffer 1D:');

    // Mở rộng lại
    tape.setCollapsed(false);
    expect(container.innerHTML).toContain('tp-tape-row');

    // Đặt focused
    tape.setFocused(true);
    expect(container.innerHTML).toContain('focused');
    expect(container.textContent).toContain('TRỌNG TÂM');
  });

  it('Khởi tạo qua class MemoryTape bọc đúng instance', () => {
    const tape = new MemoryTape(container, {
      arrayName: 'test_ptr',
      initialValues: [1, 2]
    });
    expect(container.textContent).toContain('test_ptr[2]');
    tape.setHighlight(1);
    const cells = container.querySelectorAll('.tp-mem-cell');
    expect(cells[1].classList.contains('highlight')).toBe(true);
  });
});
