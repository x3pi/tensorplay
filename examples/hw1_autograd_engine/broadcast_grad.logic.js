/**
 * Logic Module: Gradient của Broadcast — vì sao backward phải CỘNG DỒN.
 * Path: examples/hw1_autograd_engine/broadcast_grad.logic.js
 *
 * Bài toán: Z = P + b, trong đó P là điểm số 2 mẫu × 2 lớp (cố định), b là bias được broadcast.
 *   L = ½ Σ (Z − Y)²  →  G = ∂L/∂Z = Z − Y  (cùng shape 2×2)
 * Bias shape (1, 2): ∂L/∂b = tổng G theo cột (trục batch).
 * Bias vô hướng ():  ∂L/∂b = tổng toàn bộ G.
 *
 * Ba cách cài đặt backward của BroadcastTo:
 *   'sum'       — đúng: cộng dồn theo trục bị broadcast.
 *   'overwrite' — lỗi im lặng: vòng lặp gán "=" thay vì "+=", chỉ giữ lại hàng/phần tử cuối.
 *   'no_reduce' — lỗi shape: trả nguyên G (2×2) cho tham số có shape nhỏ hơn.
 */

export const P = [[2, 0], [0, 1]];
export const DEFAULT_Y = [[3, 0], [1, 2]];

const zeros = (biasShape) => (biasShape === 'scalar' ? 0 : [0, 0]);

/** Broadcast b lên 2×2 */
function broadcastB(b, biasShape) {
  return biasShape === 'scalar'
    ? [[b, b], [b, b]]
    : [[b[0], b[1]], [b[0], b[1]]];
}

export function forward(b, biasShape, Y) {
  const B = broadcastB(b, biasShape);
  const Z = P.map((row, i) => row.map((v, j) => v + B[i][j]));
  const G = Z.map((row, i) => row.map((z, j) => z - Y[i][j]));
  const loss = 0.5 * G.flat().reduce((s, g) => s + g * g, 0);
  return { Z, G, loss };
}

/**
 * Backward của BroadcastTo theo từng cách cài đặt.
 * Trả về { grad, shapeError }.
 */
export function biasGrad(G, biasShape, impl) {
  if (impl === 'no_reduce') {
    return { grad: G.map(r => [...r]), shapeError: true };
  }
  if (biasShape === 'scalar') {
    if (impl === 'overwrite') return { grad: G[1][1], shapeError: false };
    return { grad: G.flat().reduce((s, g) => s + g, 0), shapeError: false };
  }
  if (impl === 'overwrite') return { grad: [G[1][0], G[1][1]], shapeError: false };
  return { grad: [G[0][0] + G[1][0], G[0][1] + G[1][1]], shapeError: false };
}

/** b tối ưu (nghiệm đóng) để so sánh: trung bình của (Y − P) theo các vị trí bị broadcast */
export function optimalBias(biasShape, Y) {
  const D = Y.map((row, i) => row.map((y, j) => y - P[i][j]));
  if (biasShape === 'scalar') return D.flat().reduce((s, d) => s + d, 0) / 4;
  return [(D[0][0] + D[1][0]) / 2, (D[0][1] + D[1][1]) / 2];
}

