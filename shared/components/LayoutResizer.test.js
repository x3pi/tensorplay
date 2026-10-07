import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSavedWidths,
  saveWidths,
  clearSavedWidths,
  initLayoutResizer,
  LAYOUT_PRESETS
} from './LayoutResizer.js';

describe('LayoutResizer Component - Intelligent Adaptive Workspace', () => {
  beforeEach(() => {
    const store = {};
    global.localStorage = {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    };
  });

  describe('LocalStorage Persistence & Presets', () => {
    it('lưu và khôi phục đúng cấu hình tỉ lệ và trạng thái thu gọn', () => {
      saveWidths(35.5, 22.0, true, false);
      const saved = getSavedWidths();
      expect(saved).toEqual({ p0: 35.5, p2: 22.0, col0Collapsed: true, col2Collapsed: false });
    });

    it('từ chối giá trị bất hợp lệ hoặc NaN', () => {
      // p0 quá nhỏ (< 15%)
      saveWidths(10, 25);
      expect(getSavedWidths()).toBeNull();

      // Dữ liệu rác JSON
      localStorage.setItem('tensorplay:layout:column-widths', 'not-valid-json');
      expect(getSavedWidths()).toBeNull();
    });

    it('xóa cấu hình khi gọi clearSavedWidths()', () => {
      saveWidths(30, 25);
      expect(getSavedWidths()).not.toBeNull();
      clearSavedWidths();
      expect(getSavedWidths()).toBeNull();
    });

    it('chứa đầy đủ các Preset bố cục thông minh', () => {
      expect(LAYOUT_PRESETS.balanced).toBeDefined();
      expect(LAYOUT_PRESETS['focus-sandbox']).toBeDefined();
      expect(LAYOUT_PRESETS['focus-narrative']).toBeDefined();
      expect(LAYOUT_PRESETS['focus-telemetry']).toBeDefined();
    });
  });

  describe('DOM Mounting & Intelligent Features', () => {
    function createMockDOM(numCols = 3) {
      const listeners = {};
      const styleProps = {};

      const createMockElement = (tag, className = '') => {
        const el = {
          tagName: tag.toUpperCase(),
          className,
          style: {
            minWidth: '',
            setProperty: (k, v) => { styleProps[k] = v; },
            getPropertyValue: (k) => styleProps[k] || '',
            removeProperty: (k) => { delete styleProps[k]; }
          },
          attributes: {},
          setAttribute: (k, v) => { el.attributes[k] = v; },
          getAttribute: (k) => el.attributes[k],
          classList: {
            _classes: new Set(className ? className.split(' ') : []),
            add: (c) => el.classList._classes.add(c),
            remove: (c) => el.classList._classes.delete(c),
            contains: (c) => el.classList._classes.has(c),
            toggle: (c) => {
              if (el.classList._classes.has(c)) {
                el.classList._classes.delete(c);
                return false;
              } else {
                el.classList._classes.add(c);
                return true;
              }
            }
          },
          children: [],
          innerHTML: '',
          clientWidth: 1200,
          appendChild: (child) => {
            el.children.push(child);
            child.parentElement = el;
          },
          prepend: (child) => {
            el.children.unshift(child);
            child.parentElement = el;
          },
          querySelector: (sel) => {
            const cls = sel.replace('.', '');
            const search = (node) => {
              if (node.className && node.className.includes(cls)) return node;
              for (const c of node.children || []) {
                const found = search(c);
                if (found) return found;
              }
              return null;
            };
            for (const c of el.children || []) {
              const res = search(c);
              if (res) return res;
            }
            return null;
          },
          querySelectorAll: (sel) => {
            return el.children.filter(c => c.className && c.className.includes(sel.replace('.', '')));
          },
          after: (newEl) => {
            if (el.parentGrid) {
              const idx = el.parentGrid.children.indexOf(el);
              el.parentGrid.children.splice(idx + 1, 0, newEl);
              newEl.parentElement = el.parentGrid;
            }
          },
          remove: () => {
            if (el.parentElement) {
              const idx = el.parentElement.children.indexOf(el);
              if (idx >= 0) el.parentElement.children.splice(idx, 1);
            }
          },
          addEventListener: (evt, fn) => {
            if (!listeners[evt]) listeners[evt] = [];
            listeners[evt].push(fn);
          },
          dispatchEvent: (evt) => {
            const fns = listeners[evt.type] || [];
            fns.forEach(fn => fn(evt));
            return true;
          },
          getBoundingClientRect: () => ({
            width: 1200,
            height: 800,
            left: 0,
            top: 0
          })
        };
        return el;
      };

      const grid = createMockElement('main', 'lab-grid');
      const cols = [];
      for (let i = 0; i < numCols; i++) {
        const col = createMockElement('section', `lab-col col-${i}`);
        col.parentGrid = grid;
        col.clientWidth = i === 0 ? 384 : (i === 1 ? 528 : 288);
        col.getBoundingClientRect = () => ({
          width: col.clientWidth,
          height: 800,
          left: 0,
          top: 0
        });

        // Mock header inside column
        const header = createMockElement('div', 'lab-col-header');
        col.appendChild(header);

        cols.push(col);
        grid.children.push(col);
      }

      grid.querySelectorAll = (sel) => {
        if (sel.includes('.lab-col')) return cols;
        return [];
      };

      const headerRight = createMockElement('div', 'lab-header-right');

      const mockDoc = {
        createElement: (tag) => createMockElement(tag),
        querySelector: (sel) => {
          if (sel === '.lab-grid') return grid;
          if (sel === '.lab-header-right') return headerRight;
          return null;
        },
        addEventListener: () => {},
        body: createMockElement('body')
      };

      const mockWin = {
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {}
      };

      return { grid, cols, headerRight, styleProps, listeners, createMockElement, mockDoc, mockWin };
    }

    it('tạo chính xác splitters và thanh ray thu gọn cho Cột 1 và Cột 3', () => {
      const { grid, cols, mockDoc, mockWin } = createMockDOM(3);
      const instance = initLayoutResizer({ grid, document: mockDoc, window: mockWin });
      expect(instance).not.toBeNull();

      expect(grid.classList.contains('tp-resizable')).toBe(true);
      expect(grid.children.length).toBe(5); // 3 cols + 2 splitters

      // Đã tạo nút thu gọn trong header của Cột 0 và Cột 2
      expect(cols[0].querySelector('.btn-col-collapse')).not.toBeNull();
      expect(cols[2].querySelector('.btn-col-collapse')).not.toBeNull();

      // Đã tạo thanh ray dọc trong Cột 0 và Cột 2
      expect(cols[0].querySelector('.lab-col-rail')).not.toBeNull();
      expect(cols[2].querySelector('.lab-col-rail')).not.toBeNull();
    });

    it('cho phép thu gọn (collapse) và mở rộng (expand) Cột 1 sang dạng thanh ray 46px', () => {
      const { grid, cols, mockDoc, mockWin } = createMockDOM(3);
      const instance = initLayoutResizer({ grid, document: mockDoc, window: mockWin });

      // Thu gọn Cột 0
      instance.collapseColumn(0);
      expect(grid.classList.contains('col-0-collapsed')).toBe(true);
      expect(cols[0].classList.contains('is-collapsed')).toBe(true);

      const saved = getSavedWidths();
      expect(saved.col0Collapsed).toBe(true);

      // Mở rộng lại Cột 0
      instance.expandColumn(0);
      expect(grid.classList.contains('col-0-collapsed')).toBe(false);
      expect(cols[0].classList.contains('is-collapsed')).toBe(false);
      expect(getSavedWidths().col0Collapsed).toBe(false);
    });

    it('cho phép thu gọn và mở rộng Cột 3', () => {
      const { grid, cols, mockDoc, mockWin } = createMockDOM(3);
      const instance = initLayoutResizer({ grid, document: mockDoc, window: mockWin });

      instance.collapseColumn(2);
      expect(grid.classList.contains('col-2-collapsed')).toBe(true);
      expect(cols[2].classList.contains('is-collapsed')).toBe(true);

      instance.expandColumn(2);
      expect(grid.classList.contains('col-2-collapsed')).toBe(false);
      expect(cols[2].classList.contains('is-collapsed')).toBe(false);
    });

    it('áp dụng đúng Preset "focus-sandbox" để thu gọn cả 2 cột bên', () => {
      const { grid, cols, mockDoc, mockWin } = createMockDOM(3);
      const instance = initLayoutResizer({ grid, document: mockDoc, window: mockWin });

      instance.applyPreset('focus-sandbox');
      expect(grid.classList.contains('col-0-collapsed')).toBe(true);
      expect(grid.classList.contains('col-2-collapsed')).toBe(true);
      expect(cols[0].classList.contains('is-collapsed')).toBe(true);
      expect(cols[2].classList.contains('is-collapsed')).toBe(true);
    });

    it('áp dụng đúng Preset "focus-narrative" để mở rộng Cột 1 lên 50%', () => {
      const { grid, cols, mockDoc, mockWin } = createMockDOM(3);
      const instance = initLayoutResizer({ grid, document: mockDoc, window: mockWin });

      instance.applyPreset('focus-narrative');
      expect(grid.style.getPropertyValue('--col-0-w')).toBe('50%');
      expect(grid.style.getPropertyValue('--col-2-w')).toBe('20%');
      expect(cols[0].classList.contains('is-collapsed')).toBe(false);
      expect(cols[2].classList.contains('is-collapsed')).toBe(false);
    });

    it('áp dụng đúng Preset "focus-telemetry" để mở rộng Cột 3 lên 40%', () => {
      const { grid, mockDoc, mockWin } = createMockDOM(3);
      const instance = initLayoutResizer({ grid, document: mockDoc, window: mockWin });

      instance.applyPreset('focus-telemetry');
      expect(grid.style.getPropertyValue('--col-0-w')).toBe('24%');
      expect(grid.style.getPropertyValue('--col-2-w')).toBe('40%');
    });

    it('tạo Menu Bố Cục Thông Minh trên Header và dọn dẹp sạch khi destroy()', () => {
      const { grid, headerRight, mockDoc, mockWin } = createMockDOM(3);
      const instance = initLayoutResizer({ grid, document: mockDoc, window: mockWin });

      expect(headerRight.children.length).toBeGreaterThan(0);
      const menu = headerRight.children[0];
      expect(menu.className).toBe('tp-layout-menu-container');

      instance.destroy();
      expect(grid.classList.contains('tp-resizable')).toBe(false);
      expect(grid.children.length).toBe(3);
      expect(headerRight.children.length).toBe(0);
    });
  });
});
