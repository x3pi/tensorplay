/**
 * Robot "chết đuối" vì Memory Leak (Rò rỉ bộ nhớ)
 * Tính toán lượng byte, MB rò rỉ nếu dùng `new` mà không `delete`.
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      m: 60000, // số lượng ảnh
      batch: 100, // kích thước batch
      k: 10, // số lớp
      num_epochs: 50, // số epoch
      isFixed: false // Đã sửa lỗi delete[] chưa
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
    const { m, batch, k, num_epochs, isFixed } = this.state;
    
    // Số batch mỗi epoch
    const n_batches = Math.floor(m / batch);
    
    // float = 4 bytes
    const bytesPerBatch = batch * k * 4;
    
    // Mỗi epoch
    const bytesPerEpoch = n_batches * bytesPerBatch;
    const mbPerEpoch = bytesPerEpoch / (1024 * 1024);
    
    // Tổng số sau N epoch
    const totalBytes = bytesPerEpoch * num_epochs;
    const totalMb = totalBytes / (1024 * 1024);
    
    const leakBytes = isFixed ? 0 : totalBytes;
    const leakMb = isFixed ? 0 : totalMb;

    let verdict = "";
    if (isFixed) {
      verdict = "✅ Bạn đã thêm `delete[] Z;`. Không có byte nào bị rò rỉ. An toàn tuyệt đối!";
    } else {
      verdict = `🚨 CẢNH BÁO: Rò rỉ ${leakMb.toFixed(2)} MB RAM! Trình quản lý bộ nhớ của hệ điều hành sẽ Kill process này.`;
    }

    return {
      m, batch, k, num_epochs, isFixed,
      n_batches, bytesPerBatch, bytesPerEpoch, mbPerEpoch,
      totalBytes, totalMb, leakBytes, leakMb, verdict,
      formulaLeakKaTeX: isFixed 
        ? `\\text{Leak} = 0 \\text{ MB} \\quad (\\text{Đã giải phóng})`
        : `\\text{Leak} = ${n_batches} \\times (${batch} \\times ${k} \\times 4\\text{B}) \\times ${num_epochs} = ${totalMb.toFixed(2)}\\text{ MB}`
    };
  }
}

export const PRESETS = [
  {
    id: "hw0_default",
    label: "Cấu hình HW0 (60k ảnh, Batch 100)",
    state: { m: 60000, batch: 100, k: 10, num_epochs: 50, isFixed: false }
  },
  {
    id: "hw0_fixed",
    label: "Đã sửa lỗi (Thêm delete[])",
    state: { m: 60000, batch: 100, k: 10, num_epochs: 50, isFixed: true }
  },
  {
    id: "large_batch",
    label: "Batch lớn (Batch 1000)",
    state: { m: 60000, batch: 1000, k: 10, num_epochs: 50, isFixed: false }
  }
];
