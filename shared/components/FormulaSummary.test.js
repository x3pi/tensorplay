import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFormulaSummary } from './FormulaSummary.js';

function createMockContainer() {
  const listeners = {};
  let _innerHTML = '';
  let _className = '';

  const container = {
    get className() {
      return _className;
    },
    set className(val) {
      _className = val;
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
      if (sel === '.tp-formula-summary-header') {
        if (!_innerHTML.includes('tp-formula-summary-header')) return null;
        return {
          addEventListener: (evt, fn) => {
            listeners['header:' + evt] = fn;
          },
          setAttribute: vi.fn(),
          click: () => {
            if (listeners['header:click']) listeners['header:click']();
          },
          keyDown: (key) => {
            if (listeners['header:keydown']) listeners['header:keydown']({ key, preventDefault: vi.fn() });
          }
        };
      }
      if (sel === '.tp-formula-summary-body') {
        if (!_innerHTML.includes('tp-formula-summary-body')) return null;
        return { style: {} };
      }
      if (sel === '.tp-formula-summary-toggle') {
        if (!_innerHTML.includes('tp-formula-summary-toggle')) return null;
        return { textContent: '' };
      }
      return null;
    },
    querySelectorAll: (sel) => {
      if (sel === '.btn-copy-formula') {
        const matches = [..._innerHTML.matchAll(/class="[^"]*btn-copy-formula[^"]*"\s+data-formula="([^"]*)"/g)];
        return matches.map(m => ({
          getAttribute: (attr) => attr === 'data-formula' ? m[1] : null,
          addEventListener: vi.fn(),
          style: {}
        }));
      }
      return [];
    }
  };

  return container;
}

describe('FormulaSummary Component', () => {
  it('khởi tạo với container class và hiển thị đúng tiêu đề, số lượng công thức', () => {
    const container = createMockContainer();
    const formulas = [
      {
        id: 'f1',
        title: 'Safe LogSumExp',
        formula: '\\text{LSE}(z) = m + \\ln(\\sum e^{z_j - m})',
        description: 'Ổn định số học',
        takeaway: 'Chống tràn số',
        tags: ['FP32', 'FP16'],
        shape: 'z \\in \\mathbb{R}^K'
      }
    ];

    const summary = createFormulaSummary(container, {
      title: 'Công Thức Cốt Lõi',
      badge: 'Ghi Nhớ',
      formulas,
      initiallyExpanded: true
    });

    expect(container.className).toBe('tp-formula-summary');
    expect(container.innerHTML).toContain('Công Thức Cốt Lõi');
    expect(container.innerHTML).toContain('1 công thức');
    expect(container.innerHTML).toContain('Ghi Nhớ');
    expect(container.innerHTML).toContain('Safe LogSumExp');
    expect(container.innerHTML).toContain('Ổn định số học');
    expect(container.innerHTML).toContain('Chống tràn số');
    expect(container.innerHTML).toContain('FP32');
    expect(summary.isExpanded()).toBe(true);
    expect(summary.getFormulas().length).toBe(1);
  });

  it('xử lý đóng / mở (toggle) trạng thái hiển thị', () => {
    const container = createMockContainer();
    const summary = createFormulaSummary(container, {
      formulas: [{ title: 'F1', formula: 'y = f(x)' }],
      initiallyExpanded: true
    });

    expect(summary.isExpanded()).toBe(true);
    summary.toggle();
    expect(summary.isExpanded()).toBe(false);
    summary.toggle();
    expect(summary.isExpanded()).toBe(true);

    const header = container.querySelector('.tp-formula-summary-header');
    header.click();
    expect(summary.isExpanded()).toBe(false);
    header.keyDown('Enter');
    expect(summary.isExpanded()).toBe(true);
  });

  it('cập nhật danh sách công thức qua setFormulas()', () => {
    const container = createMockContainer();
    const summary = createFormulaSummary(container, {
      formulas: []
    });

    expect(container.innerHTML).toContain('Chưa có công thức nào');

    summary.setFormulas([
      { title: 'Cross Entropy', formula: 'L = -\\ln(p_y)' },
      { title: 'Gradient', formula: 'g = p - y' }
    ]);

    expect(container.innerHTML).toContain('2 công thức');
    expect(container.innerHTML).toContain('Cross Entropy');
    expect(container.innerHTML).toContain('Gradient');
    expect(summary.getFormulas().length).toBe(2);
  });
});
