/**
 * LiveSlider Component
 * Numeric slider directly linked to state, with live readout and step increments.
 */

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
        <span class="tp-slider-label">${label}</span>
        <span class="tp-slider-val">${value}</span>
      </div>
      <input type="range" class="tp-slider" min="${min}" max="${max}" step="${step}" value="${value}">
    </div>
  `;

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
    }
  };
}
