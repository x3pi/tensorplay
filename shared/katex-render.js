import { resolveRefs } from './curriculum.js';
/**
 * TensorPlay KaTeX Renderer Utility
 * Safely renders LaTeX formulas with universal DOM TreeWalker, CDN auto-retry, and inline parsing.
 */

/**
 * Universally traverses all text nodes inside a DOM tree and replaces $...$ with KaTeX spans
 * without corrupting child elements or destroying event listeners.
 */
export function renderAllInlineMath(root = (typeof document !== 'undefined' ? document.body : null)) {
  if (!root || typeof window === 'undefined' || typeof document === 'undefined') return;

  // If KaTeX is not loaded yet, wait and retry
  if (!window.katex) {
    setTimeout(() => renderAllInlineMath(root), 100);
    return;
  }

  // If official KaTeX auto-render extension is available, leverage it as well
  if (typeof window.renderMathInElement === 'function') {
    try {
      window.renderMathInElement(root, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    } catch (e) {
      // Fall through to tree walker
    }
  }

  // Universal TreeWalker fallback: catches 100% of text nodes anywhere in the DOM
  try {
    const showText = typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_TEXT : 4;
    const filterReject = typeof NodeFilter !== 'undefined' ? NodeFilter.FILTER_REJECT : 2;
    const filterAccept = typeof NodeFilter !== 'undefined' ? NodeFilter.FILTER_ACCEPT : 1;

    const walker = document.createTreeWalker(
      root,
      showText,
      {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.includes('$')) {
            return filterReject;
          }
          const parent = node.parentElement;
          if (!parent) return filterReject;
          const tag = parent.tagName.toLowerCase();
          if (['script', 'style', 'textarea', 'pre', 'code'].includes(tag)) {
            return filterReject;
          }
          if (parent.closest && parent.closest('.katex, .katex-display')) {
            return filterReject;
          }
          return filterAccept;
        }
      }
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach(textNode => {
      const parent = textNode.parentElement;
      if (!parent) return;
      const text = textNode.nodeValue;
      if (/\$([^\$]+)\$/.test(text)) {
        const replacement = renderInlineMath(text);
        if (replacement !== text) {
          const temp = document.createElement('span');
          temp.innerHTML = replacement;
          while (temp.firstChild) {
            parent.insertBefore(temp.firstChild, textNode);
          }
          parent.removeChild(textNode);
        }
      }
    });
  } catch (err) {
    console.warn('renderAllInlineMath tree error:', err);
  }
}

/**
 * Returns a Promise that resolves when window.katex is loaded and available.
 */
export function whenKaTeXReady(timeoutMs = 6000) {
  if (typeof window !== 'undefined' && window.katex) {
    return Promise.resolve(window.katex);
  }
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.katex) {
        clearInterval(interval);
        resolve(window.katex);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        resolve(null);
      }
    }, 50);
  });
}

/**
 * Observes container for dynamically added text nodes containing '$' and automatically renders them.
 */
export function observeMath(container = (typeof document !== 'undefined' ? document.body : null)) {
  if (!container || typeof MutationObserver === 'undefined') return () => {};
  const observer = new MutationObserver((mutations) => {
    let hasMath = false;
    for (const m of mutations) {
      if (m.addedNodes) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 3 && node.nodeValue && node.nodeValue.includes('$')) {
            hasMath = true;
            break;
          } else if (node.nodeType === 1 && (node.textContent || '').includes('$')) {
            if (!node.closest || !node.closest('.katex, .katex-display')) {
              hasMath = true;
              break;
            }
          }
        }
      }
      if (hasMath) break;
    }
    if (hasMath) {
      renderAllInlineMath(container);
    }
  });
  observer.observe(container, { childList: true, subtree: true });
  return () => observer.disconnect();
}

/**
 * Primary KaTeX renderer function supporting:
 * 1. Global mode: renderMath() -> renders all math blocks and inline formulas in document.body
 * 2. Container mode: renderMath(containerEl) -> scans and renders formulas within containerEl
 * 3. Explicit formula mode: renderMath(mountEl, formulaString, options) -> renders formula into mountEl
 */