const round = (x) => Math.round(x * 1e6) / 1e6;
const fmt = (x) => String(round(x));

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      biasShape: 'row', // 'row' = (1, 2) | 'scalar' = ()
      impl: 'sum',
      lr: 0.5,
      steps: 1,
      Y: DEFAULT_Y.map(r => [...r])
    };
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
    const { biasShape, impl, lr, steps, Y } = this.state;

    const b0 = zeros(biasShape);
    const f0 = forward(b0, biasShape, Y);
    const g0 = biasGrad(f0.G, biasShape, impl);

    // Chạy nhiều bước gradient descent (chỉ khi không lỗi shape)
    const lossHistory = [round(f0.loss)];
    let b = b0;
    if (!g0.shapeError) {
      for (let t = 0; t < steps; t++) {
        const { G } = forward(b, biasShape, Y);
        const { grad } = biasGrad(G, biasShape, impl);
        b = biasShape === 'scalar' ? b - lr * grad : [b[0] - lr * grad[0], b[1] - lr * grad[1]];
        lossHistory.push(round(forward(b, biasShape, Y).loss));
      }
    }

    const bOpt = optimalBias(biasShape, Y);
    const lossOpt = round(forward(bOpt, biasShape, Y).loss);
    const firstStepB = g0.shapeError
      ? null
      : (biasShape === 'scalar' ? round(b0 - lr * g0.grad) : g0.grad.map(g => round(-lr * g)));
    const finalLoss = lossHistory[lossHistory.length - 1];

    // KaTeX cho gradient bước đầu
    const G = f0.G;
    let gradKaTeX;
    if (g0.shapeError) {
      gradKaTeX = `\\frac{\\partial L}{\\partial b} = G = \\begin{bmatrix} ${fmt(G[0][0])} & ${fmt(G[0][1])} \\\\ ${fmt(G[1][0])} & ${fmt(G[1][1])} \\end{bmatrix} \\quad (2 \\times 2) \\neq ${biasShape === 'scalar' ? '()' : '(1 \\times 2)'}`;
    } else if (biasShape === 'scalar') {
      gradKaTeX = impl === 'sum'
        ? `\\frac{\\partial L}{\\partial b} = ${fmt(G[0][0])} + ${fmt(G[0][1])} + ${fmt(G[1][0])} + ${fmt(G[1][1])} = ${fmt(g0.grad)}`
        : `\\frac{\\partial L}{\\partial b} = G_{11} = ${fmt(g0.grad)} \\quad \\text{(mất 3 phần tử)}`;
    } else {
      gradKaTeX = impl === 'sum'
        ? `\\frac{\\partial L}{\\partial b} = \\big[\\, ${fmt(G[0][0])} + (${fmt(G[1][0])}),\\; ${fmt(G[0][1])} + (${fmt(G[1][1])}) \\,\\big] = [${fmt(g0.grad[0])},\\; ${fmt(g0.grad[1])}]`
        : `\\frac{\\partial L}{\\partial b} = G_{1,:} = [${fmt(g0.grad[0])},\\; ${fmt(g0.grad[1])}] \\quad \\text{(mất hàng 0)}`;
    }

    let verdict;
    if (g0.shapeError) {
      verdict = {
        type: 'danger',
        text: `❌ Lỗi shape: gradient có shape (2, 2) nhưng tham số b có shape ${biasShape === 'scalar' ? '()' : '(1, 2)'}. Backward của BroadcastTo phải gọi summation theo trục đã broadcast.`
      };
    } else if (impl === 'overwrite') {
      const stuck = finalLoss > lossOpt + 1e-6;
      verdict = {
        type: 'warning',
        text: `⚠️ Lỗi im lặng: chương trình chạy, loss vẫn giảm (${lossHistory[0]} → ${finalLoss}) nhưng ${stuck ? `kẹt trên mức tối ưu ${lossOpt}` : 'chậm hơn bình thường'}. Gradient chỉ thấy mẫu cuối batch.`
      };
    } else if (lossHistory.length > 1 && finalLoss > lossHistory[0] + 1e-9) {
      verdict = {
        type: 'danger',
        text: `💥 Gradient đúng nhưng learning rate ${lr} quá lớn cho bias vô hướng (gradient là tổng 4 phần tử) → loss tăng ${lossHistory[0]} → ${finalLoss}.`
      };
    } else if (lossHistory.length > 1 && Math.abs(finalLoss - lossHistory[0]) < 1e-9) {
      verdict = {
        type: 'warning',
        text: `↔️ Gradient đúng nhưng loss đứng yên ở ${finalLoss}: bước nhảy quá lớn, b vọt qua điểm tối ưu sang bên kia. Thử giảm learning rate.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ Cộng dồn gradient đúng: loss ${lossHistory[0]} → ${finalLoss} (tối ưu = ${lossOpt}).`
      };
    }

    return {
      Z: f0.Z,
      G,
      loss0: round(f0.loss),
      grad: g0.grad,
      shapeError: g0.shapeError,
      firstStepB,
      lossHistory,
      finalLoss,
      finalB: g0.shapeError ? null : (biasShape === 'scalar' ? round(b) : b.map(round)),
      bOpt,
      lossOpt,
      gradKaTeX,
      verdict
    };
  }
}

export const PRESETS = [
  { id: 'row_sum', label: 'Bias $(1 \\times 2)$ • Cộng dồn ✅', state: { biasShape: 'row', impl: 'sum', lr: 0.5 } },
  { id: 'row_overwrite', label: 'Bug gán đè "="', state: { biasShape: 'row', impl: 'overwrite', lr: 0.5 } },
  { id: 'row_noreduce', label: 'Bug quên sum (lỗi shape)', state: { biasShape: 'row', impl: 'no_reduce', lr: 0.5 } },
  { id: 'scalar_sum', label: 'Bias vô hướng, lr 0.5', state: { biasShape: 'scalar', impl: 'sum', lr: 0.5 } },
  { id: 'scalar_small_lr', label: 'Bias vô hướng, lr 0.25', state: { biasShape: 'scalar', impl: 'sum', lr: 0.25 } }
];
