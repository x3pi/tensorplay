/**
 * LayoutResizer.js - TensorPlay Intelligent Adaptive Multi-Column Workspace
 * 
 * Thiết kế thông minh & linh hoạt chống méo mó, chật chội nội dung:
 * 1. Ngăn chặn co ép nội dung dưới ngưỡng tiện dụng (Enforce Healthy Min-Widths).
 * 2. Snap-to-Collapse (Hút vào thanh ray 46px): Khi kéo cột xuống dưới 170px, cột
 *    tự động biến thành thanh ray dọc (Rail) thanh lịch kèm nút mở rộng 1-chạm (▶ / ◀),
 *    nhường toàn bộ không gian cho Sân chơi tương tác (Sandbox).
 * 3. Chế độ Thích Ứng Gọn Gàng (.is-compact): Khi cột nằm trong khoảng 240px - 330px,
 *    tự động tinh chỉnh padding, font chữ và thanh cuộn công thức KaTeX để không bị vỡ.
 * 4. Hút nam châm (Magnetic Snap): Nhẹ nhàng hút vào tỉ lệ vàng mặc định (32% / 24%) khi kéo gần.
 * 5. Menu Bố Cục Thông Minh (Presets Dropdown):
 *    - ⚖️ Cân bằng: 32% | 44% | 24%
 *    - 🔬 Tiêu điểm Sân chơi: Thu gọn cả 2 cột bên, Sân chơi mở rộng 100%
 *    - 📖 Đọc sâu Dẫn dắt: 50% | 30% | 20%
 *    - 📐 Phân tích Toán & RAM: 24% | 36% | 40%
 * 6. Nút thu gọn / mở rộng nhanh trực tiếp trên tiêu đề từng cột.
 * 7. Ghi nhớ trạng thái và tỉ lệ vào LocalStorage ('tensorplay:layout:column-widths').
 */

const STORAGE_KEY = 'tensorplay:layout:column-widths';
const DEFAULT_RATIOS = { p0: 32, p2: 24 };
const MIN_WIDTHS = { col0: 240, col1: 300, col2: 240 };
const COLLAPSE_THRESHOLD = 170; // px - Ngưỡng tự động hút vào thanh ray
const EXPAND_THRESHOLD = 70;    // px - Ngưỡng kéo ra khỏi thanh ray

export const LAYOUT_PRESETS = {
  balanced: { p0: 32, p2: 24, col0Collapsed: false, col2Collapsed: false, label: 'Cân bằng' },
  'focus-sandbox': { p0: 32, p2: 24, col0Collapsed: true, col2Collapsed: true, label: 'Tiêu điểm Sân chơi' },
  'focus-narrative': { p0: 50, p2: 20, col0Collapsed: false, col2Collapsed: false, label: 'Đọc sâu Dẫn dắt' },
  'focus-telemetry': { p0: 24, p2: 40, col0Collapsed: false, col2Collapsed: false, label: 'Phân tích Toán & RAM' }
};

/**
 * Đọc cấu hình layout đã lưu từ LocalStorage
 */
export function getSavedWidths() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (
      typeof data.p0 === 'number' &&
      typeof data.p2 === 'number' &&
      data.p0 >= 15 && data.p0 <= 65 &&
      data.p2 >= 15 && data.p2 <= 65
    ) {
      return {
        p0: data.p0,
        p2: data.p2,
        col0Collapsed: Boolean(data.col0Collapsed),
        col2Collapsed: Boolean(data.col2Collapsed)
      };
    }
  } catch (err) {
    // Không ném lỗi nếu localStorage bị chặn
  }
  return null;
}

/**
 * Lưu cấu hình layout vào LocalStorage
 */
export function saveWidths(p0, p2, col0Collapsed = false, col2Collapsed = false) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ p0, p2, col0Collapsed, col2Collapsed })
    );
  } catch (err) {
    // Không ném lỗi
  }
}

/**
 * Xóa cấu hình layout đưa về mặc định
 */
