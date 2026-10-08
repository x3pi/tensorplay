/**
 * Mini-Batching Assembly Line (Needle HW2)
 * Băng chuyền xử lý lô mini-batch B = 1, 2, 4, 8.
 * Vector hóa X (B x D) * W (D x H) -> Z (B x H).
 * Tính toán hiệu suất tận dụng GPU Cores và dung lượng Activation Buffer trong VRAM.
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      batchSize: 2,       // B
      featureDim: 4,      // D (số chiều đặc trưng)
      hiddenDim: 4,       // H (số nơ-ron ẩn)
      numLayers: 3,       // Số tầng mạng
      gpuMaxVramKb: 16    // Ngưỡng cảnh báo VRAM cho demo
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
    const { batchSize, featureDim, hiddenDim, numLayers, gpuMaxVramKb } = this.state;

    // Kích thước ma trận
    // X: B x D, W: D x H, Z: B x H
    const numElementsX = batchSize * featureDim;
    const numElementsW = featureDim * hiddenDim;
    const numElementsZ = batchSize * hiddenDim;

    // Tổng số phép tính FLOPs cho 1 forward layer: 2 * B * D * H
    const layerFlops = 2 * batchSize * featureDim * hiddenDim;
    const totalFlops = layerFlops * numLayers;

    // Dung lượng Activation Buffer cần giữ trong RAM/VRAM để phục vụ backward pass (FP32 = 4 bytes)
    // Mỗi tầng lưu 1 tensor kích hoạt Z: B x H x 4 bytes
    const activationBytesPerLayer = numElementsZ * 4;
    const totalActivationBytes = activationBytesPerLayer * numLayers;
    const totalActivationKb = totalActivationBytes / 1024;

    // Giả lập tỉ lệ tận dụng nhân GPU (GPU Core Utilization %)
    // B=1: lãng phí phần lớn nhân; B càng lớn càng bão hòa GPU
    let gpuUtilization = 15;
    if (batchSize === 2) gpuUtilization = 45;
    else if (batchSize === 4) gpuUtilization = 80;
    else if (batchSize >= 8) gpuUtilization = 95;

    const isOOM = totalActivationKb > gpuMaxVramKb;

    return {
      batchSize,
      featureDim,
      hiddenDim,
      numLayers,
      numElementsX,
      numElementsW,
      numElementsZ,
      layerFlops,
      totalFlops,
      totalActivationBytes,
      totalActivationKb: Number(totalActivationKb.toFixed(2)),
      gpuUtilization,
      isOOM,
      formulaGemmKaTeX: `X_{(${batchSize} \\times ${featureDim})} \\cdot W_{(${featureDim} \\times ${hiddenDim})} = Z_{(${batchSize} \\times ${hiddenDim})}`,
      formulaMemoryKaTeX: `\\text{RAM Buffer} = ${batchSize} \\times ${hiddenDim} \\times ${numLayers} \\times 4\\text{B} = ${totalActivationBytes}\\text{ Bytes}`
    };
  }
}

export const PRESETS = [
  {
    id: "batch_single",
    label: "Lô Đơn B = 1 (Lãng phí GPU)",
    state: { batchSize: 1, gpuMaxVramKb: 16 }
  },
  {
    id: "batch_sweet_spot",
    label: "Lô Vừa B = 4 (Tối ưu)",
    state: { batchSize: 4, gpuMaxVramKb: 16 }
  },
  {
    id: "batch_large_oom",
    label: "Lô Cực Đại B = 16 (Bão hòa & Nguy cơ OOM)",
    // Ngưỡng VRAM giả lập 0.5 KB: 16 x 4 x 3 tầng x 4 byte = 768 B = 0.75 KB > 0.5 KB
    state: { batchSize: 16, gpuMaxVramKb: 0.5 }
  }
];
