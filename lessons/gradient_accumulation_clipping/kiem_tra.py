#!/usr/bin/env python3
"""
lessons/gradient_accumulation_clipping/kiem_tra.py
Mô phỏng tích lũy gradient và cắt gradient bằng numpy, đối chiếu với torch-style clip_grad_norm_ cài thủ công.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402

NORMAL = np.array([[0.2, 0.1], [0.4, 0.3], [0.2, 0.5], [0.2, 0.1]])
SPIKE = NORMAL.copy()
SPIKE[3] = [11.8, 3.6]


def clip_norm(g, c=1.0):
    n = np.linalg.norm(g)
    return g * min(1.0, c / (n + 1e-12))


def cos(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))


def main() -> None:
    # --- Tích lũy gradient: trung bình các micro-batch bằng gradient batch lớn ---
    rng = np.random.default_rng(0)
    X, y, w = rng.normal(size=(8, 3)), rng.normal(size=8), rng.normal(size=3)
    grad = lambda Xb, yb: Xb.T @ (Xb @ w - yb) / len(yb)  # gradient trung bình của 0.5*(Xw-y)^2
    full = grad(X, y)
    micro = [grad(X[i:i + 2], y[i:i + 2]) for i in range(0, 8, 2)]
    assert np.allclose(np.mean(micro, axis=0), full), "Trung bình 4 micro-batch bằng đúng gradient batch 8"
    assert np.allclose(np.sum(micro, axis=0), 4 * full), "Quên chia: gradient gấp 4 lần"

    # --- Số liệu bài ---
    assert np.allclose(NORMAL.mean(0), [0.25, 0.25]) and np.allclose(SPIKE.mean(0), [3.15, 1.125])
    m = SPIKE.mean(0)
    assert np.isclose(np.linalg.norm(m), 3.3449, atol=1e-4)
    cn, cv = clip_norm(m), np.clip(m, -1, 1)
    assert np.allclose(cn, [0.9417, 0.3363], atol=1e-4) and np.isclose(np.linalg.norm(cn), 1.0)
    assert np.isclose(cos(m, cn), 1.0) and np.allclose(cv, [1, 1]) and np.isclose(cos(m, cv), 0.9037, atol=1e-4)
    assert np.allclose(clip_norm(NORMAL.mean(0)), NORMAL.mean(0)), "Gradient nhỏ không bị cắt"
    assert np.isclose(0.1 * np.linalg.norm(m) / (0.1 * np.linalg.norm(NORMAL.mean(0))), 9.46, atol=0.01)

    # --- Đối chiếu JS ---
    for preset, exp_raw in (("accumulate_ok", [0.25, 0.25]), ("forgot_divide", [1.0, 1.0]), ("spike_unclipped", [3.15, 1.125])):
        assert np.allclose(js_calc("gradient_accumulation_clipping", preset=preset)["raw"], exp_raw), preset
    js = js_calc("gradient_accumulation_clipping", preset="spike_norm_clip")
    assert np.allclose(js["clipped"], cn, atol=1e-4) and abs(js["cosine"] - 1.0) < 1e-6
    js = js_calc("gradient_accumulation_clipping", preset="spike_value_clip")
    assert js["clipped"] == [1, 1] and abs(js["cosine"] - cos(m, cv)) < 1e-4
    # cập nhật trọng số: w - lr * g
    assert np.allclose(js_calc("gradient_accumulation_clipping", preset="accumulate_ok")["wNew"], [1 - 0.025, 1 - 0.025])
    # bộ nhớ activation: micro-batch 2 mẫu so với batch 8 mẫu (1 GB mỗi mẫu)
    js = js_calc("gradient_accumulation_clipping")
    assert js["microGB"] == 2 and js["effectiveGB"] == 8


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
