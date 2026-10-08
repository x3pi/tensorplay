#!/usr/bin/env python3
"""
lessons/reverse_vs_forward_ad/kiem_tra.py
Gradient của f = x1*x2 + x2*x3 tính bằng số kép (forward), bằng đồ thị ngược (reverse) và bằng sai phân; chi phí theo N đầu vào, M đầu ra.
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



class Dual:
    """Số kép (giá trị, đạo hàm theo MỘT biến) cho forward-mode AD."""
    def __init__(self, v, d=0.0):
        self.v, self.d = v, d

    def __add__(self, o):
        return Dual(self.v + o.v, self.d + o.d)

    def __mul__(self, o):
        return Dual(self.v * o.v, self.d * o.v + self.v * o.d)


def forward_grad(x):
    g = []
    for i in range(3):  # N lượt forward, mỗi lượt gieo hạt vào một biến
        a, b, c = (Dual(x[j], 1.0 if j == i else 0.0) for j in range(3))
        g.append((a * b + b * c).d)
    return np.array(g)


def reverse_grad(x):
    x1, x2, x3 = x
    p, q = x1 * x2, x2 * x3
    # f = p + q ; lượt ngược DUY NHẤT từ đầu ra
    gp, gq = 1.0, 1.0
    return np.array([gp * x2, gp * x1 + gq * x3, gq * x2])


def numeric_grad(x, eps=1e-6):
    f = lambda v: v[0] * v[1] + v[1] * v[2]
    g = np.zeros(3)
    for i in range(3):
        xp, xm = np.array(x, float), np.array(x, float)
        xp[i] += eps
        xm[i] -= eps
        g[i] = (f(xp) - f(xm)) / (2 * eps)
    return g


def main() -> None:
    x = [2.0, 3.0, 4.0]
    gf, gr, gn = forward_grad(x), reverse_grad(x), numeric_grad(x)
    assert np.allclose(gf, [3, 6, 3]) and np.allclose(gr, gf) and np.allclose(gn, gf, atol=1e-5)

    js = js_calc("reverse_vs_forward_ad")
    assert js["fVal"] == 2 * 3 + 3 * 4 == 18
    assert [js["df_dx1"], js["df_dx2"], js["df_dx3"]] == [3, 6, 3]
    # đổi điểm tính: JS vẫn khớp AD
    js = js_calc("reverse_vs_forward_ad", state={"x1": -1, "x2": 5, "x3": 0.5})
    assert np.allclose([js["df_dx1"], js["df_dx2"], js["df_dx3"]], reverse_grad([-1, 5, 0.5]))

    # --- Chi phí: forward cần N lượt, reverse cần M lượt ---
    def costs(N, M, ops=50):
        forward = N * ops * 2
        reverse = ops + M * ops * 2
        return forward, reverse

    for preset, (N, M) in (("deep_learning_scale", (10_000, 1)), ("llm_scale", (1_000_000, 1)), ("robotics_kinematics", (6, 6))):
        js = js_calc("reverse_vs_forward_ad", preset=preset)
        f, r = costs(N, M)
        assert js["forwardOps"] == f and js["reverseOps"] == r, preset
        assert js["forwardPasses"] == N and js["reversePasses"] == M
        assert abs(js["speedup"] - round(max(1, f / r), 1)) < 1e-9

    # N lớn, M = 1: reverse thắng cỡ N/ (1 + 2M/..): hàng nghìn lần; N = M = 6: forward KHÔNG thua
    assert js_calc("reverse_vs_forward_ad", preset="deep_learning_scale")["speedup"] > 6000
    f, r = costs(6, 6)
    assert f <= r, "Khi số đầu ra bằng số đầu vào, forward-mode không đắt hơn"
    assert js_calc("reverse_vs_forward_ad", preset="robotics_kinematics")["speedup"] == 1.0


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
