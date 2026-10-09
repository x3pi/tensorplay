#!/usr/bin/env python3
"""
lessons/cross_entropy_logsumexp/kiem_tra.py
Dùng kiểu số thật của numpy (float32, float16) làm chuẩn độc lập để kiểm chứng mô phỏng độ chính xác trong logic.js.
"""
import math
import pathlib
import sys
import warnings

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402

warnings.filterwarnings("ignore")


def naive_loss(z, y, dt):
    z = np.array(z, dtype=dt)
    with np.errstate(all="ignore"):
        e = np.exp(z)
        s = e.sum(dtype=dt)
        p = (e / s).astype(dt)
        return float(-np.log(p[y])), p


def lse_loss(z, y, dt):
    z = np.array(z, dtype=dt)
    with np.errstate(all="ignore"):
        m = z.max()
        lse = (m + np.log(np.exp(z - m).sum(dtype=dt))).astype(dt)
        return float((lse - z[y]).astype(dt))


def main() -> None:
    # --- Ngưỡng tràn / hụt của từng kiểu số ---
    assert math.isclose(np.log(float(np.finfo(np.float32).max)), 88.7228, abs_tol=1e-3)
    assert math.isclose(np.log(float(np.finfo(np.float16).max)), 11.09, abs_tol=1e-2)
    assert np.exp(np.float32(88)) < np.inf and np.exp(np.float32(89)) == np.inf
    assert np.exp(np.float16(11)) < np.inf and np.exp(np.float16(12)) == np.inf
    assert np.exp(np.float32(-110)) == 0.0 and np.exp(np.float16(-20)) == 0.0

    # --- Các tình huống của bài: numpy làm chuẩn ---
    cases = {
        "normal": (np.float32, [2.0, 1.0], 1),
        "underflow": (np.float32, [0.0, -110.0], 1),
        "overflow": (np.float32, [100.0, 99.0], 0),
        "fp16_overflow": (np.float16, [12.0, 11.0], 0),
        "fp16_underflow": (np.float16, [0.0, -20.0], 1),
    }
    expected = {
        "normal": (1.3132617, 1.3132617),
        "underflow": (math.inf, 110.0),
        "overflow": (math.nan, 0.31326),
        "fp16_overflow": (math.nan, 0.3125),
        "fp16_underflow": (math.inf, 20.0),
    }
    for name, (dt, z, y) in cases.items():
        naive, _ = naive_loss(z, y, dt)
        lse = lse_loss(z, y, dt)
        e_naive, e_lse = expected[name]
        if math.isnan(e_naive):
            assert math.isnan(naive), name
        else:
            assert naive == e_naive or math.isclose(naive, e_naive, rel_tol=1e-5), name
        assert math.isclose(lse, e_lse, rel_tol=2e-4, abs_tol=1e-4), (name, lse)

        # --- Đối chiếu JS: cùng kết quả với numpy ---
        js = js_calc("cross_entropy_logsumexp", preset=name if name in ("normal", "underflow", "overflow", "fp16_overflow", "fp16_underflow") else None)
        # JS trả Infinity/NaN dạng null qua JSON: null nghĩa là không hữu hạn
        if math.isnan(e_naive) or math.isinf(e_naive):
            assert js["lossNaive"] is None, name
        else:
            assert abs(js["lossNaive"] - naive) < 1e-4, name
        assert abs(js["lossLSE"] - lse) < 1e-3, name

    # --- LSE bằng numpy.logaddexp (nguồn độc lập thứ hai, tính ở float64) ---
    for z in ([2.0, 1.0], [0.0, -110.0], [100.0, 99.0], [1000.0, 999.0], [0.0, -1000.0]):
        assert math.isclose(float(np.logaddexp.reduce(np.array(z, dtype=np.float64))), max(z) + math.log1p(math.exp(min(z) - max(z))), rel_tol=1e-12, abs_tol=1e-300)

    # --- Gradient: giải tích = sai phân hữu hạn (float64) và tổng bằng 0 ---
    z = np.array([2.0, 1.0])
    p = np.exp(z - z.max()) / np.exp(z - z.max()).sum()
    g = p.copy()
    g[1] -= 1.0
    eps = 1e-6
    num = np.zeros(2)
    for i in range(2):
        zp, zm = z.copy(), z.copy()
        zp[i] += eps
        zm[i] -= eps
        num[i] = (lse_loss(zp, 1, np.float64) - lse_loss(zm, 1, np.float64)) / (2 * eps)
    assert np.allclose(g, num, atol=1e-5) and math.isclose(g.sum(), 0.0, abs_tol=1e-7)
    js = js_calc("cross_entropy_logsumexp", preset="normal")
    assert np.allclose(js["grad"], g, atol=1e-6) and np.allclose(js["gradNaive"], g, atol=1e-6)

    # Gradient Naive hỏng thành NaN ở mọi tình huống lỗi, còn gradient LSE hữu hạn
    for preset in ("underflow", "overflow", "fp16_overflow", "fp16_underflow"):
        js = js_calc("cross_entropy_logsumexp", preset=preset)
        assert all(v is None for v in js["gradNaive"]), preset
        assert all(v is not None for v in js["grad"]), preset
    assert js_calc("cross_entropy_logsumexp", preset="underflow")["grad"] == [1, -1]

    # --- FP32 vs FP16: cùng logit [12, 11] chỉ hỏng ở FP16 ---
    assert naive_loss([12.0, 11.0], 0, np.float32)[0] == naive_loss([12.0, 11.0], 0, np.float32)[0] > 0
    assert math.isnan(naive_loss([12.0, 11.0], 0, np.float16)[0])
    js = js_calc("cross_entropy_logsumexp", state={"z0": 12.0, "z1": 11.0, "y": 0, "mode": "naive", "precision": "fp32"})
    assert js["naiveBroken"] is False and abs(js["lossNaive"] - 0.31326) < 1e-4


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
