/**
 * TensorPlay Core Engine
 * Central coordinator: State Machine, Dynamic Lesson Loader, Event Bus, and Telemetry Bridge.
 */

import { ProgressManager, progress } from './progress.js';
import { ShortcutsManager } from './shortcuts.js';
import { Router } from './router.js';
import { LayoutManager } from './layout.js';
import { KaTeXRenderer } from './components/KaTeXRenderer.js';
import { MemoryVisualizer } from './components/MemoryVisualizer.js';
import { ProbabilityBar } from './components/ProbabilityBar.js';

export class Engine {
  constructor() {
    this.registry = null;
    this.currentLessonId = null;
    this.manifest = null;
    this.logicInstance = null;
    this.canvasInstance = null;
    this.currentStep = 1;
    this.currentPresetId = null;

    // Submodules
    this.progress = progress;
    this.layout = new LayoutManager();
    this.shortcuts = new ShortcutsManager(this);
    this.router = new Router(this);

    // Telemetry components
    this.memoryVisualizer = new MemoryVisualizer(document.getElementById('memory-visualizer-mount'));
    this.probabilityBar = new ProbabilityBar(document.getElementById('score-display-mount'));
  }

  async init() {
    try {
      // 1. Fetch registry
      const response = await fetch('./lessons/registry.json');
      if (!response.ok) {
        throw new Error(`Failed to load registry: ${response.statusText}`);
      }
      this.registry = await response.json();

      // 2. Populate Header Pickers
      this.populateTrackAndLessonSelects();

      // 3. Bind Header Event Listeners
      this.bindHeaderEvents();

      // 4. Update Header Global Progress
      this.updateGlobalProgress();

      // 5. Initial routing
      const { lessonId, step, preset } = this.router.parseHash();
      const initialLessonId = lessonId || this.getDefaultLessonId();
      await this.loadLesson(initialLessonId, step, preset);

    } catch (err) {
      console.error('Engine initialization error:', err);
      const headingEl = document.getElementById('step-heading');
      if (headingEl) {
        headingEl.innerHTML = `<span style="color: var(--color-negative);">Lỗi khởi động: ${err.message}</span>`;
      }
    }
  }

  getDefaultLessonId() {
    // Check localStorage first
    const saved = this.progress.load();
    const lastActive = Object.keys(saved).find(k => saved[k] && !saved[k].completed);
    if (lastActive && this.registry.lessons.some(l => l.id === lastActive)) {
      return lastActive;
    }
    // Fallback to first registered lesson
    return this.registry.lessons[0]?.id || 'bai_01_robot_vision';
  }

  populateTrackAndLessonSelects() {
    const trackSelect = document.getElementById('track-select');
    const lessonSelect = document.getElementById('lesson-select');
    if (!trackSelect || !lessonSelect || !this.registry) return;

    // Populate Tracks
    trackSelect.innerHTML = `<option value="all">Tất cả Track (${this.registry.tracks.length})</option>` +
      this.registry.tracks.map(t => `<option value="${t.id}">${t.title}</option>`).join('');

    // Populate Lessons
    this.renderLessonOptions('all');
  }

  renderLessonOptions(selectedTrackId) {
    const lessonSelect = document.getElementById('lesson-select');
    if (!lessonSelect || !this.registry) return;

    const filtered = selectedTrackId === 'all'
      ? this.registry.lessons
      : this.registry.lessons.filter(l => l.trackId === selectedTrackId);

    lessonSelect.innerHTML = filtered.map(l => {
      const isDone = this.progress.getLessonProgress(l.id).completed ? '✓ ' : '';
      return `<option value="${l.id}">${isDone}${l.title}</option>`;
    }).join('');

    if (this.currentLessonId) {
      lessonSelect.value = this.currentLessonId;
    }
  }

