// shared/components/LessonNav.js
import './AiTutor.js';
import { renderInlineMath } from '../katex-render.js';

/**
 * Tự động chèn nút "Bài tiếp theo" vào Header (lab-header-left) và kích hoạt AI Tutor.
 * Nó tự đọc URL hiện tại, đối chiếu với catalog.json để tìm bài học kế tiếp.
 */

async function initLessonNav() {
  try {
    const res = await fetch('../../examples/catalog.json');
    if (!res.ok) return;
    const catalog = await res.json();
    
    // Tìm bài hiện tại
    const path = window.location.pathname;
    let currentIndex = -1;
    for (let i = 0; i < catalog.length; i++) {
      // catalog path looks like "./examples/hw0_tensor_memory/bai_01_robot_vision.html"
      // window.location.pathname looks like "/examples/hw0_tensor_memory/bai_01_robot_vision.html"
      const catPath = catalog[i].path.replace('./', '/');
      if (path.includes(catPath) || catPath.includes(path.split('/').pop())) {
        currentIndex = i;
        break;
      }
    }

    if (currentIndex >= 0) {
      const navContainer = document.createElement('div');
      navContainer.className = 'tp-lesson-nav-group';
      navContainer.style.display = 'inline-flex';
      navContainer.style.flexWrap = 'wrap';
      navContainer.style.alignItems = 'center';
      navContainer.style.gap = '6px';
      
      let html = '';

      // Bài trước
      if (currentIndex > 0) {
        const prevLesson = catalog[currentIndex - 1];
        const prevHref = '../../' + prevLesson.path.replace('./', '');
        html += `
          <a href="${prevHref}" class="btn-nav-lesson" style="
            display: inline-flex;
            align-items: center;
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
            ← Trước
          </a>
        `;
      }

      // Bài kế tiếp
      if (currentIndex < catalog.length - 1) {
        const nextLesson = catalog[currentIndex + 1];
        const nextHref = '../../' + nextLesson.path.replace('./', '');
        const nextShort = (nextLesson.title.split(':')[0] || 'Kế').trim();
        html += `
          <a href="${nextHref}" class="btn-nav-lesson btn-next" style="
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

      navContainer.innerHTML = html;

      // Hover effects
      const links = navContainer.querySelectorAll('a.btn-nav-lesson');
      links.forEach(link => {
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

      // Append to header-left or before header
      let headerLeft = document.querySelector('.lab-header-left');
      if (headerLeft) {
        headerLeft.appendChild(navContainer);
      } else {
        const header = document.querySelector('header');
        if (header && header.parentNode) {
          const existing = header.parentNode.querySelector('.tp-nav-wrapper');
          if (existing) existing.remove();

          const wrapper = document.createElement('div');
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
            <a href="../../index.html" class="btn-back-catalog" style="
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
          wrapper.appendChild(navContainer);
          header.parentNode.insertBefore(wrapper, header);
        }
      }
    }
  } catch (err) {
    console.error("LessonNav failed to initialize", err);
  }
}

// Auto init when imported
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLessonNav);
} else {
  initLessonNav();
}
