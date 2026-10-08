#!/usr/bin/env python3
"""
lessons/activation_valves/kiem_tra.py
Van ReLU, Dying ReLU và lời nguyền khởi tạo trọng số bằng 0 (đối xứng).
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



def relu(z):
    return np.maximum(0.0, z)


def loss_fn(w, x, b, target):
    a = relu(w * x + b)  # hai nơ-ron ẩn, đầu ra y = a1 + a2
    return 0.5 * (a.sum() - target) ** 2


def num_grad(w, x, b, target, eps=1e-6):
    g = np.zeros_like(w)
    for i in range(len(w)):
        wp, wm = w.copy(), w.copy()
        wp[i] += eps
        wm[i] -= eps
        g[i] = (loss_fn(wp, x, b, target) - loss_fn(wm, x, b, target)) / (2 * eps)
    return g


def main() -> None:
    # --- Van ReLU đơn: đạo hàm = 1 nếu z > 0 ngược lại 0 (kể cả đúng tại z = 0) ---
    z = np.array([-2.5, -1.5, 0.0, -0.1, 2.0, 1.5])
    assert np.allclose((z > 0).astype(float), [0, 0, 0, 0, 1, 1])
    assert np.allclose(relu(z), [0, 0, 0, 0, 2.0, 1.5])
    for zz, out, grad in ((1.5, 1.5, 1.0), (-2.5, 0.0, 0.0), (-1.0, 0.0, 0.0)):
        js = js_calc("activation_valves", state={"z": zz})
        assert js["reluOut"] == out and js["reluGrad"] == grad and js["isValveOpen"] is (grad == 1.0)

    # --- Lời nguyền W = 0, x = 2, target = 3: ReLU'(0) = 0 nên cả hai gradient bằng 0 ---
    w, b = np.zeros(2), np.zeros(2)
    js = js_calc("activation_valves", preset="zero_curse")
    assert js["gradW1"] == 0 and js["gradW2"] == 0 and js["isSymmetric"] is True
    assert js["yPred"] == 0 and np.isclose(js["loss"], 0.5 * 3.0 ** 2)

    # --- Khởi tạo khác nhau: gradient của hai nơ-ron KHÁC nhau và khớp sai phân hữu hạn ---
    w, b = np.array([0.8, -0.4]), np.array([0.1, -0.1])
    js = js_calc("activation_valves", preset="random_he_init")
    num = num_grad(w, 2.0, b, 3.0)
    assert np.allclose([js["gradW1"], js["gradW2"]], num, atol=1e-5), (js["gradW1"], js["gradW2"], num)
    assert js["isSymmetric"] is False
    assert js["gradW2"] == 0 and js["gradW1"] != 0, "Nơ-ron 2 có z2 = 2*(-0.4) - 0.1 < 0: van đóng, gradient 0"

    # --- Hai nơ-ron cùng khởi tạo khác 0 vẫn đối xứng mãi mãi dưới SGD ---
    st = {"w1": 0.5, "w2": 0.5, "b1": 0.0, "b2": 0.0, "xInput": 2.0, "targetY": 3.0, "lr": 0.1}
    w = np.array([0.5, 0.5])
    for _ in range(5):
        a = relu(w * 2.0)
        diff = a.sum() - 3.0
        w = w - 0.1 * diff * (w * 2.0 > 0) * 2.0
    assert np.isclose(w[0], w[1]), "Cùng khởi tạo -> cùng gradient -> mãi bằng nhau (đối xứng)"


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
