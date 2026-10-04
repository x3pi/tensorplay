/**
 * TensorPlay KaTeX Renderer Utility
 * Safely renders LaTeX formulas with CDN auto-retry fallback and inline parsing.
 */

export function renderMath(targetEl, formulaString, options = { displayMode: true }) {
  if (!targetEl) return;
  if (!formulaString) {
    targetEl.innerHTML = '';
    return;
  }

  const doRender = () => {
    if (typeof window !== 'undefined' && window.katex) {
      try {
        window.katex.render(formulaString, targetEl, {
          throwOnError: false,
          displayMode: options.displayMode !== false
        });
      } catch (err) {
        console.warn('KaTeX render error:', err);
        targetEl.textContent = formulaString;
      }
    } else {
      targetEl.textContent = formulaString;
      setTimeout(doRender, 100);
    }
  };

  doRender();
}

/**
 * Replaces $...$ inside arbitrary strings with rendered KaTeX spans
 */
export function renderInlineMath(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text.replace(/\$([^\$]+)\$/g, (match, formula) => {
    if (typeof window !== 'undefined' && window.katex) {
      try {
        return window.katex.renderToString(formula, { throwOnError: false, displayMode: false });
      } catch (e) {
        return match;
      }
    }
    return match;
  });
}
