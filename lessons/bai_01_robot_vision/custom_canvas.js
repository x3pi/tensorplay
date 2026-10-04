/**
 * Custom Canvas for Bài 1: Tự Chế Tạo 'Mắt' Cho Robot
 * Interactive 2x2 Pixel Grid, Weight Stamp Matrix, and Instant Real-time Visualizer.
 */

export class CustomCanvas {
  constructor(mountElement, engine) {
    this.mountEl = mountElement;
    this.engine = engine;

    this.state = {
      pixels: [1, 1, 0, 0],
      weights: [1, 1, -1, -1],
      activeCell: { row: 0, col: 0, index: 0 }
    };

    this.render();
  }

  render() {
    this.mountEl.innerHTML = `
      <div class="robot-canvas-wrapper" style="display: flex; flex-direction: column; gap: 20px; align-items: center; width: 100%;">
        
        <!-- Live Operation Equation Visualizer -->
        <div class="interactive-stage" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 16px; width: 100%;">
          
          <!-- Box 1: Input Image X (2x2 Matrix) -->
          <div class="matrix-card" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-strong); border-radius: var(--radius-md); padding: 14px; text-align: center; box-shadow: var(--card-shadow);">
            <div style="font-size: var(--text-xs); font-weight: 700; color: var(--color-warning); margin-bottom: 8px; text-transform: uppercase;">
              📷 Ảnh Đầu Vào X (Click để bật/tắt)
            </div>
            
            <div class="pixel-grid" style="display: grid; grid-template-columns: repeat(2, 64px); grid-gap: 8px; justify-content: center;">
              ${[0, 1, 2, 3].map(i => {
                const r = Math.floor(i / 2);
                const c = i % 2;
                return `
                  <button class="pixel-btn" data-idx="${i}" data-row="${r}" data-col="${c}" 
                          style="width: 64px; height: 64px; border-radius: var(--radius-sm); border: 2px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.15s ease; cursor: pointer;">
                    <span class="pixel-coord" style="font-size: 0.65rem; color: var(--text-dim); font-family: var(--font-mono);">(${r},${c})</span>
                    <span class="pixel-val" style="font-size: 1.15rem; font-weight: 700; font-family: var(--font-mono); margin-top: 2px;">1</span>
                    <span class="pixel-idx" style="font-size: 0.6rem; color: var(--text-dim); font-family: var(--font-mono);">[${i}]</span>
                  </button>
                `;
              }).join('')}
            </div>

            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 8px;">
              Độ phân giải: 2×2 (4 pixels)
            </div>
          </div>

          <!-- Operator Symbol -->
          <div class="math-op" style="font-size: 2rem; font-weight: 800; color: var(--color-info);">
            ·
          </div>

          <!-- Box 2: Weight Stamp W (Khuôn Dập Trọng Số) -->
          <div class="matrix-card" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-strong); border-radius: var(--radius-md); padding: 14px; text-align: center; box-shadow: var(--card-shadow);">
            <div style="font-size: var(--text-xs); font-weight: 700; color: var(--color-info); margin-bottom: 8px; text-transform: uppercase;">
              🛡️ Khuôn Trọng Số W (Click đổi dấu)
            </div>

            <div class="weight-grid" style="display: grid; grid-template-columns: repeat(2, 64px); grid-gap: 8px; justify-content: center;">
              ${[0, 1, 2, 3].map(i => {
                const r = Math.floor(i / 2);
                const c = i % 2;
                return `
                  <button class="weight-btn" data-idx="${i}" 
                          style="width: 64px; height: 64px; border-radius: var(--radius-sm); border: 2px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.15s ease; cursor: pointer;">
                    <span class="weight-label" style="font-size: 0.65rem; color: var(--text-dim); font-family: var(--font-mono);">w[${i}]</span>
                    <span class="weight-val" style="font-size: 1.15rem; font-weight: 700; font-family: var(--font-mono); margin-top: 2px;">+1</span>
                    <span class="weight-hint" style="font-size: 0.6rem; font-weight: 600;">Thưởng</span>
                  </button>
                `;
              }).join('')}
            </div>

            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 8px;">
              Xanh = Thưởng (+1) | Đỏ = Phạt (-1)
            </div>
          </div>

        </div>

        <!-- Mini Legend & Quick Sliders -->
        <div class="canvas-helpers" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; font-size: var(--text-xs); color: var(--text-muted); background: rgba(0,0,0,0.25); padding: 8px 16px; border-radius: var(--radius-full); border: 1px solid var(--border-subtle);">
          <span>💡 <em>Mẹo:</em> Click vào ô ảnh để bật/tắt photon; Click vào ô trọng số để đổi chu kỳ (+1 &rarr; -1 &rarr; 0).</span>
        </div>

      </div>
    `;

    this.bindEvents();
    this.updateUI();
  }

