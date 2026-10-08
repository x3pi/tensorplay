/**
 * {{TITLE}}
 * Path: lessons/{{SLUG}}/logic.js
 *
 * TODO: mô tả tình huống thực + con số nhỏ, tròn trị (AGENTS.md).
 * Hợp đồng: class LessonLogic có reset / applyPreset / onUserUpdate / calculate, và export PRESETS.
 * Chạy được trong Node (không đụng DOM) để test độc lập.
 */

const round = (v, n = 4) => Number(v.toFixed(n)) + 0; // "+ 0" đổi -0 thành 0

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = { x: 2 };
    return this.calculate();
  }

  applyPreset(presetState) {
    this.state = { ...this.state, ...presetState };
    return this.calculate();
  }

  onUserUpdate(partialState) {
    this.state = { ...this.state, ...partialState };
    return this.calculate();
  }

  calculate() {
    const { x } = this.state;
    const y = 2 * x; // TODO: thay bằng toán thật của bài
    return {
      x,
      y: round(y),
      verdict: { type: y > 0 ? 'success' : 'warning', text: `✅ y = 2 × ${x} = ${round(y)}` }, // type: success | warning | danger
      formulaKaTeX: `y = 2x = 2 \\times ${x} = ${round(y)}`
    };
  }
}

export const PRESETS = [
  { id: 'default', label: 'Mặc định (x = 2)', state: { x: 2 } },
  { id: 'zero', label: 'Trường hợp biên (x = 0)', state: { x: 0 } }
];
