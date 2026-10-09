/**
 * FormulaTooltip — xem công thức bằng cách rê chuột (hoặc focus / chạm) vào một mục.
 * Dùng cho công thức PHỤ: không chiếm chỗ trên màn hình, chỉ hiện khi cần ôn lại.
 *
 * Cách dùng:
 *   <span class="tp-has-formula" tabindex="0" data-formula="...LaTeX...">Tên mục</span>
 *   createFormulaTooltip();   // gắn một lần cho cả trang (ủy quyền sự kiện)
 * Lưu ý: dùng thuộc tính `data-formula` (KHÔNG dùng `data-tex`, vì renderMath() toàn cục sẽ tự dựng mọi phần tử có `data-tex`).
 */
import { renderMath } from '../katex-render.js';

/** Escape LaTeX để nhét an toàn vào thuộc tính HTML. */
export function formulaAttr(tex) {
  return String(tex).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Tính vị trí tooltip: ưu tiên bên dưới phần tử, lật lên trên nếu hết chỗ, kẹp trong khung nhìn.
 * @returns {{left:number, top:number, placement:'below'|'above'}}
 */
export function placeTooltip({ anchor, tip, viewport, gap = 8, margin = 8 }) {
  let left = anchor.left + anchor.width / 2 - tip.width / 2;
  left = Math.max(margin, Math.min(left, viewport.width - tip.width - margin));
  const spaceBelow = viewport.height - anchor.bottom;
  const spaceAbove = anchor.top;
  let placement = 'below';
  let top = anchor.bottom + gap;
  if (top + tip.height > viewport.height - margin && spaceAbove > spaceBelow) {
    placement = 'above';
    top = anchor.top - gap - tip.height;
  }
  top = Math.max(margin, Math.min(top, viewport.height - tip.height - margin));
  return { left, top, placement };
}

export function createFormulaTooltip(root = (typeof document !== 'undefined' ? document : null)) {
  if (!root || typeof document === 'undefined') return { show() {}, hide() {}, destroy() {} };

  const tip = document.createElement('div');
  tip.className = 'tp-formula-tip';
  tip.setAttribute('role', 'tooltip');
  tip.style.display = 'none';
  const body = document.createElement('div');
  tip.appendChild(body);
  document.body.appendChild(tip);

  let current = null;

  function show(target) {
    const tex = target.getAttribute('data-formula');
    if (!tex) return;
    current = target;
    renderMath(body, tex, { displayMode: true });
    tip.style.display = 'block';
    const a = target.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const pos = placeTooltip({
      anchor: { left: a.left, top: a.top, bottom: a.bottom, width: a.width },
      tip: { width: t.width, height: t.height },
      viewport: { width: window.innerWidth, height: window.innerHeight }
    });
    tip.style.left = `${pos.left}px`;
    tip.style.top = `${pos.top}px`;
    target.setAttribute('aria-describedby', 'tp-formula-tip');
    tip.id = 'tp-formula-tip';
  }

  function hide() {
    tip.style.display = 'none';
    if (current) current.removeAttribute('aria-describedby');
    current = null;
  }

  const find = (el) => (el && el.closest ? el.closest('[data-formula]') : null);

  const onOver = (e) => { const t = find(e.target); if (t && t !== current) show(t); };
  const onOut = (e) => {
    const t = find(e.target);
    if (t && !t.contains(e.relatedTarget)) hide();
  };
  const onFocusIn = (e) => { const t = find(e.target); if (t) show(t); };
  const onFocusOut = () => hide();
  const onClick = (e) => { const t = find(e.target); if (t) { if (current === t) hide(); else show(t); } };
  const onKey = (e) => { if (e.key === 'Escape') hide(); };

  root.addEventListener('mouseover', onOver);
  root.addEventListener('mouseout', onOut);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  root.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  window.addEventListener('scroll', hide, true);

  return {
    show,
    hide,
    destroy() {
      root.removeEventListener('mouseover', onOver);
      root.removeEventListener('mouseout', onOut);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      root.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hide, true);
      tip.remove();
    }
  };
}
