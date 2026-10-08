#!/usr/bin/env python3
"""
lessons/zero_fsdp/kiem_tra.py
Đếm byte bằng kích thước mảng numpy thật cho từng thành phần trạng thái huấn luyện, rồi chia theo N.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402


def per_param_bytes():
    n = 1000
    weights16 = np.zeros(n, dtype=np.float16)
    grads16 = np.zeros(n, dtype=np.float16)
    master32, m32, v32 = (np.zeros(n, dtype=np.float32) for _ in range(3))
    w, g = weights16.nbytes / n, grads16.nbytes / n
    opt = (master32.nbytes + m32.nbytes + v32.nbytes) / n
    return w, g, opt


def zero_bytes(stage, N):
    w, g, opt = per_param_bytes()
    return {"dp": w + g + opt, "zero1": w + g + opt / N, "zero2": w + (g + opt) / N, "zero3": (w + g + opt) / N}[stage]


def main() -> None:
    w, g, opt = per_param_bytes()
    assert (w, g, opt) == (2.0, 2.0, 12.0) and w + g + opt == 16.0

    for stage, expect in (("dp", 16), ("zero1", 5.5), ("zero2", 3.75), ("zero3", 2)):
        assert zero_bytes(stage, 8) == expect, stage
        assert zero_bytes(stage, 1) == 16, "N = 1: không có gì để chia"
    assert [zero_bytes(s, 8) * 7 for s in ("dp", "zero1", "zero2", "zero3")] == [112.0, 38.5, 26.25, 14.0]
    assert np.isclose(zero_bytes("zero3", 64) * 70, 17.5) and np.isclose(zero_bytes("zero1", 64) * 70, 293.125)
    assert np.isclose(zero_bytes("zero2", 64) * 70, 155.3125) and zero_bytes("dp", 64) * 70 == 1120

    # Truyền thông: gradient FP16 = 2 byte/tham số
    N, S = 8, 2 * 7
    dp_traffic, z3_traffic = 2 * (N - 1) / N * S, 3 * (N - 1) / N * S
    assert np.isclose(dp_traffic, 24.5) and np.isclose(z3_traffic, 36.75) and np.isclose(z3_traffic / dp_traffic, 1.5)

    # Đối chiếu JS cho 5 preset
    for preset in ("dp_7b", "zero1_7b", "zero2_7b", "zero3_7b", "zero3_70b"):
        js = js_calc("zero_fsdp", preset=preset)
        expect_gb = zero_bytes(js["stage"], js["N"]) * js["paramsB"]
        assert abs(js["perGpuGB"] - expect_gb) < 1e-3, preset
        assert js["fits"] is bool(expect_gb <= 80), preset
    assert js_calc("zero_fsdp", preset="zero3_7b")["trafficRatio"] == 1.5
    assert js_calc("zero_fsdp", preset="zero3_70b")["savings"] == 64


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