export function clearSavedWidths() {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    // Không ném lỗi
  }
}

/**
 * Khởi tạo bộ điều phối co dãn đa cột thông minh
 */
export function initLayoutResizer(options = {}) {
  const doc = options.document || (typeof document !== 'undefined' ? document : globalThis.document);
  if (!doc) return null;
  const win = options.window || (typeof window !== 'undefined' ? window : globalThis.window);

  const grid = options.grid || (doc.querySelector ? doc.querySelector('.lab-grid') : null);
  if (!grid || grid.classList.contains('tp-resizable')) return null;

  const cols = Array.from(grid.querySelectorAll ? grid.querySelectorAll(':scope > .lab-col') : []);
  if (cols.length < 2) return null;

  cols.forEach(col => {
    col.style.minWidth = '0';
  });

  const saved = getSavedWidths();
  let currentP0 = saved ? saved.p0 : DEFAULT_RATIOS.p0;
  let currentP2 = saved ? saved.p2 : DEFAULT_RATIOS.p2;
  let isCol0Collapsed = saved ? saved.col0Collapsed : false;
  let isCol2Collapsed = saved ? saved.col2Collapsed : false;

  // Áp dụng class & CSS variables ban đầu
  grid.style.setProperty('--col-0-w', `${currentP0.toFixed(2)}%`);
  grid.style.setProperty('--col-2-w', `${currentP2.toFixed(2)}%`);
  grid.classList.add('tp-resizable');

  if (isCol0Collapsed) {
    grid.classList.add('col-0-collapsed');
    cols[0]?.classList.add('is-collapsed');
  }
  if (isCol2Collapsed && cols[2]) {
    grid.classList.add('col-2-collapsed');
    cols[2]?.classList.add('is-collapsed');
  }

  // 1. Tạo Thanh Ray (Collapsed Rail) và Nút Thu Gọn cho Cột 0 và Cột 2
  const rails = [];

  function setupColumnRailAndCollapse(colIndex, expandIcon, collapseIcon, colName) {
    const col = cols[colIndex];
    if (!col) return;

    // Nút thu gọn trên header của cột
    const header = col.querySelector ? col.querySelector('.lab-col-header') : null;
    if (header && !header.querySelector('.btn-col-collapse')) {
      const btnCollapse = doc.createElement('button');
      btnCollapse.type = 'button';
      btnCollapse.className = 'btn-col-collapse';
      btnCollapse.setAttribute('aria-label', `Thu gọn ${colName}`);
      btnCollapse.title = `Thu gọn ${colName} để mở rộng Sân chơi`;
      btnCollapse.innerHTML = collapseIcon;
      btnCollapse.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCollapse(colIndex);
      });
      header.appendChild(btnCollapse);
    }

    // Thanh ray dọc khi cột bị thu gọn
    let rail = col.querySelector ? col.querySelector('.lab-col-rail') : null;
    if (!rail) {
      rail = doc.createElement('div');
      rail.className = 'lab-col-rail';
      rail.setAttribute('role', 'region');
      rail.setAttribute('aria-label', `${colName} đang thu gọn`);
      rail.title = `Nhấp để mở rộng ${colName}`;
      rail.innerHTML = `
        <button type="button" class="btn-rail-expand" aria-label="Mở rộng ${colName}">${expandIcon}</button>
        <div class="rail-title-vertical">${colName}</div>
      `;
      rail.addEventListener('click', () => {
        expandColumn(colIndex);
      });
      col.appendChild(rail);
      rails.push(rail);
    }
  }

  setupColumnRailAndCollapse(0, '▶', '⮜', 'Cột 1 • Dẫn Dắt');
  if (cols.length >= 3) {
    setupColumnRailAndCollapse(2, '◀', '⮞', 'Cột 3 • Live Math');
  }

  // 2. Tạo các thanh chia (Splitters)
  const splitters = [];
  for (let i = 0; i < cols.length - 1; i++) {
    const splitter = doc.createElement('div');
    splitter.className = 'lab-splitter';
    splitter.setAttribute('role', 'separator');
    splitter.setAttribute('tabindex', '0');
    splitter.setAttribute('aria-orientation', 'vertical');
    splitter.setAttribute('data-index', String(i));
    splitter.setAttribute(
      'aria-label',
      i === 0 ? 'Thanh co dãn Cột 1 và 2' : 'Thanh co dãn Cột 2 và 3'
    );
    splitter.setAttribute('title', 'Kéo để co dãn (Kéo kịch để thu gọn ray) • Nhấp đúp để đặt lại');

    splitter.innerHTML = `
      <div class="lab-splitter-line" aria-hidden="true"></div>
      <div class="lab-splitter-handle" aria-hidden="true">
        <span class="lab-splitter-dot"></span>
        <span class="lab-splitter-dot"></span>
        <span class="lab-splitter-dot"></span>
      </div>
      <div class="lab-splitter-badge" aria-hidden="true"></div>
    `;

    cols[i].after(splitter);
    splitters.push(splitter);
  }

  // 3. Cập nhật Badge & Adaptive Compact Classes
  function updateBadgesAndAdaptive(p0, p2) {
    const p1 = Math.max(0, 100 - p0 - p2);

    splitters.forEach((sp, idx) => {
      sp.setAttribute('aria-valuenow', String(Math.round(idx === 0 ? p0 : p2)));
      const badge = sp.querySelector ? sp.querySelector('.lab-splitter-badge') : null;
      if (badge) {
        if (idx === 0 && isCol0Collapsed) {
          badge.textContent = `Cột 1 thu gọn (46px) | Sân chơi ${Math.round(100 - p2)}%`;
        } else if (idx === 1 && isCol2Collapsed) {
          badge.textContent = `Sân chơi ${Math.round(100 - p0)}% | Cột 3 thu gọn (46px)`;
        } else {
          badge.textContent = `${Math.round(p0)}% | ${Math.round(p1)}% | ${Math.round(p2)}%`;
        }
      }
    });

    // Tự động gắn .is-compact khi một cột nằm trong ngưỡng hẹp để chữ và công thức tự co dãn vừa vặn
    if (cols[0]) {
      const w0 = cols[0].clientWidth;
      if (w0 > 0 && w0 < 330 && !isCol0Collapsed) {
        cols[0].classList.add('is-compact');
      } else {
        cols[0].classList.remove('is-compact');
      }
    }

    if (cols[1]) {
      const w1 = cols[1].clientWidth;
      if (w1 > 0 && w1 < 420) {
        cols[1].classList.add('is-compact');
      } else {
        cols[1].classList.remove('is-compact');
      }
    }

    if (cols[2]) {
      const w2 = cols[2].clientWidth;
      if (w2 > 0 && w2 < 310 && !isCol2Collapsed) {
        cols[2].classList.add('is-compact');
      } else {
        cols[2].classList.remove('is-compact');
      }
    }
  }

  updateBadgesAndAdaptive(currentP0, currentP2);

  // 4. Các hàm đóng / mở thu gọn (Collapse / Expand)
  function collapseColumn(index) {
    grid.classList.add('tp-animating');
    if (index === 0) {
      isCol0Collapsed = true;
      grid.classList.add('col-0-collapsed');
      cols[0]?.classList.add('is-collapsed');
    } else if (index === 2) {
      isCol2Collapsed = true;
      grid.classList.add('col-2-collapsed');
      cols[2]?.classList.add('is-collapsed');
    }
    saveWidths(currentP0, currentP2, isCol0Collapsed, isCol2Collapsed);
    updateBadgesAndAdaptive(currentP0, currentP2);

    setTimeout(() => {
      grid.classList.remove('tp-animating');
      dispatchResizeEvents();
    }, 280);
  }

  function expandColumn(index) {
    grid.classList.add('tp-animating');
    if (index === 0) {
      isCol0Collapsed = false;
      grid.classList.remove('col-0-collapsed');
      cols[0]?.classList.remove('is-collapsed');
      if (currentP0 < 22) currentP0 = DEFAULT_RATIOS.p0;
      grid.style.setProperty('--col-0-w', `${currentP0.toFixed(2)}%`);
    } else if (index === 2) {
      isCol2Collapsed = false;
      grid.classList.remove('col-2-collapsed');
      cols[2]?.classList.remove('is-collapsed');
      if (currentP2 < 20) currentP2 = DEFAULT_RATIOS.p2;
      grid.style.setProperty('--col-2-w', `${currentP2.toFixed(2)}%`);
    }
    saveWidths(currentP0, currentP2, isCol0Collapsed, isCol2Collapsed);
    updateBadgesAndAdaptive(currentP0, currentP2);

    setTimeout(() => {
      grid.classList.remove('tp-animating');
      dispatchResizeEvents();
    }, 280);
  }

  function toggleCollapse(index) {
    if (index === 0) {
      if (isCol0Collapsed) expandColumn(0);
      else collapseColumn(0);
    } else if (index === 2) {
      if (isCol2Collapsed) expandColumn(2);
      else collapseColumn(2);
    }
  }

  // 5. Áp dụng Presets bố cục
  function applyPreset(presetKey) {
    const preset = LAYOUT_PRESETS[presetKey];
    if (!preset) return;

    grid.classList.add('tp-animating');

    currentP0 = preset.p0;
    currentP2 = preset.p2;
    isCol0Collapsed = preset.col0Collapsed;
    isCol2Collapsed = preset.col2Collapsed;

    grid.style.setProperty('--col-0-w', `${currentP0}%`);
    grid.style.setProperty('--col-2-w', `${currentP2}%`);

    if (isCol0Collapsed) {
      grid.classList.add('col-0-collapsed');
      cols[0]?.classList.add('is-collapsed');
    } else {
      grid.classList.remove('col-0-collapsed');
      cols[0]?.classList.remove('is-collapsed');
    }

    if (isCol2Collapsed) {
      grid.classList.add('col-2-collapsed');
      cols[2]?.classList.add('is-collapsed');
    } else {
      grid.classList.remove('col-2-collapsed');
      cols[2]?.classList.remove('is-collapsed');
    }

    saveWidths(currentP0, currentP2, isCol0Collapsed, isCol2Collapsed);
    updateBadgesAndAdaptive(currentP0, currentP2);

    setTimeout(() => {
      grid.classList.remove('tp-animating');
      dispatchResizeEvents();
    }, 280);
  }

  function reset() {
    clearSavedWidths();
    applyPreset('balanced');
  }

  function dispatchResizeEvents() {
    try {
      if (win && win.dispatchEvent) {
        win.dispatchEvent(new Event('resize'));
      }
      if (grid.dispatchEvent) {
        grid.dispatchEvent(new CustomEvent('tensorplay:layout-resize', {
          detail: {
            p0: currentP0,
            p2: currentP2,
            p1: 100 - currentP0 - currentP2,
            col0Collapsed: isCol0Collapsed,
            col2Collapsed: isCol2Collapsed
          }
        }));
      }
    } catch (e) {
      // ignore
    }
  }

  // 6. Kéo thả thông minh với Snap Nam Châm & Snap-to-Collapse
  let isDragging = false;
  let activeSplitterIndex = -1;
  let startX = 0;
  let startW0 = 0;
  let startW1 = 0;
  let startW2 = 0;
  let gridWidth = 0;
  let activeSplitter = null;

  function onPointerDown(e, index, splitter) {
    if (e.button !== 0) return;
    e.preventDefault();

    isDragging = true;
    activeSplitterIndex = index;
    activeSplitter = splitter;
    startX = e.clientX;

    const gridRect = grid.getBoundingClientRect();
    gridWidth = gridRect.width;

    const rect0 = cols[0].getBoundingClientRect();
    const rect1 = cols[1].getBoundingClientRect();
    const rect2 = cols[2] ? cols[2].getBoundingClientRect() : { width: 0 };

    startW0 = rect0.width;
    startW1 = rect1.width;
    startW2 = rect2.width;

    splitter.classList.add('dragging');
    if (doc.body) doc.body.classList.add('tp-resizing-columns');

    if (splitter.setPointerCapture) {
      try {
        splitter.setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    if (win && win.addEventListener) {
      win.addEventListener('pointermove', onPointerMove);
      win.addEventListener('pointerup', onPointerUp);
      win.addEventListener('pointercancel', onPointerUp);
    }

    updateBadgesAndAdaptive(currentP0, currentP2);
  }

  function onPointerMove(e) {
    if (!isDragging || activeSplitterIndex < 0 || gridWidth <= 0) return;

    const deltaX = e.clientX - startX;

    if (activeSplitterIndex === 0) {
      // Đang kéo Splitter giữa Cột 0 và Cột 1
      if (isCol0Collapsed) {
        // Nếu đang thu gọn mà kéo sang phải quá EXPAND_THRESHOLD thì mở lại cột
        if (deltaX > EXPAND_THRESHOLD) {
          isCol0Collapsed = false;
          grid.classList.remove('col-0-collapsed');
          cols[0]?.classList.remove('is-collapsed');
          startX = e.clientX;
          startW0 = MIN_WIDTHS.col0;
        } else {
          return;
        }
      }

      const targetW0 = startW0 + deltaX;

      // Hút vào thanh ray thu gọn nếu kéo quá hẹp (< COLLAPSE_THRESHOLD px)
      if (targetW0 < COLLAPSE_THRESHOLD) {
        if (!isCol0Collapsed) {
          isCol0Collapsed = true;
          grid.classList.add('col-0-collapsed');
          cols[0]?.classList.add('is-collapsed');
          updateBadgesAndAdaptive(currentP0, currentP2);
        }
        return;
      } else if (isCol0Collapsed) {
        isCol0Collapsed = false;
        grid.classList.remove('col-0-collapsed');
        cols[0]?.classList.remove('is-collapsed');
      }

      // Giới hạn an toàn chống chật chội méo mó nội dung
      const minW0 = MIN_WIDTHS.col0;
      const minW1 = MIN_WIDTHS.col1;
      const maxW0 = (startW0 + startW1) - minW1;

      const clampedW0 = Math.max(minW0, Math.min(targetW0, maxW0));
      let rawP0 = (clampedW0 / gridWidth) * 100;

      // Magnetic Snap: hút nhẹ vào tỉ lệ chuẩn 32% nếu cách khoảng 1.5%
      if (Math.abs(rawP0 - DEFAULT_RATIOS.p0) < 1.5) {
        rawP0 = DEFAULT_RATIOS.p0;
      }

      currentP0 = rawP0;
      grid.style.setProperty('--col-0-w', `${currentP0.toFixed(2)}%`);

    } else if (activeSplitterIndex === 1) {
      // Đang kéo Splitter giữa Cột 1 và Cột 2
      if (isCol2Collapsed) {
        if (deltaX < -EXPAND_THRESHOLD) {
          isCol2Collapsed = false;
          grid.classList.remove('col-2-collapsed');
          cols[2]?.classList.remove('is-collapsed');
          startX = e.clientX;
          startW2 = MIN_WIDTHS.col2;
        } else {
          return;
        }
      }

      const targetW2 = startW2 - deltaX;

      // Hút vào thanh ray nếu kéo quá hẹp
      if (targetW2 < COLLAPSE_THRESHOLD) {
        if (!isCol2Collapsed) {
          isCol2Collapsed = true;
          grid.classList.add('col-2-collapsed');
          cols[2]?.classList.add('is-collapsed');
          updateBadgesAndAdaptive(currentP0, currentP2);
        }
        return;
      } else if (isCol2Collapsed) {
        isCol2Collapsed = false;
        grid.classList.remove('col-2-collapsed');
        cols[2]?.classList.remove('is-collapsed');
      }

      const minW2 = MIN_WIDTHS.col2;
      const minW1 = MIN_WIDTHS.col1;
      const maxW2 = (startW1 + startW2) - minW1;

      const clampedW2 = Math.max(minW2, Math.min(targetW2, maxW2));
      let rawP2 = (clampedW2 / gridWidth) * 100;

      // Magnetic Snap: hút nhẹ vào tỉ lệ chuẩn 24%
      if (Math.abs(rawP2 - DEFAULT_RATIOS.p2) < 1.5) {
        rawP2 = DEFAULT_RATIOS.p2;
      }

      currentP2 = rawP2;
      grid.style.setProperty('--col-2-w', `${currentP2.toFixed(2)}%`);
    }

    updateBadgesAndAdaptive(currentP0, currentP2);
  }

  function onPointerUp(e) {
    if (!isDragging) return;

    if (win && win.removeEventListener) {
      win.removeEventListener('pointermove', onPointerMove);
      win.removeEventListener('pointerup', onPointerUp);
      win.removeEventListener('pointercancel', onPointerUp);
    }

    if (activeSplitter) {
      activeSplitter.classList.remove('dragging');
      if (activeSplitter.releasePointerCapture) {
        try {
          activeSplitter.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
    }

    if (doc.body) doc.body.classList.remove('tp-resizing-columns');
    isDragging = false;
    activeSplitterIndex = -1;
    activeSplitter = null;

    saveWidths(currentP0, currentP2, isCol0Collapsed, isCol2Collapsed);
    dispatchResizeEvents();
  }

  splitters.forEach((splitter, index) => {
    splitter.addEventListener('pointerdown', (e) => onPointerDown(e, index, splitter));

    splitter.addEventListener('dblclick', (e) => {
      e.preventDefault();
      reset();
    });

    splitter.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 4 : 1;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (index === 0) {
          if (isCol0Collapsed) {
            return;
          }
          currentP0 = Math.max(20, currentP0 - step);
          grid.style.setProperty('--col-0-w', `${currentP0.toFixed(2)}%`);
        } else {
          if (isCol2Collapsed) {
            expandColumn(2);
            return;
          }
          currentP2 = Math.min(50, currentP2 + step);
          grid.style.setProperty('--col-2-w', `${currentP2.toFixed(2)}%`);
        }
        updateBadgesAndAdaptive(currentP0, currentP2);
        saveWidths(currentP0, currentP2, isCol0Collapsed, isCol2Collapsed);
        dispatchResizeEvents();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (index === 0) {
          if (isCol0Collapsed) {
            expandColumn(0);
            return;
          }
          currentP0 = Math.min(50, currentP0 + step);
          grid.style.setProperty('--col-0-w', `${currentP0.toFixed(2)}%`);
        } else {
          if (isCol2Collapsed) {
            return;
          }
          currentP2 = Math.max(20, currentP2 - step);
          grid.style.setProperty('--col-2-w', `${currentP2.toFixed(2)}%`);
        }
        updateBadgesAndAdaptive(currentP0, currentP2);
        saveWidths(currentP0, currentP2, isCol0Collapsed, isCol2Collapsed);
        dispatchResizeEvents();
      } else if (e.key === 'Home' || e.key === 'Enter' || e.key.toLowerCase() === 'r') {
        e.preventDefault();
        reset();
      }
    });
  });

  // 7. Thêm Menu Lựa Chọn Bố Cục Thông Minh vào Header
  const headerRight = doc.querySelector ? doc.querySelector('.lab-header-right') : null;
  let menuContainer = null;

  if (headerRight && !headerRight.querySelector('.tp-layout-menu-container')) {
    menuContainer = doc.createElement('div');
    menuContainer.className = 'tp-layout-menu-container';
    menuContainer.innerHTML = `
      <button type="button" class="btn-layout-menu" title="Lựa chọn bố cục tối ưu không gian">
        <span style="font-size: 0.85rem; line-height: 1;">⎚</span>
        <span>Bố cục</span>
        <span style="font-size: 0.65rem; opacity: 0.8;">▾</span>
      </button>
      <div class="tp-layout-dropdown">
        <div class="layout-option" data-preset="balanced">
          <span class="opt-icon">⚖️</span>
          <div class="opt-text">
            <div class="opt-title">Cân bằng (Tiêu chuẩn)</div>
            <div class="opt-desc">32% Dẫn dắt • 44% Sân chơi • 24% Toán</div>
          </div>
        </div>
        <div class="layout-option" data-preset="focus-sandbox">
          <span class="opt-icon">🔬</span>
          <div class="opt-text">
            <div class="opt-title">Tiêu điểm Sân chơi</div>
            <div class="opt-desc">Thu gọn cả 2 cột bên, mở rộng sân chơi tối đa</div>
          </div>
        </div>
        <div class="layout-option" data-preset="focus-narrative">
          <span class="opt-icon">📖</span>
          <div class="opt-text">
            <div class="opt-title">Đọc sâu Dẫn dắt</div>
            <div class="opt-desc">Mở rộng Cột 1 đọc lý thuyết & chú giải</div>
          </div>
        </div>
        <div class="layout-option" data-preset="focus-telemetry">
          <span class="opt-icon">📐</span>
          <div class="opt-text">
            <div class="opt-title">Phân tích Toán & RAM</div>
            <div class="opt-desc">Mở rộng Cột 3 phân tích công thức & telemetry</div>
          </div>
        </div>
        <div class="layout-divider"></div>
        <div class="layout-option" data-preset="reset">
          <span class="opt-icon">↺</span>
          <div class="opt-text">
            <div class="opt-title">Đặt lại mặc định</div>
            <div class="opt-desc">Khôi phục kích thước ban đầu</div>
          </div>
        </div>
      </div>
    `;

    const menuBtn = menuContainer.querySelector('.btn-layout-menu');
    const dropdown = menuContainer.querySelector('.tp-layout-dropdown');

    if (menuBtn && dropdown) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
        menuBtn.classList.toggle('active');
      });

      const options = dropdown.querySelectorAll('.layout-option');
      options.forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const presetKey = opt.getAttribute('data-preset');
          if (presetKey === 'reset') {
            reset();
          } else {
            applyPreset(presetKey);
          }
          dropdown.classList.remove('show');
          menuBtn.classList.remove('active');
        });
      });

      // Đóng dropdown khi nhấp ra ngoài
      doc.addEventListener('click', () => {
        dropdown.classList.remove('show');
        menuBtn.classList.remove('active');
      });
    }

    headerRight.prepend(menuContainer);
  }

  return {
    reset,
    applyPreset,
    collapseColumn,
    expandColumn,
    toggleCollapse,
    setWidths: (p0, p2) => {
      currentP0 = p0;
      currentP2 = p2;
      isCol0Collapsed = false;
      isCol2Collapsed = false;
      grid.classList.remove('col-0-collapsed', 'col-2-collapsed');
      cols[0]?.classList.remove('is-collapsed');
      cols[2]?.classList.remove('is-collapsed');
      grid.style.setProperty('--col-0-w', `${p0.toFixed(2)}%`);
      grid.style.setProperty('--col-2-w', `${p2.toFixed(2)}%`);
      updateBadgesAndAdaptive(p0, p2);
      saveWidths(p0, p2, false, false);
      dispatchResizeEvents();
    },
    destroy: () => {
      splitters.forEach(sp => sp.remove());
      grid.classList.remove('tp-resizable', 'col-0-collapsed', 'col-2-collapsed');
      grid.style.removeProperty('--col-0-w');
      grid.style.removeProperty('--col-2-w');
      cols.forEach(col => {
        col.classList.remove('is-collapsed', 'is-compact');
        const r = col.querySelector ? col.querySelector('.lab-col-rail') : null;
        if (r) r.remove();
        const b = col.querySelector ? col.querySelector('.btn-col-collapse') : null;
        if (b) b.remove();
      });
      if (menuContainer) menuContainer.remove();
    }
  };
}
