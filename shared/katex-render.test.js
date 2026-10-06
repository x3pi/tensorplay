import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderMath, renderInlineMath, whenKaTeXReady } from './katex-render.js';
import { createLiveSlider } from './components/LiveSlider.js';
import { createValueGrid } from './components/ValueGrid.js';
import { createScoreBar } from './components/ScoreBar.js';
import { createPresetPicker } from './components/PresetPicker.js';
import { createCommentSection } from './components/CommentSection.js';

describe('shared/katex-render.js & Component Math Integration', () => {
  let origWindow;
  let origDocument;

  beforeEach(() => {
    origWindow = globalThis.window;
    origDocument = globalThis.document;

    // Standard mock for KaTeX
    globalThis.window = {
      addEventListener: () => {},
      removeEventListener: () => {},
      katex: {
        render: (formula, el, opts) => {
          el.innerHTML = `<span class="katex-mock" data-display="${!!opts?.displayMode}">${formula}</span>`;
        },
        renderToString: (formula, opts) => {
          return `<span class="katex-mock" data-display="${!!opts?.displayMode}">${formula}</span>`;
        }
      }
    };
  });

  afterEach(() => {
    globalThis.window = origWindow;
    globalThis.document = origDocument;
  });

  describe('renderInlineMath', () => {
    it('renders inline math with comparison operators (<, >, <=, >=) without error', () => {
      const text = 'Ngưỡng an toàn ($Z > 1.0$). Khi dính bụi nhẹ ($Z = 1 + 1 + 0.5 \\times 0 = 2.0$ hoặc $Z = 1 + 0.5 = 1.5$), vẫn vượt ngưỡng.';
      const res = renderInlineMath(text);

      expect(res).toContain('<span class="katex-mock" data-display="false">Z > 1.0</span>');
      expect(res).toContain('<span class="katex-mock" data-display="false">Z = 1 + 1 + 0.5 \\times 0 = 2.0</span>');
      expect(res).toContain('<span class="katex-mock" data-display="false">Z = 1 + 0.5 = 1.5</span>');
      expect(res).not.toContain('<span class="katex-mock" data-display="false">Khi dính bụi');
    });

    it('renders standalone display math ($$...$$) with displayMode: true', () => {
      const text = '$$Z = (x_0 w_0) + (x_1 w_1) + (x_2 w_2) + (x_3 w_3)$$';
      const res = renderInlineMath(text);
      expect(res).toContain('<span class="katex-mock" data-display="true">Z = (x_0 w_0) + (x_1 w_1) + (x_2 w_2) + (x_3 w_3)</span>');
    });

    it('does not bleed across HTML tag boundaries when encountering unrelated dollar signs', () => {
      const text = '<p class="tag">$5</p><p class="tag">$10</p>';
      const res = renderInlineMath(text);
      // Must not match $5</p><p class="tag">$ as a single formula
      expect(res).not.toContain('<span class="katex-mock"');
      expect(res).toBe(text);
    });

    it('returns empty string or original value safely for falsy input', () => {
      expect(renderInlineMath('')).toBe('');
      expect(renderInlineMath(null)).toBe('');
      expect(renderInlineMath(undefined)).toBe('');
    });
  });

  describe('renderMath target resolution & safeguards', () => {
    it('renders formula into HTMLElement target directly', () => {
      const el = { innerHTML: '', textContent: '' };
      renderMath(el, 'Z = X \\cdot W', { displayMode: true });
      expect(el.innerHTML).toContain('Z = X \\cdot W');
      expect(el.innerHTML).toContain('data-display="true"');
    });

    it('resolves string ID or CSS selector to target element', () => {
      const el = { id: 'mount-formula', innerHTML: '', textContent: '' };
      globalThis.document = {
        getElementById: (id) => id === 'mount-formula' ? el : null,
        querySelector: (sel) => sel === '#mount-formula' ? el : null
      };
      globalThis.window.document = globalThis.document;

      renderMath('mount-formula', '\\nabla_W L = X^T G');
      expect(el.innerHTML).toContain('\\nabla_W L = X^T G');

      renderMath('#mount-formula', 'Loss = -\\ln(P)');
      expect(el.innerHTML).toContain('Loss = -\\ln(P)');
    });

    it('safely clears element when passed null or empty formula (Mode 3)', () => {
      const el = { innerHTML: 'previous math', textContent: '' };
      renderMath(el, null);
      expect(el.innerHTML).toBe('');

      el.innerHTML = 'some math';
      renderMath(el, '');
      expect(el.innerHTML).toBe('');
    });
  });

  describe('whenKaTeXReady', () => {
    it('resolves immediately when window.katex is already available', async () => {
      const katex = await whenKaTeXReady(100);
      expect(katex).toBeDefined();
      expect(typeof katex.renderToString).toBe('function');
    });
  });

  describe('UI Component Math Rendering Integration', () => {
    const createMockNode = (tag = 'div') => {
      const children = [];
      return {
        tagName: tag.toUpperCase(),
        nodeType: 1,
        innerHTML: '',
        textContent: '',
        className: '',
        value: '',
        style: {},
        classList: {
          add: () => {},
          remove: () => {},
          contains: () => false
        },
        addEventListener: () => {},
        removeEventListener: () => {},
        getAttribute: () => '',
        setAttribute: () => {},
        appendChild: (child) => children.push(child),
        querySelector: function (sel) {
          if (sel.includes('label')) return createMockNode('span');
          if (sel.includes('title')) return createMockNode('div');
          if (sel.includes('slider')) return { value: '0', addEventListener: () => {} };
          if (sel.includes('val')) return createMockNode('span');
          return createMockNode('div');
        },
        querySelectorAll: () => []
      };
    };

    it('ValueGrid renders math in title and supports dynamic setTitle', () => {
      const container = createMockNode('div');
      const grid = createValueGrid(container, {
        title: 'Ảnh Đầu Vào $X$',
        rows: 2,
        cols: 2
      });

      expect(container.innerHTML).toContain('katex-mock');
      expect(container.innerHTML).toContain('X');

      // Test setTitle
      grid.setTitle('Khuôn Trọng Số $W$');
      expect(typeof grid.setTitle).toBe('function');
    });

    it('LiveSlider renders math in label and supports dynamic setLabel', () => {
      const container = createMockNode('div');
      const slider = createLiveSlider(container, {
        label: 'Trọng số $w_0$',
        initial: 1.0
      });

      expect(container.innerHTML).toContain('katex-mock');
      expect(container.innerHTML).toContain('w_0');
      expect(typeof slider.setLabel).toBe('function');
    });

    it('ScoreBar renders math in label', () => {
      const container = createMockNode('div');
      createScoreBar(container, {
        label: 'Xác suất $P_{target}$',
        value: 0.88
      });

      expect(container.innerHTML).toContain('katex-mock');
      expect(container.innerHTML).toContain('P_{target}');
    });

    it('PresetPicker renders math in preset button labels', () => {
      const container = createMockNode('div');
      createPresetPicker(container, {
        title: 'Thử nhanh:',
        presets: [
          { id: 'w1', label: 'Khớp $W = 1.0$' },
          { id: 'w0', label: 'Bụi $W = 0.5$' }
        ]
      });

      expect(container.innerHTML).toContain('W = 1.0');
      expect(container.innerHTML).toContain('W = 0.5');
    });

    it('CommentSection renders math in comments', () => {
      const container = createMockNode('div');
      createCommentSection(container, {
        initialComments: [
          { author: 'Chuyên gia', content: 'Điểm số $Z = X \\cdot W$ đo tương đồng.', tag: 'Lý thuyết' }
        ]
      });

      expect(container.innerHTML).toContain('Z = X \\cdot W');
    });
  });
});
