/**
 * LiveSlider Component
 * Numeric slider directly linked to state, with live readout and step increments.
 */

import { renderInlineMath } from '../katex-render.js';

export function createLiveSlider(container, options = {}) {
  const {
    label = 'Value',
    min = 0,
    max = 10,
    step = 1,
    initial = 0,
    onChange = () => {}
  } = options;

  let value = initial;

  container.innerHTML = `
    <div class="tp-slider-wrap">
      <div class="tp-slider-header">
        <span class="tp-slider-label">${renderInlineMath(label)}</span>
        <span class="tp-slider-val">${value}</span>
      </div>
      <input type="range" class="tp-slider" min="${min}" max="${max}" step="${step}" value="${value}">
    </div>
  `;

  const labelEl = container.querySelector('.tp-slider-label');
  const sliderEl = container.querySelector('.tp-slider');
  const valEl = container.querySelector('.tp-slider-val');

  sliderEl.addEventListener('input', (e) => {
    value = parseFloat(e.target.value);
    valEl.textContent = value;
    onChange(value);
  });

  return {
    getValue: () => value,
    setValue: (newVal) => {
      value = newVal;
      sliderEl.value = newVal;
      valEl.textContent = newVal;
    },
    setLabel: (newLabel) => {
      if (labelEl) labelEl.innerHTML = renderInlineMath(newLabel);
    }
  };
}

export class LiveSlider {
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

    const wrap = document.createElement('div');
    parent.appendChild(wrap);

    const initial = options.value !== undefined ? options.value : (options.initial !== undefined ? options.initial : 0);
    this._instance = createLiveSlider(wrap, {
      label: options.label,
      min: options.min,
      max: options.max,
      step: options.step,
      initial: initial,
      onChange: options.onChange
    });
  }

  getValue() {
    return this._instance ? this._instance.getValue() : null;
  }

  setValue(newVal) {
    if (this._instance) this._instance.setValue(newVal);
  }

  setLabel(newLabel) {
    if (this._instance) this._instance.setLabel(newLabel);
  }
}

