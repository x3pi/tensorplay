/**
 * PresetPicker Component
 * Row of quick-try buttons for instant experimentation and preset testing.
 */

import { renderInlineMath } from '../katex-render.js';

export function createPresetPicker(container, options = {}) {
  const {
    title = 'Thử Nhanh:',
    presets = [],
    initialActiveId = presets[0]?.id || null,
    onPick = () => {}
  } = options;

  let activeId = initialActiveId;

  container.className = 'tp-presets-bar';

  function render() {
    container.innerHTML = `
      <span class="tp-presets-title">${title}</span>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${presets.map(p => `
          <button class="tp-preset-btn ${p.id === activeId ? 'active' : ''}" data-id="${p.id}">
            ${renderInlineMath(p.label)}
          </button>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.tp-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        activeId = id;
        render();
        const found = presets.find(p => p.id === id);
        if (found) onPick(found);
      });
    });
  }

  render();

  return {
    setActive: (id) => {
      activeId = id;
      render();
    }
  };
}

export class PresetPicker {
  constructor(arg1, arg2) {
    let options = arg2 || {};
    let parent = null;
    if (arg1 instanceof HTMLElement || (typeof arg1 === 'object' && arg1 && arg1.nodeType === 1)) {
      parent = arg1;
    } else if (typeof arg1 === 'object' && arg1) {
      options = arg1;
      if (options.container) parent = options.container;
      else if (options.containerId) parent = document.getElementById(options.containerId);
    }
    if (!parent) return;

    this._instance = createPresetPicker(parent, {
      title: options.title || 'Thử Nhanh:',
      presets: options.presets || [],
      initialActiveId: options.initialActiveId || options.presets?.[0]?.id,
      onPick: options.onSelect || options.onPick
    });
  }

  setActive(id) {
    if (this._instance) this._instance.setActive(id);
  }
}