  bindHeaderEvents() {
    const trackSelect = document.getElementById('track-select');
    const lessonSelect = document.getElementById('lesson-select');
    const btnResetProg = document.getElementById('btn-reset-progress');
    const btnPrev = document.getElementById('btn-prev-step');
    const btnNext = document.getElementById('btn-next-step');
    const btnResetCanvas = document.getElementById('btn-reset-canvas');

    if (trackSelect) {
      trackSelect.addEventListener('change', (e) => {
        this.renderLessonOptions(e.target.value);
      });
    }

    if (lessonSelect) {
      lessonSelect.addEventListener('change', (e) => {
        this.navigateTo(e.target.value, 1, null);
      });
    }

    if (btnResetProg) {
      btnResetProg.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến độ học tập?')) {
          this.progress.resetAll();
          this.updateGlobalProgress();
          this.populateTrackAndLessonSelects();
          this.goToStep(1);
        }
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', () => this.prevStep());
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => this.nextStep());
    }

    if (btnResetCanvas) {
      btnResetCanvas.addEventListener('click', () => this.resetCurrentStep());
    }
  }

  navigateTo(lessonId, step = null, preset = null) {
    if (lessonId !== this.currentLessonId) {
      this.loadLesson(lessonId, step, preset);
    } else {
      if (step) this.goToStep(step);
      if (preset) this.selectPreset(preset);
    }
  }

  async loadLesson(lessonId, initialStep = null, initialPresetId = null) {
    const lessonInfo = this.registry.lessons.find(l => l.id === lessonId);
    if (!lessonInfo) {
      console.warn(`Lesson ${lessonId} not found in registry.`);
      return;
    }

    this.currentLessonId = lessonId;

    // Update lesson dropdown
    const lessonSelect = document.getElementById('lesson-select');
    if (lessonSelect) lessonSelect.value = lessonId;

    try {
      // 1. Fetch manifest
      const manifestRes = await fetch(`./lessons/${lessonInfo.dir}/manifest.json`);
      if (!manifestRes.ok) throw new Error(`Cannot load manifest: ${manifestRes.statusText}`);
      this.manifest = await manifestRes.json();

      // 2. Import Logic and CustomCanvas modules dynamically
      const logicModule = await import(`../lessons/${lessonInfo.dir}/logic.js`);
      const canvasModule = await import(`../lessons/${lessonInfo.dir}/custom_canvas.js`);

      // 3. Instantiate logic
      this.logicInstance = new logicModule.LessonLogic();

      // 4. Instantiate canvas into mount point
      const canvasMount = document.getElementById('canvas-mount-point');
      if (canvasMount) {
        canvasMount.innerHTML = '';
        this.canvasInstance = new canvasModule.CustomCanvas(canvasMount, this);
      }

      // 5. Render Meta bar (course mapping, tags, difficulty)
      this.renderLessonMetaBar();

      // 6. Render Presets bar
      this.renderPresetsBar();

      // 7. Resolve starting step
      const savedStep = this.progress.getLessonProgress(lessonId).lastStep || 1;
      const targetStep = (initialStep !== null && !isNaN(initialStep)) ? initialStep : savedStep;
      
      this.goToStep(targetStep);

      // 8. If initial preset is specified, apply it
      if (initialPresetId) {
        this.selectPreset(initialPresetId);
      }

    } catch (err) {
      console.error(`Failed loading lesson package ${lessonId}:`, err);
      const headingEl = document.getElementById('step-heading');
      if (headingEl) {
        headingEl.innerHTML = `<span style="color: var(--color-negative);">Lỗi nạp bài học: ${err.message}</span>`;
      }
    }
  }

  renderLessonMetaBar() {
    const metaBar = document.getElementById('lesson-meta-bar');
    if (!metaBar || !this.manifest) return;

    const course = this.manifest.courseMapping?.track || '';
    const diff = this.manifest.difficulty || 'beginner';
    const estTime = this.manifest.estimatedMinutes ? `${this.manifest.estimatedMinutes} phút` : '';
    const tags = this.manifest.tags || [];

    metaBar.innerHTML = `
      ${course ? `<span class="tag-badge" style="color: var(--color-info); border-color: rgba(6, 182, 212, 0.3);">📘 ${course}</span>` : ''}
      <span class="diff-badge ${diff}">${diff}</span>
      ${estTime ? `<span class="tag-badge">⏱️ ${estTime}</span>` : ''}
      ${tags.map(t => `<span class="tag-badge">#${t}</span>`).join('')}
    `;
  }

  renderPresetsBar() {
    const container = document.getElementById('presets-container');
    const buttonsContainer = document.getElementById('presets-buttons');
    if (!container || !buttonsContainer) return;

    const presets = this.manifest.presets || [];
    if (presets.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    buttonsContainer.innerHTML = presets.map((p, idx) => `
      <button class="btn-preset ${this.currentPresetId === p.id ? 'active' : ''}" 
              data-preset-id="${p.id}" 
              title="${p.description || ''} (Phím: ${idx + 1})">
        ${p.label}
      </button>
    `).join('');

    buttonsContainer.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = btn.getAttribute('data-preset-id');
        this.selectPreset(pId);
      });
    });
  }

  selectPreset(presetId) {
    if (!this.manifest || !this.manifest.presets) return;
    const preset = this.manifest.presets.find(p => p.id === presetId);
    if (!preset) return;

    this.currentPresetId = presetId;

    // Highlight button in presets bar
    document.querySelectorAll('#presets-buttons .btn-preset').forEach(btn => {
      if (btn.getAttribute('data-preset-id') === presetId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Apply preset to logic
    if (this.logicInstance && this.logicInstance.applyPreset) {
      const calcResult = this.logicInstance.applyPreset(preset.state);
      // Update canvas to match preset state
      if (this.canvasInstance && this.canvasInstance.updateFromLogic) {
        this.canvasInstance.updateFromLogic(this.logicInstance.state);
      }
      this.updateTelemetry(calcResult);
    }

    // Sync URL router
    this.router.updateUrl(this.currentLessonId, this.currentStep, this.currentPresetId);
  }

  selectPresetByIndex(index) {
    if (!this.manifest || !this.manifest.presets) return;
    const preset = this.manifest.presets[index];
    if (preset) {
      this.selectPreset(preset.id);
    }
  }

  goToStep(stepNumber) {
    if (!this.manifest) return;
    const totalSteps = this.manifest.totalSteps || this.manifest.steps.length;
    const safeStep = Math.max(1, Math.min(stepNumber, totalSteps));
    this.currentStep = safeStep;

    const stepData = this.manifest.steps.find(s => s.step === safeStep) || this.manifest.steps[safeStep - 1] || {};

    // 1. Update narrative elements
    const stepBadge = document.getElementById('step-badge');
    const stepHeading = document.getElementById('step-heading');
    const problemText = document.getElementById('problem-text');
    const challengeText = document.getElementById('challenge-text');
    const takeawayText = document.getElementById('takeaway-text');

    if (stepBadge) stepBadge.textContent = stepData.badge || `Bước ${safeStep} / ${totalSteps}`;
    if (stepHeading) stepHeading.textContent = stepData.heading || `Bước ${safeStep}`;
    if (problemText) problemText.innerHTML = KaTeXRenderer.renderInlineMath(stepData.problem || '');
    if (challengeText) challengeText.innerHTML = KaTeXRenderer.renderInlineMath(stepData.challenge || '');
    if (takeawayText) takeawayText.innerHTML = KaTeXRenderer.renderInlineMath(stepData.takeaway || '');

    // 2. Render Step Dots
    this.renderStepDots(safeStep, totalSteps);

    // 3. Update Prev / Next buttons state
    const btnPrev = document.getElementById('btn-prev-step');
    const btnNext = document.getElementById('btn-next-step');
    if (btnPrev) btnPrev.disabled = (safeStep === 1);
    if (btnNext) btnNext.disabled = (safeStep === totalSteps);

    // 4. Notify Canvas
    if (this.canvasInstance && this.canvasInstance.onStepChange) {
      this.canvasInstance.onStepChange(safeStep, stepData);
    }

    // 5. Recalculate logic and update telemetry
    if (this.logicInstance) {
      const calcResult = this.logicInstance.calculate();
      this.updateTelemetry(calcResult);
    }

    // 6. Save step progress
    this.progress.setLastStep(this.currentLessonId, safeStep);
    this.updateGlobalProgress();

    // 7. Update URL router
    this.router.updateUrl(this.currentLessonId, this.currentStep, this.currentPresetId);
  }

  renderStepDots(currentStep, totalSteps) {
    const dotsContainer = document.getElementById('step-dots');
    if (!dotsContainer) return;

    const prog = this.progress.getLessonProgress(this.currentLessonId);
    const completedSteps = prog.completedSteps || [];

    let html = '';
    for (let i = 1; i <= totalSteps; i++) {
      const isActive = i === currentStep ? 'active' : '';
      const isCompleted = completedSteps.includes(i) ? 'completed' : '';
      html += `<div class="step-dot ${isActive} ${isCompleted}" data-step="${i}" title="Bước ${i}"></div>`;
    }
    dotsContainer.innerHTML = html;

    dotsContainer.querySelectorAll('.step-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const stepNum = parseInt(dot.getAttribute('data-step'), 10);
        this.goToStep(stepNum);
      });
    });
  }

  nextStep() {
    if (!this.manifest) return;
    const totalSteps = this.manifest.totalSteps || this.manifest.steps.length;
    if (this.currentStep < totalSteps) {
      // Mark current step as completed
      this.progress.markStepCompleted(this.currentLessonId, this.currentStep);
      this.goToStep(this.currentStep + 1);
    } else {
      // Completed entire lesson
      this.progress.markLessonCompleted(this.currentLessonId, true);
      this.updateGlobalProgress();
      alert('🎉 Chúc mừng! Bạn đã hoàn thành bài học này!');
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  resetCurrentStep() {
    if (this.logicInstance && this.logicInstance.reset) {
      const calcResult = this.logicInstance.reset();
      if (this.canvasInstance && this.canvasInstance.updateFromLogic) {
        this.canvasInstance.updateFromLogic(this.logicInstance.state);
      }
      this.currentPresetId = null;
      document.querySelectorAll('#presets-buttons .btn-preset').forEach(b => b.classList.remove('active'));
      this.updateTelemetry(calcResult);
      this.router.updateUrl(this.currentLessonId, this.currentStep, null);
    }
  }

  /**
   * Called by CustomCanvas when the user clicks pixels, modifies weights, sliders, etc.
   */
  onUserCanvasUpdate(partialState) {
    if (!this.logicInstance) return;
    const calcResult = this.logicInstance.onUserUpdate(partialState);
    this.updateTelemetry(calcResult);

    // If logic indicates task condition is completed for this step
    if (calcResult && calcResult.isCorrect) {
      this.progress.markStepCompleted(this.currentLessonId, this.currentStep);
      this.renderStepDots(this.currentStep, this.manifest.totalSteps || this.manifest.steps.length);
      this.updateGlobalProgress();
    }
  }

  updateTelemetry(calcResult) {
    if (!calcResult) return;

    // 1. Render KaTeX live formula
    const katexMount = document.getElementById('katex-formula-mount');
    if (katexMount && calcResult.formulaKaTeX) {
      KaTeXRenderer.renderFormula(katexMount, calcResult.formulaKaTeX);
    }

    // 2. Render Score and Decisions
    if (calcResult.scoreItems) {
      this.probabilityBar.render({
        items: calcResult.scoreItems,
        verdict: calcResult.verdict
      });
    }

    // 3. Render C++ RAM memory visualization
    if (calcResult.memoryData) {
      this.memoryVisualizer.render(calcResult.memoryData);
    }
  }

  updateGlobalProgress() {
    const percentEl = document.getElementById('progress-percent');
    const fillEl = document.getElementById('progress-bar-fill');
    if (!percentEl || !fillEl || !this.registry) return;

    const pct = this.progress.calculateGlobalProgress(this.registry);
    percentEl.textContent = `${pct}%`;
    fillEl.style.width = `${pct}%`;
  }

  getAssetUrl(relativePath) {
    const lessonInfo = this.registry?.lessons?.find(l => l.id === this.currentLessonId);
    const dir = lessonInfo ? lessonInfo.dir : this.currentLessonId;
    return `./lessons/${dir}/assets/${relativePath}`;
  }
}

// Global Single Instance Bootstrapper
export const engine = new Engine();

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    engine.init();
  });
}
