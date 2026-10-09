import { describe, it, expect } from 'vitest';
import { formulaAttr, placeTooltip } from './FormulaTooltip.js';

const vp = { width: 1000, height: 700 };

describe('FormulaTooltip', () => {
  it('formulaAttr escape ngoặc kép, & và dấu < > để nhét vào thuộc tính HTML', () => {
    expect(formulaAttr('a < b & "c"')).toBe('a &lt; b &amp; &quot;c&quot;');
    expect(formulaAttr('\\frac{1}{2}')).toBe('\\frac{1}{2}');
  });

  it('đặt tooltip bên dưới phần tử và căn giữa theo chiều ngang', () => {
    const p = placeTooltip({ anchor: { left: 400, top: 100, bottom: 120, width: 100 }, tip: { width: 200, height: 80 }, viewport: vp });
    expect(p.placement).toBe('below');
    expect(p.top).toBe(128);
    expect(p.left).toBe(350);
  });

  it('lật lên trên khi bên dưới hết chỗ', () => {
    const p = placeTooltip({ anchor: { left: 400, top: 650, bottom: 670, width: 100 }, tip: { width: 200, height: 120 }, viewport: vp });
    expect(p.placement).toBe('above');
    expect(p.top).toBe(650 - 8 - 120);
  });

  it('kẹp trong khung nhìn khi phần tử sát mép trái / phải', () => {
    const left = placeTooltip({ anchor: { left: 0, top: 100, bottom: 120, width: 20 }, tip: { width: 300, height: 60 }, viewport: vp });
    expect(left.left).toBe(8);
    const right = placeTooltip({ anchor: { left: 980, top: 100, bottom: 120, width: 20 }, tip: { width: 300, height: 60 }, viewport: vp });
    expect(right.left).toBe(1000 - 300 - 8);
  });
});
