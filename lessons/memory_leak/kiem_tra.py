#!/usr/bin/env python3
"""
lessons/memory_leak/kiem_tra.py
Rò rỉ bộ nhớ = tổng activation chưa giải phóng. Đo thật bằng tracemalloc.
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



import tracemalloc


def main() -> None:
    m, batch, k, epochs = 60000, 100, 10, 50
    n_batches = m // batch
    per_batch = batch * k * 4  # float32
    per_epoch = n_batches * per_batch
    total = per_epoch * epochs
    assert (n_batches, per_batch, per_epoch, total) == (600, 4000, 2_400_000, 120_000_000)
    assert abs(total / 1024 ** 2 - 114.44) < 0.01

    # --- Đo thật 1 epoch: tạo 600 mảng float32 (100 x 10) mà KHÔNG giải phóng ---
    tracemalloc.start()
    kept = [np.zeros((batch, k), dtype=np.float32) for _ in range(n_batches)]
    current, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    assert abs(current - per_epoch) / per_epoch < 0.05, f"đo được {current} B, lý thuyết {per_epoch} B"
    del kept

    # Bất biến: rò rỉ mỗi epoch = m*k*4 byte, KHÔNG phụ thuộc kích thước batch
    for b in (10, 100, 1000, 6000):
        assert (m // b) * (b * k * 4) == m * k * 4 == per_epoch

    # --- đối chiếu JS ---
    js = js_calc("memory_leak", preset="leak_default")
    assert js["n_batches"] == n_batches and js["bytesPerBatch"] == per_batch
    assert js["bytesPerEpoch"] == per_epoch and js["totalBytes"] == total and js["leakBytes"] == total
    fixed = js_calc("memory_leak", preset="leak_fixed")
    assert fixed["leakBytes"] == 0 and fixed["totalBytes"] == total, "Sửa lỗi chỉ xóa phần rò rỉ, không đổi tổng cấp phát"
    big = js_calc("memory_leak", preset="large_batch")
    assert big["bytesPerEpoch"] == per_epoch and big["leakBytes"] == total, "Batch lớn không giảm tổng rò rỉ"
    assert js_calc("memory_leak", state={"num_epochs": 100})["leakBytes"] == 2 * total, "Rò rỉ tuyến tính theo số epoch"


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
