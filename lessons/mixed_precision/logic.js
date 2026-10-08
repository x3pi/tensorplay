/**
 * Mixed Precision — FP16, BF16 & Loss Scaling
 * Path: lessons/mixed_precision/logic.js
 *
 * Gradient thật g = 10^e (e nguyên, ví dụ 1e-8) được nhân với hệ số loss scale S = 2^k
 * trước khi lưu ở định dạng thấp bit, rồi chia lại S trong FP32 trước khi cập nhật trọng số.
 *
 *   FP16 : 1 dấu + 5 mũ + 10 mantissa, max = 65504,  subnormal nhỏ nhất = 2^-24 ≈ 5.96e-8
 *   BF16 : 1 dấu + 8 mũ +  7 mantissa, max ≈ 3.39e38 (cùng tầm mũ với FP32), ít chữ số hơn
 */

export const FORMATS = {
  fp16: { name: 'FP16', expBits: 5, manBits: 10 },
  bf16: { name: 'BF16', expBits: 8, manBits: 7 }
};

/** Làm tròn một số thực về định dạng (expBits, manBits) theo kiểu round-half-to-even. */
export function roundToFormat(x, fmt) {
  const { expBits, manBits } = FORMATS[fmt];
  if (x === 0 || !Number.isFinite(x)) return x;
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);

  const bias = (1 << (expBits - 1)) - 1;
  const minExp = 1 - bias;                       // số mũ của số chuẩn nhỏ nhất
  const maxExp = bias;                           // số mũ lớn nhất
  const maxVal = (2 - Math.pow(2, -manBits)) * Math.pow(2, maxExp);

  const e = Math.max(Math.floor(Math.log2(a)), minExp);
  const step = Math.pow(2, e - manBits);         // khoảng cách giữa hai giá trị biểu diễn được
  const q = a / step;
  let n = Math.floor(q);
  const frac = q - n;
  if (frac > 0.5 || (frac === 0.5 && n % 2 === 1)) n += 1;
  const r = n * step;

  // Vượt ngưỡng làm tròn của số lớn nhất -> Infinity (giống phần cứng)
  if (r > maxVal) return sign * Infinity;
  return sign * r;
}

export const maxValue = (fmt) => {
  const { expBits, manBits } = FORMATS[fmt];
  return (2 - Math.pow(2, -manBits)) * Math.pow(2, (1 << (expBits - 1)) - 1);
};

export const minSubnormal = (fmt) => {
  const { expBits, manBits } = FORMATS[fmt];
  const bias = (1 << (expBits - 1)) - 1;
  return Math.pow(2, 1 - bias - manBits);
};

/** Một vòng: scale -> lưu thấp bit -> unscale trong FP32. */
export function scaleRoundTrip(g, scale, fmt) {
  const scaled = g * scale;
  const stored = roundToFormat(scaled, fmt);
  const overflow = !Number.isFinite(stored);
  const underflow = stored === 0 && g !== 0;
  const recovered = overflow ? NaN : stored / scale;
  const relError = overflow ? Infinity : (g === 0 ? 0 : Math.abs(recovered - g) / Math.abs(g));
  return { scaled, stored, recovered, overflow, underflow, relError };
}

const fmtSci = (v) => (v === 0 ? '0' : Number.isFinite(v) ? v.toExponential(2) : String(v));

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      gradExp: -8,     // g = 10^gradExp
      scaleLog2: 0,    // S = 2^scaleLog2
      format: 'fp16'
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
    const { gradExp, scaleLog2, format } = this.state;
    const g = Math.pow(10, gradExp);
    const scale = Math.pow(2, scaleLog2);
    const rt = scaleRoundTrip(g, scale, format);
    const name = FORMATS[format].name;

    // Gợi ý của dynamic loss scaling: tràn thì giảm một nửa, chết gradient thì tăng gấp đôi
    let advice = 'giữ nguyên S';
    if (rt.overflow) advice = `giảm S xuống ${scale / 2} và bỏ qua bước cập nhật này`;
    else if (rt.underflow) advice = `tăng S (gấp đôi dần: ${scale} → ${scale * 2} → …)`;

    let verdict;
    if (rt.overflow) {
      verdict = {
        type: 'danger',
        text: `❌ Tràn số: g × S = ${fmtSci(rt.scaled)} vượt max ${name} = ${fmtSci(maxValue(format))}. Gradient thành Infinity → NaN lan khắp mạng. Bộ scaler động sẽ ${advice}.`
      };
    } else if (rt.underflow) {
      verdict = {
        type: 'danger',
        text: `❌ Tiêu biến: ${fmtSci(rt.scaled)} nhỏ hơn nửa bước subnormal nhỏ nhất của ${name} (${fmtSci(minSubnormal(format))}) nên bị làm tròn thành 0. Trọng số này sẽ không bao giờ được học. Hãy ${advice}.`
      };
    } else if (rt.relError > 0.05) {
      verdict = {
        type: 'warning',
        text: `⚠️ Gradient còn sống nhưng sai số tương đối ${(rt.relError * 100).toFixed(1)}% vì nằm trong vùng subnormal thưa chữ số. Tăng S để đẩy nó vào vùng số chuẩn.`
      };
    } else {
      verdict = {
        type: 'success',
        text: `✅ ${name} giữ được gradient: sai số tương đối chỉ ${(rt.relError * 100).toFixed(2)}% sau khi chia lại S trong FP32.`
      };
    }

    const formulaKaTeX = `g_{\\text{lưu}} = \\text{round}_{\\text{${name}}}(g \\times S) = \\text{round}(${fmtSci(g)} \\times ${scale}) = ${fmtSci(rt.stored)}`;

    return {
      format,
      name,
      g,
      scale,
      scaled: rt.scaled,
      stored: rt.stored,
      recovered: rt.recovered,
      overflow: rt.overflow,
      underflow: rt.underflow,
      relError: rt.relError,
      maxVal: maxValue(format),
      minSub: minSubnormal(format),
      advice,
      formulaKaTeX,
      fmtSci,
      verdict
    };
  }
}

/** Bộ nhớ trạng thái huấn luyện mỗi tham số (byte), Adam. */
export function trainingBytesPerParam(mixed) {
  // FP32 thuần: trọng số 4 + gradient 4 + Adam m 4 + Adam v 4
  // Mixed:     trọng số FP16 2 + gradient FP16 2 + bản master FP32 4 + Adam m 4 + Adam v 4
  return mixed ? 2 + 2 + 4 + 4 + 4 : 4 + 4 + 4 + 4;
}

export const PRESETS = [
  {
    id: 'fp16_tiny_grad',
    label: 'FP16, gradient 1e-8, chưa scale ❌',
    state: { format: 'fp16', gradExp: -8, scaleLog2: 0 }
  },
  {
    id: 'fp16_scaled',
    label: 'FP16 + Loss Scale 1024 ✅',
    state: { format: 'fp16', gradExp: -8, scaleLog2: 10 }
  },
  {
    id: 'fp16_overscaled',
    label: 'Scale quá tay → tràn số ❌',
    state: { format: 'fp16', gradExp: 0, scaleLog2: 16 }
  },
  {
    id: 'bf16_noscale',
    label: 'BF16, không cần scale ✅',
    state: { format: 'bf16', gradExp: -8, scaleLog2: 0 }
  }
];
