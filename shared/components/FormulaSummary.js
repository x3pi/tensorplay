/**
 * FormulaSummary Component (Bảng Tổng Hợp Công Thức Toán Cốt Lõi Cần Nhớ)
 * Reusable across all lessons. Placed at the end of Column 1 (Khung Dẫn Dắt & Chú Giải)
 * to synthesize the essential mathematical formulas, notations, dimensions, and gotchas of the lesson.
 */

import { renderInlineMath, whenKaTeXReady, renderAllInlineMath } from '../katex-render.js';

export function createFormulaSummary(container, options = {}) {
  const {
    title = 'Tổng Hợp Công Thức Toán Cần Nhớ',
    badge = 'Cheat Sheet',
    formulas = [],
    initiallyExpanded = true
  } = options;

  let isExpanded = Boolean(initiallyExpanded);
  let currentFormulas = [...formulas];

  if (container) {
    container.className = 'tp-formula-summary';
    // If StepWizard is present in DOM, integrate into its final slide slot and synchronize visibility
    if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
      const wizardEl = document.getElementById('mount-step-wizard');
      if (wizardEl) {
        const slot = wizardEl.querySelector?.('.wizard-formula-mount-point');
        if (slot && typeof slot.appendChild === 'function' && container.parentElement !== slot) {
          slot.appendChild(container);
        }
        if (slot && slot.style && slot.style.display === 'none' && container.style) {
          container.style.display = 'none';
        }
      }
    }
  }

  function render() {
    if (!container) return;

    container.innerHTML = `
      <div class="tp-formula-summary-header" role="button" tabindex="0" title="Bấm để đóng / mở bảng công thức" aria-expanded="${isExpanded}">
        <div class="tp-formula-summary-title">
          <span class="tp-formula-summary-icon">📐</span>
          <span>${title}</span>
          <span class="tp-formula-summary-count">${currentFormulas.length} công thức</span>
        </div>
        <div class="tp-formula-summary-actions">
          <span class="tp-badge tp-badge-tag">${badge}</span>
          <span class="tp-formula-summary-toggle">${isExpanded ? '▾' : '▸'}</span>
        </div>
      </div>
      <div class="tp-formula-summary-body" style="display: ${isExpanded ? 'flex' : 'none'};">
        ${currentFormulas.length === 0 ? `
          <div style="font-size: var(--text-xs); color: var(--text-dim); font-style: italic; padding: 8px 0;">
            Chưa có công thức nào được liệt kê cho bài học này.
          </div>
        ` : ''}
        ${currentFormulas.map((item, idx) => {
          const formulaTex = item.formula || '';
          const displayMode = item.displayMode !== false;
          const mathBlock = displayMode
            ? `$$${formulaTex}$$`
            : `$${formulaTex}$`;

          const rawShape = (item.shape || '').trim();
          const shapeMath = rawShape
            ? (rawShape.includes('$') ? rawShape : `$${rawShape}$`)
            : '';

          return `
            <div class="tp-formula-card" data-idx="${idx}">
              <div class="tp-formula-card-header">
                <div class="tp-formula-card-title-wrap">
                  <span class="tp-formula-card-num">${idx + 1}</span>
                  <span class="tp-formula-card-title">${renderInlineMath(item.title || '')}</span>
                </div>
                <div class="tp-formula-card-tags">
                  ${(item.tags || []).map(t => `<span class="tp-formula-tag">${t}</span>`).join('')}
                  ${shapeMath ? `<span class="tp-formula-tag shape">${renderInlineMath(shapeMath)}</span>` : ''}
                  ${formulaTex ? `
                    <button type="button" class="tp-btn-ghost btn-copy-formula" data-formula="${encodeURIComponent(formulaTex)}" title="Sao chép mã LaTeX">
                      📋 Copy
                    </button>
                  ` : ''}
                </div>
              </div>
              <div class="tp-formula-card-math">
                ${renderInlineMath(mathBlock)}
              </div>
              ${item.description ? `
                <div class="tp-formula-card-desc">
                  ${renderInlineMath(item.description)}
                </div>
              ` : ''}
              ${item.takeaway ? `
                <div class="tp-formula-card-takeaway">
                  <span class="tp-formula-takeaway-icon">💡</span>
                  <div class="tp-formula-takeaway-text">${renderInlineMath(item.takeaway)}</div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Toggle expand/collapse
    const header = container.querySelector('.tp-formula-summary-header');
    if (header) {
      const toggle = () => {
        isExpanded = !isExpanded;
        const body = container.querySelector('.tp-formula-summary-body');
        const icon = container.querySelector('.tp-formula-summary-toggle');
        header.setAttribute('aria-expanded', String(isExpanded));
        if (body) body.style.display = isExpanded ? 'flex' : 'none';
        if (icon) icon.textContent = isExpanded ? '▾' : '▸';
      };
      header.addEventListener('click', toggle);
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    }

    // Copy formula handler
    container.querySelectorAll('.btn-copy-formula').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tex = decodeURIComponent(btn.getAttribute('data-formula') || '');
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(tex).then(() => {
            const original = btn.innerHTML;
            btn.innerHTML = '✓ Copied';
            btn.style.color = 'var(--color-positive)';
            setTimeout(() => {
              btn.innerHTML = original;
              btn.style.color = '';
            }, 1800);
          }).catch(() => {});
        }
      });
    });
  }

  render();

  if (typeof window !== 'undefined' && typeof whenKaTeXReady === 'function') {
    whenKaTeXReady().then(() => {
      if (container && typeof renderAllInlineMath === 'function') {
        renderAllInlineMath(container);
      }
    });
  }

  return {
    setFormulas: (newFormulas) => {
      currentFormulas = [...newFormulas];
      render();
    },
    toggle: () => {
      isExpanded = !isExpanded;
      render();
    },
    isExpanded: () => isExpanded,
    getFormulas: () => [...currentFormulas]
  };
}
