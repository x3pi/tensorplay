#!/usr/bin/env python3
"""
lessons/rope_rotary/kiem_tra.py
Dùng ma trận xoay numpy và vector ngẫu nhiên để chứng minh tính tương đối của RoPE.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402


def R(angle):
    c, s = np.cos(angle), np.sin(angle)
    return np.array([[c, -s], [s, c]])


def main() -> None:
    q, k = np.array([1.0, 0.0]), np.array([1.0, 0.0])
    # cos((m-n)θ) với θ = 90°
    deg = np.pi / 180
    got = [(R(m * 90 * deg) @ q) @ (R(1 * 90 * deg) @ k) for m in range(1, 5)]
    assert np.allclose(got, [1, 0, -1, 0], atol=1e-12)

    # Tính tương đối với vector ngẫu nhiên: (R_m q)·(R_n k) = qᵀ R_(n-m) k
    rng = np.random.default_rng(0)
    for _ in range(200):
        qv, kv = rng.normal(size=2), rng.normal(size=2)
        theta = rng.uniform(0.1, 3.0)
        m, n = rng.integers(0, 50, size=2)
        lhs = (R(m * theta) @ qv) @ (R(n * theta) @ kv)
        rhs = qv @ R((n - m) * theta) @ kv
        assert np.isclose(lhs, rhs, atol=1e-9)
        s = rng.integers(1, 30)
        assert np.isclose(lhs, (R((m + s) * theta) @ qv) @ (R((n + s) * theta) @ kv), atol=1e-9), "Dịch cả hai vị trí không đổi điểm"
        # xoay bảo toàn độ dài vector
        assert np.isclose(np.linalg.norm(R(m * theta) @ qv), np.linalg.norm(qv))

    # Cộng PE kiểu sin/cos thì không bất biến theo dịch
    def add(m, n, th):
        pe = lambda p: np.array([np.sin(p * th), np.cos(p * th)])
        return (q + pe(m)) @ (k + pe(n))
    th = 45 * deg
    assert np.isclose(add(3, 1, th), 1 + np.sqrt(2), atol=1e-9) and np.isclose(add(5, 3, th), 1.0, atol=1e-9)

    # Đối chiếu JS
    js = js_calc("rope_rotary", preset="shift_invariance")
    assert abs(js["rope1"] - (R(3 * th) @ q) @ (R(1 * th) @ k)) < 1e-6 and js["rope1"] == js["rope2"]
    assert abs(js["add1"] - add(3, 1, th)) < 1e-6 and abs(js["add2"] - add(5, 3, th)) < 1e-6
    for d, expect in enumerate([1.0, 0.7071, 0.0, -0.7071, -1.0]):
        assert abs(js["curve"][d]["score"] - expect) < 1e-4
    assert js_calc("rope_rotary", preset="quarter_turn")["rope1"] == -1.0


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
