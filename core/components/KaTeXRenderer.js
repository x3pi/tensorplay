/**
 * TensorPlay KaTeX Dynamic Renderer
 * Safely renders LaTeX mathematical formulas into DOM containers with CDN fallback.
 */

export class KaTeXRenderer {
  static renderFormula(targetEl, formulaString, options = { displayMode: true }) {
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
        // Fallback if KaTeX is still loading from CDN
        targetEl.textContent = formulaString;
        setTimeout(doRender, 150);
      }
    };

    doRender();
  }

  /**
   * Replaces $...$ inside arbitrary HTML or text with rendered KaTeX spans
   */
  static renderInlineMath(text) {
    if (!text || typeof text !== 'string') return text;
    // Match single dollar signs not preceded or followed by another dollar
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
}
