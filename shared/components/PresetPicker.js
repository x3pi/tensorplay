/**
 * PresetPicker Component
 * Row of quick-try buttons for instant experimentation and preset testing.
 */

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
            ${p.label}
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
