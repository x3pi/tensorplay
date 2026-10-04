/**
 * TensorPlay Global Shortcuts Handler
 * Manages keyboard shortcuts and the help overlay.
 */

export const SHORTCUTS_CONFIG = [
  { key: '←', desc: 'Lùi về một bước trong bài học hiện tại' },
  { key: '→', desc: 'Tiến tới một bước trong bài học hiện tại' },
  { key: '1 - 9', desc: 'Chọn nhanh tình huống mồi (Preset 1 đến 9)' },
  { key: 'R', desc: 'Reset trạng thái Canvas về giá trị mặc định của bước' },
  { key: '?', desc: 'Bật / tắt bảng trợ giúp phím tắt này' },
  { key: 'Esc', desc: 'Đóng bảng trợ giúp hoặc các cửa sổ đang mở' }
];

export class ShortcutsManager {
  constructor(engine) {
    this.engine = engine;
    this.modalEl = document.getElementById('modal-shortcuts');
    this.modalBodyEl = document.getElementById('modal-shortcuts-body');
    this.closeBtnEl = document.getElementById('btn-close-modal');
    this.shortcutsBtnEl = document.getElementById('btn-shortcuts');

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    if (!this.modalBodyEl) return;
    this.modalBodyEl.innerHTML = SHORTCUTS_CONFIG.map(s => `
      <div class="shortcut-row">
        <span class="shortcut-desc">${s.desc}</span>
        <kbd>${s.key}</kbd>
      </div>
    `).join('');
  }

  bindEvents() {
    // Open modal button in header
    if (this.shortcutsBtnEl) {
      this.shortcutsBtnEl.addEventListener('click', () => this.toggleModal());
    }

    // Close button inside modal
    if (this.closeBtnEl) {
      this.closeBtnEl.addEventListener('click', () => this.closeModal());
    }

    // Click outside modal backdrop to close
    if (this.modalEl) {
      this.modalEl.addEventListener('click', (e) => {
        if (e.target === this.modalEl) {
          this.closeModal();
        }
      });
    }

    // Global Keydown Handler
    window.addEventListener('keydown', (e) => {
      // Ignore if user is currently typing in an input/select
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        this.closeModal();
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        this.toggleModal();
        return;
      }

      // If modal is currently open, don't execute background lesson actions
      if (this.isOpen()) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.engine.prevStep();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.engine.nextStep();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        this.engine.resetCurrentStep();
      } else if (e.key >= '1' && e.key <= '9') {
        const presetIndex = parseInt(e.key, 10) - 1;
        this.engine.selectPresetByIndex(presetIndex);
      }
    });
  }

  isOpen() {
    return this.modalEl && !this.modalEl.classList.contains('hidden');
  }

  openModal() {
    if (this.modalEl) {
      this.modalEl.classList.remove('hidden');
    }
  }

  closeModal() {
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
  }

  toggleModal() {
    if (this.isOpen()) {
      this.closeModal();
    } else {
      this.openModal();
    }
  }
}
