/**
 * StepWizard Component (Socratic Narrative & Guided Progression)
 * Handles problem -> mechanism -> action -> takeaway cards, navigation buttons, and arrow keys.
 */

import { renderInlineMath } from '../katex-render.js';

export function createStepWizard(container, options = {}) {
  const {
    steps = [],
    initialStep = 1,
    onStepChange = () => {}
  } = options;

  let currentStep = Math.max(1, Math.min(initialStep, steps.length || 1));

  // Build DOM layout
  container.innerHTML = `
    <div class="step-wizard-wrap">
      <div class="wizard-header-bar" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 0.75rem;">
        <div class="wizard-step-indicator-group" style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
          <span class="tp-badge tp-badge-step wizard-step-badge">Bước ${currentStep} / ${steps.length}</span>
          <select class="tp-step-select" aria-label="Chọn bước học" title="Chuyển nhanh tới bước học">
            ${steps.map((s, idx) => {
              const rawTitle = (s.heading || `Bước ${idx + 1}`)
                .replace(/<[^>]+>/g, '')
                .replace(/\$[^$]+\$/g, '')
                .replace(/\\/g, '')
                .trim();
              return `<option value="${idx + 1}" ${idx + 1 === currentStep ? 'selected' : ''}>${idx + 1}. ${rawTitle}</option>`;
            }).join('')}
          </select>
        </div>
        <div class="tp-step-dots wizard-step-dots"></div>
      </div>

      <h2 class="wizard-heading" style="font-size: var(--text-xl); font-weight: 700; color: #ffffff; margin-bottom: 1rem; line-height: 1.3;"></h2>

      <div class="wizard-cards socratic-cards-list"></div>

      <div class="wizard-slot-last-step" style="display: none; margin-top: 1.25rem;"></div>

      <div class="wizard-nav" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem;">
        <button class="tp-btn tp-btn-secondary btn-wizard-prev" title="Phím tắt: ←">◀ Trước</button>
        <div class="wizard-nav-hint" style="font-size: 0.75rem; color: var(--text-dim); display: flex; align-items: center; gap: 4px;">
          <span class="socratic-kbd">←</span> <span class="socratic-kbd">→</span>
          <span class="wizard-nav-hint-text">Dùng phím mũi tên</span>
        </div>
        <button class="tp-btn tp-btn-primary btn-wizard-next" title="Phím tắt: →">Tiếp Theo ▶</button>
      </div>
    </div>
  `;

  const badgeEl = container.querySelector('.wizard-step-badge');
  const headingEl = container.querySelector('.wizard-heading');
  const cardsContainer = container.querySelector('.wizard-cards');
  const dotsEl = container.querySelector('.wizard-step-dots');
  const selectEl = container.querySelector('.tp-step-select');
  const prevBtn = container.querySelector('.btn-wizard-prev');
  const nextBtn = container.querySelector('.btn-wizard-next');

  if (selectEl) {
    selectEl.addEventListener('change', (e) => {
      setStep(parseInt(e.target.value, 10));
    });
  }

  function renderDots() {
    dotsEl.innerHTML = steps.map((_, i) => {
      const stepNum = i + 1;
      return `<div class="tp-step-dot ${stepNum === currentStep ? 'active' : ''}" data-step="${stepNum}"></div>`;
    }).join('');

    dotsEl.querySelectorAll('.tp-step-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        setStep(parseInt(dot.getAttribute('data-step'), 10));
      });
    });
  }

  function updateView() {
    const stepData = steps[currentStep - 1] || {};
    badgeEl.textContent = stepData.badge || `Bước ${currentStep} / ${steps.length}`;
    headingEl.innerHTML = renderInlineMath(stepData.heading || '');

    if (selectEl) {
      selectEl.value = currentStep;
    }

    const cards = getStepCards(stepData);
    cardsContainer.innerHTML = cards.map((c, idx) => {
      const stepBadges = {
        problem: '1. VẤN ĐỀ',
        mechanism: '2. BẢN CHẤT',
        action: '3. THỰC NGHIỆM',
        challenge: '3. THỬ THÁCH',
        takeaway: '4. ĐÚC KẾT'
      };
      const badgeText = stepBadges[c.type] || `BƯỚC ${idx + 1}`;

      const highlightCues = (str) => {
        return str
          .replace(/(^|[\s(])"([^"\n<>=]+)"/g, '$1<span class="socratic-target-btn">"$2"</span>')
          .replace(/`([^`]+)`/g, '<code class="socratic-code-badge">$1</code>')
          .replace(/(•\s*)/g, '<span class="socratic-bullet">•</span> ');
      };

      let contentHtml = '';
      const rawContent = c.content || '';
      const isActionCard = c.type === 'action' || c.type === 'challenge';
      const hasActionMarker = /👉\s*Thao tác/i.test(rawContent);
      const hasObsMarker = /👁️\s*Quan sát/i.test(rawContent);

      if (isActionCard && (hasActionMarker || hasObsMarker)) {
        let actionText = '';
        let obsText = '';

        if (hasActionMarker && hasObsMarker) {
          const parts = rawContent.split(/👁️\s*Quan sát[^:]*:?/i);
          actionText = parts[0].replace(/👉\s*Thao tác[^:]*:?/i, '').trim();
          obsText = (parts[1] || '').trim();
        } else if (hasActionMarker) {
          actionText = rawContent.replace(/👉\s*Thao tác[^:]*:?/i, '').trim();
        } else {
          obsText = rawContent.replace(/👁️\s*Quan sát[^:]*:?/i, '').trim();
        }

        let boxesHtml = '<div class="socratic-split-action">';
        if (actionText) {
          const actionParas = actionText.split('\n').filter(p => p.trim());
          const formattedAction = actionParas.length > 1
            ? actionParas.map(p => `<p class="socratic-p">${highlightCues(renderInlineMath(p))}</p>`).join('')
            : highlightCues(renderInlineMath(actionText));

          boxesHtml += `
            <div class="socratic-subbox action-subbox">
              <div class="socratic-subbox-header">
                <span class="socratic-subbox-icon">👉</span>
                <span class="socratic-subbox-tag action">Thao Tác (Cột 2)</span>
              </div>
              <div class="socratic-subbox-body">${formattedAction}</div>
            </div>
          `;
        }
        if (obsText) {
          const obsParas = obsText.split('\n').filter(p => p.trim());
          const formattedObs = obsParas.length > 1
            ? obsParas.map(p => `<p class="socratic-p">${highlightCues(renderInlineMath(p))}</p>`).join('')
            : highlightCues(renderInlineMath(obsText));

          boxesHtml += `
            <div class="socratic-subbox obs-subbox">
              <div class="socratic-subbox-header">
                <span class="socratic-subbox-icon">👁️</span>
                <span class="socratic-subbox-tag obs">Điểm Nhìn (Cột 3)</span>
              </div>
              <div class="socratic-subbox-body">${formattedObs}</div>
            </div>
          `;
        }
        boxesHtml += '</div>';
        contentHtml = boxesHtml;
      } else {
        // Normal content (problem, mechanism, takeaway)
        const paras = rawContent.split('\n').filter(p => p.trim());
        if (paras.length > 1) {
          contentHtml = paras.map(p => {
            const trimmed = p.trim();
            if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
              return `<div class="socratic-display-math">${renderInlineMath(trimmed)}</div>`;
            }
            return `<p class="socratic-p">${highlightCues(renderInlineMath(p))}</p>`;
          }).join('');
        } else {
          const trimmed = rawContent.trim();
          if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
            contentHtml = `<div class="socratic-display-math">${renderInlineMath(trimmed)}</div>`;
          } else {
            contentHtml = highlightCues(renderInlineMath(rawContent));
          }
        }
      }

      return `
        <div class="socratic-card ${c.type}">
          <div class="socratic-card-icon">${c.icon}</div>
          <div class="socratic-card-main">
            <div class="socratic-card-header">
              <span class="socratic-step-pill ${c.type}">${badgeText}</span>
              <div class="socratic-card-title">${renderInlineMath(c.title || '')}</div>
            </div>
            <div class="socratic-card-text ${c.type}-text">${contentHtml}</div>
          </div>
        </div>
      `;
    }).join('');

    prevBtn.disabled = currentStep <= 1;
    nextBtn.disabled = currentStep >= steps.length;

    // Slot for formula summary & concluding synthesis on the final slide
    const isLastStep = currentStep === steps.length;
    const lastStepSlot = container.querySelector?.('.wizard-slot-last-step');
    if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
      const extFormulaMount = document.getElementById('mount-formula-summary');
      if (extFormulaMount && lastStepSlot) {
        if (typeof lastStepSlot.appendChild === 'function' && extFormulaMount.parentElement !== lastStepSlot) {
          lastStepSlot.appendChild(extFormulaMount);
        }
        if (lastStepSlot.style) lastStepSlot.style.display = isLastStep ? 'block' : 'none';
        if (extFormulaMount.style) extFormulaMount.style.display = isLastStep ? 'block' : 'none';
      } else if (lastStepSlot && lastStepSlot.style) {
        lastStepSlot.style.display = isLastStep ? 'block' : 'none';
      }
    }

    renderDots();
  }

  function setStep(newStep) {
    if (newStep < 1 || newStep > steps.length) return;
    currentStep = newStep;
    updateView();

    // Auto-scroll narrative column smoothly to top so user always reads from Card 1
    const col = container.closest('.column') || container.closest('#narrative-column') || container.parentElement;
    if (col && typeof col.scrollTo === 'function') {
      col.scrollTo({ top: 0, behavior: 'smooth' });
    }

    onStepChange(currentStep, steps[currentStep - 1]);
  }

  function prev() {
    if (currentStep > 1) setStep(currentStep - 1);
  }

  function next() {
    if (currentStep < steps.length) setStep(currentStep + 1);
  }

  // Event handlers
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  const keyHandler = (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    }
  };

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', keyHandler);
  }

  // Initial render
  updateView();

  return {
    getStep: () => currentStep,
    setStep,
    prev,
    next,
    destroy: () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', keyHandler);
      }
    }
  };
}

export function isActionText(text = '') {
  if (!text) return false;
  const trimmed = text.trim();
  const actionRegex = /^(bấm|nhấn|kéo|click|chọn|thử|hãy|xem thẻ|chuyển qua|chuyển đổi|bật công tắc|tăng giảm|di chuyển|đổi giá trị|quan sát|hãy click)/i;
  return actionRegex.test(trimmed);
}

export function getStepCards(stepData = {}) {
  const cards = [];

  // 1. Problem / Bối cảnh & Vấn đề
  if (stepData.problem) {
    cards.push({
      type: 'problem',
      icon: '🎯',
      title: stepData.problemTitle || 'Bối Cảnh & Vấn Đề',
      content: stepData.problem
    });
  }

  // 2. Mechanism / Cơ chế vận hành
  if (stepData.mechanism) {
    cards.push({
      type: 'mechanism',
      icon: '⚙️',
      title: stepData.mechanismTitle || 'Cơ Chế Vận Hành',
      content: stepData.mechanism
    });
  }

  // 3. Action / Thao tác trải nghiệm
  if (stepData.action) {
    cards.push({
      type: 'action',
      icon: '🧪',
      title: stepData.actionTitle || 'Thao Tác Trải Nghiệm',
      content: stepData.action
    });
  }

  // 4. Fallback for challenge field (when mechanism or action isn't separated)
  if (stepData.challenge && !stepData.mechanism && !stepData.action) {
    const isAction = isActionText(stepData.challenge);
    cards.push({
      type: isAction ? 'action' : 'mechanism',
      icon: isAction ? '🧪' : '⚙️',
      title: stepData.challengeTitle || (isAction ? 'Thao Tác Trải Nghiệm' : 'Cơ Chế Vận Hành'),
      content: stepData.challenge
    });
  } else if (stepData.challenge && (stepData.mechanism || stepData.action)) {
    cards.push({
      type: 'action',
      icon: '🧪',
      title: stepData.challengeTitle || 'Thao Tác Trải Nghiệm',
      content: stepData.challenge
    });
  }

  // 5. Takeaway / Đúc kết cốt lõi
  if (stepData.takeaway) {
    cards.push({
      type: 'takeaway',
      icon: '💡',
      title: stepData.takeawayTitle || 'Đúc Kết Cốt Lõi',
      content: stepData.takeaway
    });
  }

  return cards;
}

export class StepWizard {
  constructor(arg1, arg2) {
    let options = arg2 || {};
    let parent = null;
    if (arg1 instanceof HTMLElement || (typeof arg1 === 'object' && arg1 && arg1.nodeType === 1)) {
      parent = arg1;
    } else if (typeof arg1 === 'object' && arg1) {
      options = arg1;
      if (options.container) parent = options.container;
      else if (options.containerId) parent = document.getElementById(options.containerId);
    }
    this.container = parent;
    this.steps = options.steps || [];
    this.stepMap = new Map();
    this.steps.forEach(s => {
      this.stepMap.set(s.id, { ...s });
    });

    if (this.container) {
      this.render();
    }
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="step-wizard-flow" style="display: flex; flex-direction: column; gap: 1rem;">
        ${this.steps.map(step => `
          <div class="tp-card step-card" id="${step.id}-card" style="padding: 1.1rem; border-radius: 8px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); min-width: 0; overflow-x: auto;">
            <div style="font-size: 0.95rem; font-weight: 700; color: var(--color-primary, #38bdf8); margin-bottom: 0.6rem; display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary, #38bdf8);"></span>
              <span>${renderInlineMath(step.title)}</span>
            </div>
            <div class="step-content" id="${step.id}-content" style="font-size: 0.875rem; line-height: 1.6; color: var(--text-color, #e2e8f0); min-width: 0; overflow-x: auto;">
              ${step.content || ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  updateStep(stepId, data = {}) {
    const step = this.stepMap.get(stepId);
    if (!step) return;
    if (data.content !== undefined) step.content = data.content;
    if (data.title !== undefined) step.title = data.title;

    const contentEl = this.container?.querySelector(`#${stepId}-content`);
    if (contentEl && data.content !== undefined) {
      contentEl.innerHTML = data.content;
    }
  }
}