  bindEvents() {
    // Pixel click toggling
    this.mountEl.querySelectorAll('.pixel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const row = parseInt(btn.getAttribute('data-row'), 10);
        const col = parseInt(btn.getAttribute('data-col'), 10);

        // Toggle: 1 -> 0 -> 0.5 -> 1
        let cur = this.state.pixels[idx];
        let next;
        if (cur === 1) next = 0;
        else if (cur === 0) next = 0.5;
        else next = 1;

        const newPixels = [...this.state.pixels];
        newPixels[idx] = next;

        this.state.pixels = newPixels;
        this.state.activeCell = { row, col, index: idx };

        this.updateUI();
        this.engine.onUserCanvasUpdate(this.state);
      });
    });

    // Weight click cycling: +1 -> -1 -> 0 -> +1
    this.mountEl.querySelectorAll('.weight-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        let cur = this.state.weights[idx];
        let next;
        if (cur === 1) next = -1;
        else if (cur === -1) next = 0;
        else next = 1;

        const newWeights = [...this.state.weights];
        newWeights[idx] = next;

        this.state.weights = newWeights;
        this.updateUI();
        this.engine.onUserCanvasUpdate(this.state);
      });
    });
  }

  updateFromLogic(logicState) {
    if (!logicState) return;
    this.state = {
      ...this.state,
      ...logicState
    };
    this.updateUI();
  }

  onStepChange(stepNumber, stepData) {
    // Optionally configure guidance for specific steps
    if (stepNumber === 4) {
      // Step 4 is headlight glare demonstration
    } else if (stepNumber === 5) {
      // Step 5 encourages negative weights
    }
  }

  updateUI() {
    // 1. Update Pixels
    this.mountEl.querySelectorAll('.pixel-btn').forEach(btn => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const val = this.state.pixels[idx];
      const valEl = btn.querySelector('.pixel-val');
      const isSelected = this.state.activeCell?.index === idx;

      if (valEl) {
        valEl.textContent = Number.isInteger(val) ? val.toString() : val.toFixed(1);
      }

      if (val === 1) {
        btn.style.backgroundColor = 'var(--color-warning-bg)';
        btn.style.borderColor = 'var(--color-warning)';
        btn.style.color = 'var(--color-warning)';
        btn.style.boxShadow = '0 0 12px var(--color-warning-glow)';
      } else if (val === 0.5) {
        btn.style.backgroundColor = 'rgba(245, 158, 11, 0.08)';
        btn.style.borderColor = 'rgba(245, 158, 11, 0.5)';
        btn.style.color = '#fbbf24';
        btn.style.boxShadow = 'none';
      } else {
        btn.style.backgroundColor = '#0b0f17';
        btn.style.borderColor = 'rgba(255,255,255,0.08)';
        btn.style.color = 'var(--text-dim)';
        btn.style.boxShadow = 'none';
      }

      if (isSelected) {
        btn.style.outline = '2px solid var(--color-info)';
      } else {
        btn.style.outline = 'none';
      }
    });

    // 2. Update Weights
    this.mountEl.querySelectorAll('.weight-btn').forEach(btn => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const w = this.state.weights[idx];
      const valEl = btn.querySelector('.weight-val');
      const hintEl = btn.querySelector('.weight-hint');

      if (valEl) {
        valEl.textContent = w >= 0 ? `+${w}` : `${w}`;
      }

      if (w > 0) {
        btn.style.backgroundColor = 'var(--color-positive-bg)';
        btn.style.borderColor = 'var(--color-positive)';
        btn.style.color = 'var(--color-positive)';
        btn.style.boxShadow = '0 0 12px var(--color-positive-glow)';
        if (hintEl) {
          hintEl.textContent = '✓ Thưởng (+1)';
          hintEl.style.color = 'var(--color-positive)';
        }
      } else if (w < 0) {
        btn.style.backgroundColor = 'var(--color-negative-bg)';
        btn.style.borderColor = 'var(--color-negative)';
        btn.style.color = 'var(--color-negative)';
        btn.style.boxShadow = '0 0 12px var(--color-negative-glow)';
        if (hintEl) {
          hintEl.textContent = '✕ Phạt (-1)';
          hintEl.style.color = 'var(--color-negative)';
        }
      } else {
        btn.style.backgroundColor = '#0b0f17';
        btn.style.borderColor = 'rgba(255,255,255,0.08)';
        btn.style.color = 'var(--text-dim)';
        btn.style.boxShadow = 'none';
        if (hintEl) {
          hintEl.textContent = '○ Bỏ qua (0)';
          hintEl.style.color = 'var(--text-dim)';
        }
      }
    });
  }
}
