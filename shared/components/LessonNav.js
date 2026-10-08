// shared/components/LessonNav.js
import './AiTutor.js';
import { renderInlineMath } from '../katex-render.js';
import { initLayoutResizer } from './LayoutResizer.js';
import { getLessonSlug } from '../lesson-context.js';
import { loadCatalog, neighbors, getPath, resolveRefs } from '../curriculum.js';

const STORAGE_PATH_KEY = 'tp_active_path';

/**
 * Tự động chèn thanh điều hướng (Bài trước, Chọn lộ trình, Bài tiếp) vào Header và kích hoạt AI Tutor.
 * Dùng getLessonSlug() và curriculum.neighbors() để chuyển hướng chính xác theo từng lộ trình.
 */
async function initLessonNav() {
  try {
    const catalog = await loadCatalog();
    if (!catalog) return;

    const slug = getLessonSlug(typeof window !== 'undefined' ? window : null);
    if (!slug) return;

    // Xác định active path từ URL query (?path=...) hoặc localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let activePathId = urlParams.get('path') || localStorage.getItem(STORAGE_PATH_KEY) || 'main';

    // Đảm bảo path tồn tại trong catalog, nếu không fallback 'main'
    if (!catalog.paths || !catalog.paths.some(p => p.id === activePathId)) {
      activePathId = 'main';
    }

    const availablePaths = (catalog.paths || []).filter(p => p.status !== 'planned' || (p.sections && p.sections.length > 0));

    function renderNav(pathId) {
      activePathId = pathId;
      try {
        localStorage.setItem(STORAGE_PATH_KEY, activePathId);
      } catch {}

      const nb = neighbors(slug, activePathId, catalog);
      const prevLesson = nb.prev;
      const nextLesson = nb.next;
      const pos = nb.currentPosition;

      const navContainer = document.createElement('div');
      navContainer.className = 'tp-lesson-nav-group';
      navContainer.style.display = 'inline-flex';
      navContainer.style.flexWrap = 'wrap';
      navContainer.style.alignItems = 'center';
      navContainer.style.gap = '6px';

      // Dropdown chọn lộ trình (nếu có nhiều hơn 1 lộ trình)
      let pathSelectHtml = '';
      if (availablePaths.length > 1) {
        pathSelectHtml = `
          <div class="tp-nav-path-selector" style="display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; color:var(--text-dim, #94a3b8);">
            <select id="tp-nav-path-select" style="
              background: var(--bg-surface-elevated, #1e293b);
              color: var(--text-main, #f8fafc);
              border: 1px solid var(--border-strong, #334155);
              border-radius: var(--radius-full, 9999px);
              padding: 4px 8px;
              font-size: 0.75rem;
              font-weight: 500;
              cursor: pointer;
              outline: none;
            ">
              ${availablePaths.map(p => `
                <option value="${p.id}" ${p.id === activePathId ? 'selected' : ''}>
                  🧭 ${p.title}
                </option>
              `).join('')}
            </select>
          </div>
        `;
      }

      // Badge tiến độ trong lộ trình
      let posHtml = '';
      if (pos) {
        posHtml = `
          <span class="tp-nav-pos-badge" style="
            font-size: 0.72rem;
            color: var(--text-dim, #94a3b8);
            background: var(--bg-surface-elevated, #1e293b);
            border: 1px solid var(--border-subtle, #334155);
            padding: 3px 8px;
            border-radius: 9999px;
            font-family: var(--font-mono, monospace);
          ">
            ${pos.index}/${pos.total}
          </span>
        `;
      }

      // Nút bài trước
      let prevHtml = '';
      if (prevLesson) {
        const prevSlug = prevLesson.id || prevLesson.slug;
        const prevShort = (prevLesson.title.split(/ — |: /)[0] || 'Trước').trim();
        prevHtml = `
          <a href="../${prevSlug}/?path=${activePathId}" class="btn-nav-lesson btn-prev" title="${prevLesson.title}" style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: var(--bg-surface-elevated, #1e293b);
            color: var(--text-dim, #94a3b8);
            text-decoration: none;
            padding: 5px 10px;
            border-radius: var(--radius-full, 9999px);
            border: 1px solid var(--border-strong, #334155);
            font-size: 0.78rem;
            white-space: nowrap;
            transition: all 0.2s ease;
          ">
            ← ${renderInlineMath(prevShort)}
          </a>
        `;
      }

      // Nút bài tiếp theo
      let nextHtml = '';
      if (nextLesson) {
        const nextSlug = nextLesson.id || nextLesson.slug;
        const nextShort = (nextLesson.title.split(/ — |: /)[0] || 'Kế').trim();
        nextHtml = `
          <a href="../${nextSlug}/?path=${activePathId}" class="btn-nav-lesson btn-next" title="${nextLesson.title}" style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: var(--bg-surface-elevated, #1e293b);
            color: var(--color-info, #38bdf8);
            text-decoration: none;
            padding: 5px 12px;
            border-radius: var(--radius-full, 9999px);
            border: 1px solid var(--border-strong, #334155);
            font-size: 0.78rem;
            font-weight: 600;
            white-space: nowrap;
            transition: all 0.2s ease;
          ">
            <span class="nav-prefix">Tiếp: </span>${renderInlineMath(nextShort)} →
          </a>
        `;
      }

      navContainer.innerHTML = pathSelectHtml + posHtml + prevHtml + nextHtml;

      // Event listener đổi lộ trình
      const sel = navContainer.querySelector('#tp-nav-path-select');
      if (sel) {
        sel.addEventListener('change', (e) => {
          renderAndMount(e.target.value);
        });
      }

      // Hover effects
      navContainer.querySelectorAll('a.btn-nav-lesson').forEach(link => {
        const isNext = link.classList.contains('btn-next');
        link.addEventListener('mouseenter', () => {
          link.style.background = isNext ? 'var(--color-info-bg, rgba(56,189,248,0.15))' : 'var(--bg-surface-hover, #334155)';
          link.style.borderColor = isNext ? 'var(--color-info, #38bdf8)' : 'var(--border-subtle, #475569)';
          if (!isNext) link.style.color = 'var(--text-main, #ffffff)';
        });
        link.addEventListener('mouseleave', () => {
          link.style.background = 'var(--bg-surface-elevated, #1e293b)';
          link.style.borderColor = 'var(--border-strong, #334155)';
          if (!isNext) link.style.color = 'var(--text-dim, #94a3b8)';
        });
      });

      return navContainer;
    }

    function renderAndMount(pathId) {
      const oldGroup = document.querySelector('.tp-lesson-nav-group');
      const newNav = renderNav(pathId);

      if (oldGroup && oldGroup.parentNode) {
        oldGroup.parentNode.replaceChild(newNav, oldGroup);
        return;
      }

      // Append to header-left or before header
      let headerLeft = document.querySelector('.lab-header-left');
      if (headerLeft) {
        headerLeft.appendChild(newNav);
      } else {
        const header = document.querySelector('header');
        if (header && header.parentNode) {
          let wrapper = header.parentNode.querySelector('.tp-nav-wrapper');
          if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'tp-nav-wrapper';
            wrapper.style.display = 'flex';
            wrapper.style.flexWrap = 'wrap';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'space-between';
            wrapper.style.gap = '8px';
            wrapper.style.marginBottom = '12px';
            wrapper.style.width = '100%';
            wrapper.style.boxSizing = 'border-box';
            wrapper.style.overflow = 'visible';
            wrapper.innerHTML = `
              <a href="../../index.html?path=${activePathId}" class="btn-back-catalog" style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: var(--bg-surface-elevated, #1e293b);
                color: var(--text-dim, #94a3b8);
                text-decoration: none;
                padding: 5px 12px;
                border-radius: 9999px;
                border: 1px solid var(--border-strong, #334155);
                font-size: 0.78rem;
                font-weight: 500;
                white-space: nowrap;
              ">
                ← Danh Mục
              </a>
            `;
            header.parentNode.insertBefore(wrapper, header);
          }
          wrapper.appendChild(newNav);
        }
      }
    }

    function resolveDocumentRefs() {
      if (typeof document === 'undefined' || !catalog) return;
      const elements = document.querySelectorAll('.wizard-desc, .wizard-content, .theory-card, .lab-description, .concept-box, p, li, td, span, div');
      elements.forEach(el => {
        if (el.children.length === 0 || el.classList.contains('wizard-desc') || el.classList.contains('wizard-content') || el.tagName === 'P' || el.tagName === 'LI') {
          if (el.innerHTML && el.innerHTML.includes('[[lesson:')) {
            el.innerHTML = resolveRefs(el.innerHTML, catalog, { asLink: true });
          }
        }
      });
    }

    function fillTopicBadge() {
      if (typeof document === 'undefined') return;
      const lesson = catalog.lessons && catalog.lessons[slug];
      const topic = lesson && (catalog.topics || []).find(t => t.id === lesson.topic);
      document.querySelectorAll('[data-topic-badge]').forEach(el => {
        el.textContent = topic ? topic.label : (lesson ? lesson.topic : '');
        if (topic && topic.color) el.style.borderColor = topic.color;
      });
    }

    renderAndMount(activePathId);
    fillTopicBadge();
    resolveDocumentRefs();
    // Re-resolve if content updates dynamically
    setTimeout(resolveDocumentRefs, 300);
  } catch (err) {
    console.error("LessonNav failed to initialize", err);
  }
}

// Auto init when imported
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initLessonNav();
      initLayoutResizer();
    });
  } else {
    initLessonNav();
    initLayoutResizer();
  }
}