export function renderMath(targetEl, formulaString, options = { displayMode: true }) {
  // Mode 1: Global parameterless pass
  if (arguments.length === 0 || (!targetEl && !formulaString)) {
    if (typeof window !== 'undefined' && !window.katex) {
      setTimeout(() => renderMath(), 100);
      return;
    }
    if (typeof document !== 'undefined') {
      // Process explicit math blocks
      const mathBlocks = document.querySelectorAll('.math-block, [data-tex]');
      mathBlocks.forEach(el => {
        let tex = el.getAttribute('data-tex') || (el.textContent ? el.textContent.trim() : '');
        if (tex) {
          tex = tex.replace(/\\\\([a-zA-Z]+|[^a-zA-Z\s])/g, '\\$1');
          renderMath(el, tex, { displayMode: !el.classList.contains('math-inline') });
        }
      });

      // Universal inline math pass across entire document body
      renderAllInlineMath(document.body);
    }
    return;
  }

  // Resolve target element if string ID or selector passed
  const el = typeof targetEl === 'string' && typeof document !== 'undefined'
    ? (document.getElementById(targetEl) || document.querySelector(targetEl))
    : targetEl;

  // Mode 2: Container-only pass (called with 1 argument: containerEl)
  if (arguments.length === 1 && el) {
    renderAllInlineMath(el);
    return;
  }

  // Mode 3: Explicit target + formula (called with >= 2 arguments)
  if (!el) return;

  if (!formulaString) {
    el.innerHTML = '';
    return;
  }

  const doRender = () => {
    if (typeof window !== 'undefined' && window.katex) {
      try {
        const cleanFormula = formulaString.replace(/\\\\([a-zA-Z]+|[^a-zA-Z\s])/g, '\\$1');
        window.katex.render(cleanFormula, el, {
          throwOnError: false,
          displayMode: options.displayMode !== false
        });
      } catch (err) {
        console.warn('KaTeX render error:', err);
        el.textContent = formulaString;
      }
    } else {
      el.textContent = formulaString;
      setTimeout(doRender, 100);
    }
  };

  doRender();
}

/**
 * Safely escapes HTML special characters inside code spans to prevent DOM parsing bugs.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Universal Inline Renderer for TensorPlay.
 * Seamlessly and safely parses:
 * 1. KaTeX display math: $$...$$
 * 2. KaTeX inline math: $...$
 * 3. Markdown inline code spans: `...` -> <code class="tp-inline-code">...</code>
 * 4. Markdown bold: **...** -> <strong>...</strong>
 * 5. Interactive UI button / target cues: "Target" -> <span class="socratic-target-btn">"Target"</span> (when options.renderCues = true)
 *
 * Protected against crossing HTML tag boundaries and unescaped entities.
 */
export function renderRichText(text, options = {}) {
  if (!text || typeof text !== 'string') return text || '';
  const { renderCues = false } = options;

  // Thay [[lesson:slug]] bằng liên kết «Tiêu đề bài» (đồng bộ nhờ shared/lesson-titles.js)
  text = resolveRefs(text, undefined, { asLink: true });

  // Normalize double-escaped LaTeX commands such as \\to, \\nabla, \\cdot, \\le, \\{
  let normalized = text.replace(/\\\\([a-zA-Z]+|[^a-zA-Z\s])/g, '\\$1');

  // 1. Math rendering with KaTeX
  if (typeof window !== 'undefined' && window.katex) {
    // 1.1 Display math $$...$$
    normalized = normalized.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      try {
        return window.katex.renderToString(formula.trim(), { throwOnError: false, displayMode: true });
      } catch (e) {
        return match;
      }
    });

    // 1.2 Inline math $...$
    normalized = normalized.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      // Safety check: if formula contains HTML tags (e.g. </p>, <span>), it crossed HTML tags - do not treat as math
      if (/<\/?[a-zA-Z][^>]*>/.test(formula)) {
        return match;
      }
      try {
        return window.katex.renderToString(formula.trim(), { throwOnError: false, displayMode: false });
      } catch (e) {
        return match;
      }
    });
  }

  // 2. Inline code spans `...` (convert to styled <code class="tp-inline-code"> with HTML escape)
  normalized = normalized.replace(/`([^`\n]+)`/g, (match, code) => {
    return `<code class="tp-inline-code">${escapeHtml(code)}</code>`;
  });

  // 3. Bold **text** -> <strong>text</strong>
  normalized = normalized.replace(/\*\*([^\*\n]+)\*\*/g, '<strong>$1</strong>');

  // 4. Interactive UI button / target cues "..."
  if (renderCues) {
    normalized = normalized.replace(/(^|[\s(])"([^"\n<>=]+)"/g, '$1<span class="socratic-target-btn">"$2"</span>');
  }

  return normalized;
}

/**
 * Universal math and inline rich text renderer.
 * Drop-in backwards-compatible replacement that handles both LaTeX formulas and inline code spans.
 */
export function renderInlineMath(text) {
  return renderRichText(text, { renderCues: false });
}

// Auto-run on DOMContentLoaded and window load with fallback retries
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderMath());
  } else {
    setTimeout(() => renderMath(), 50);
  }
  window.addEventListener('load', () => {
    setTimeout(() => renderMath(), 100);
  });
}
