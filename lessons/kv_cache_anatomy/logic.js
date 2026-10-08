/**
 * KV-Cache Anatomy (Needle HW4)
 * Giải phẫu cơ chế lưu đệm Key-Value Cache trong LLM Serving.
 * So sánh chi phí O(N^2) khi không dùng cache vs O(N) khi có KV-Cache.
 * Tính toán dung lượng VRAM tiêu hao cho bộ đệm KV.
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      tokens: ["Học", "sâu", "giúp", "máy", "tính", "hiểu"],
      currentStep: 2, // Đã sinh 3 token (0, 1, 2)
      hasCache: true,
      numLayers: 12,
      numHeads: 8,
      headDim: 64,    // d_k = 64
      bytesPerVal: 2  // FP16 = 2 bytes
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

  nextStep() {
    if (this.state.currentStep < this.state.tokens.length - 1) {
      this.state.currentStep++;
    }
    return this.calculate();
  }

  calculate() {
    const { tokens, currentStep, hasCache, numLayers, numHeads, headDim, bytesPerVal } = this.state;
    const seqLen = currentStep + 1; // Số token hiện tại

    // 1. Phân tích chi phí tính toán ở bước hiện tại
    // Không dùng cache: Phải recompute toàn bộ seqLen token từ đầu
    const tokensComputedThisStep = hasCache ? 1 : seqLen;

    // Tổng số token-step tính toán tích lũy từ bước 0 tới seqLen-1
    // Without cache: 1 + 2 + ... + seqLen = seqLen * (seqLen + 1) / 2
    // With cache: seqLen
    const cumulativeTokensComputed = hasCache
      ? seqLen
      : (seqLen * (seqLen + 1)) / 2;

    // Giả định mỗi token tốn 10ms xử lý
    const latencyThisStepMs = tokensComputedThisStep * 10;
    const totalLatencyMs = cumulativeTokensComputed * 10;

    // 2. Dung lượng VRAM của KV-Cache
    // 2 (Key + Value) * numLayers * numHeads * headDim * seqLen * bytesPerVal
    const bytesPerTokenAllLayers = 2 * numLayers * numHeads * headDim * bytesPerVal;
    const totalCacheBytes = bytesPerTokenAllLayers * seqLen;
    const totalCacheKb = (totalCacheBytes / 1024).toFixed(1);

    // Danh sách token đã sinh
    const generatedTokens = tokens.slice(0, seqLen);

    return {
      tokens,
      currentStep,
      seqLen,
      hasCache,
      generatedTokens,
      tokensComputedThisStep,
      cumulativeTokensComputed,
      latencyThisStepMs,
      totalLatencyMs,
      totalCacheBytes,
      totalCacheKb,
      formulaComplexityKaTeX: hasCache
        ? `\\text{Có KV-Cache: } O(1) \\text{ mỗi bước} \\implies \\text{Tổng } O(N) = ${seqLen} \\text{ token-ops}`
        : `\\text{Không Cache: } O(N) \\text{ mỗi bước} \\implies \\text{Tổng } O(N^2) = ${cumulativeTokensComputed} \\text{ token-ops}`,
      formulaMemoryKaTeX: `\\text{VRAM KV} = 2 \\times ${numLayers}L \\times ${numHeads}H \\times ${headDim}D \\times ${seqLen}N \\times 2\\text{B} = ${totalCacheBytes} \\text{ Bytes}`
    };
  }
}

export const PRESETS = [
  {
    id: "cached_step_3",
    label: "Có Cache (Bật KV-Cache, Tốc độ cố định 10ms)",
    state: { hasCache: true, currentStep: 2 }
  },
  {
    id: "uncached_slowdown",
    label: "Tắt Cache (Chậm dần đều O(N^2))",
    state: { hasCache: false, currentStep: 2 }
  },
  {
    id: "full_seq_6",
    label: "Đủ 6 Token (So sánh tổng thời gian)",
    state: { currentStep: 5 }
  }
];
