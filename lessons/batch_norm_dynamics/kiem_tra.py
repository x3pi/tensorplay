#!/usr/bin/env python3
"""
lessons/batch_norm_dynamics/kiem_tra.py
Chuẩn hóa batch, hệ số gamma/beta và thống kê chạy (running stats).
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



def bn(x, gamma=1.0, beta=0.0, eps=1e-5):
    x = np.asarray(x, dtype=np.float64)
    mu, var = x.mean(), x.var()  # phương sai có thiên lệch (ddof=0) như BatchNorm
    return mu, var, gamma * (x - mu) / np.sqrt(var + eps) + beta


def main() -> None:
    batch = [2.0, 4.0, 6.0, 8.0]

    # --- numpy độc lập ---
    mu, var, y = bn(batch)
    assert np.isclose(mu, 5.0) and np.isclose(var, 5.0)
    assert np.allclose(y, [-1.3416, -0.4472, 0.4472, 1.3416], atol=1e-4)
    assert abs(y.mean()) < 1e-12 and np.isclose(y.var(), 1.0, atol=1e-5), "Đầu ra chuẩn hóa: mean 0, var ≈ 1"

    _, _, y2 = bn(batch, gamma=2.0, beta=1.0)
    assert np.isclose(y2.mean(), 1.0) and np.isclose(y2.var(), 4.0, atol=1e-4), "gamma nhân phương sai ×4, beta dời trung bình"

    # Running stats: (1 - m) * running + m * batch_stat
    assert np.isclose(0.9 * 0.0 + 0.1 * mu, 0.5) and np.isclose(0.9 * 1.0 + 0.1 * var, 1.4)

    # Inference dùng running stats cố định, KHÔNG phụ thuộc batch
    test_out = (4.0 - 5.0) / np.sqrt(5.0 + 1e-5)
    assert np.isclose(test_out, -0.4472, atol=1e-4)

    # --- đối chiếu JS ---
    r = js_calc("batch_norm_dynamics", preset="training_standard")
    assert np.allclose(r["normalizedBatch"], y, atol=0.006)
    assert r["meanB"] == 5.0 and r["varB"] == 5.0
    assert r["newRunningMean"] == 0.5 and r["newRunningVar"] == 1.4
    r = js_calc("batch_norm_dynamics", preset="scale_shift_active")
    assert np.allclose(r["outputBatch"], y2, atol=0.006) and r["outMean"] == 1.0 and abs(r["outVar"] - 4.0) < 0.01
    r = js_calc("batch_norm_dynamics", preset="eval_frozen_stats")
    assert abs(r["testOutput"] - test_out) < 0.006

    # Batch đổi, chế độ inference cho đầu ra cho mẫu thử KHÔNG đổi
    a = js_calc("batch_norm_dynamics", state={"mode": "inference", "runningMean": 5.0, "runningVar": 5.0, "batch": [1.0, 2.0, 3.0, 4.0]})
    b = js_calc("batch_norm_dynamics", state={"mode": "inference", "runningMean": 5.0, "runningVar": 5.0, "batch": [100.0, 200.0, 300.0, 400.0]})
    assert a["testOutput"] == b["testOutput"]


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
