/**
 * StepWizard Component (Socratic Narrative & Guided Progression)
 * Handles problem -> challenge -> takeaway cards, navigation buttons, and arrow keys.
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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <span class="tp-badge tp-badge-step wizard-step-badge">Bước ${currentStep} / ${steps.length}</span>
        <div class="tp-step-dots wizard-step-dots"></div>
      </div>

      <h2 class="wizard-heading" style="font-size: var(--text-xl); font-weight: 700; color: #ffffff; margin-bottom: 1rem; line-height: 1.3;"></h2>

      <div class="wizard-cards">
        <div class="socratic-card problem">
          <div class="socratic-card-icon">❓</div>
          <div>
            <div class="socratic-card-title">Vấn Đề Thực Tế</div>
            <div class="socratic-card-text problem-text"></div>
          </div>
        </div>

        <div class="socratic-card challenge">
          <div class="socratic-card-icon">🔧</div>
          <div>
            <div class="socratic-card-title">Thử Thách Của Bạn</div>
            <div class="socratic-card-text challenge-text"></div>
          </div>
        </div>

        <div class="socratic-card takeaway">
          <div class="socratic-card-icon">💡</div>
          <div>
            <div class="socratic-card-title">Đúc Kết Tư Duy</div>
            <div class="socratic-card-text takeaway-text"></div>
          </div>
        </div>
      </div>

      <div class="wizard-nav" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem;">
        <button class="tp-btn tp-btn-secondary btn-wizard-prev" title="Phím tắt: ←">◀ Trước</button>
        <button class="tp-btn tp-btn-primary btn-wizard-next" title="Phím tắt: →">Tiếp Theo ▶</button>
      </div>
    </div>
  `;

  const badgeEl = container.querySelector('.wizard-step-badge');
  const headingEl = container.querySelector('.wizard-heading');
  const problemEl = container.querySelector('.problem-text');
  const challengeEl = container.querySelector('.challenge-text');
  const takeawayEl = container.querySelector('.takeaway-text');
  const dotsEl = container.querySelector('.wizard-step-dots');
  const prevBtn = container.querySelector('.btn-wizard-prev');
  const nextBtn = container.querySelector('.btn-wizard-next');

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
    headingEl.textContent = stepData.heading || '';
    problemEl.innerHTML = renderInlineMath(stepData.problem || '');
    challengeEl.innerHTML = renderInlineMath(stepData.challenge || '');
    takeawayEl.innerHTML = renderInlineMath(stepData.takeaway || '');

    prevBtn.disabled = currentStep <= 1;
    nextBtn.disabled = currentStep >= steps.length;

    renderDots();
  }

  function setStep(newStep) {
    if (newStep < 1 || newStep > steps.length) return;
    currentStep = newStep;
    updateView();
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

  window.addEventListener('keydown', keyHandler);

  // Initial render
  updateView();

  return {
    getStep: () => currentStep,
    setStep,
    prev,
    next,
    destroy: () => {
      window.removeEventListener('keydown', keyHandler);
    }
  };
}
