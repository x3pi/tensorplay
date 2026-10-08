#!/usr/bin/env python3
"""
lessons/autograd_graph/kiem_tra.py
Đồ thị z = x*w + b, L = 1/2 (z - y)^2: gradient giải tích, sai phân hữu hạn và bước cập nhật làm loss giảm.
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



def forward(x, w, b, y):
    z = x * w + b
    return z, 0.5 * (z - y) ** 2


def manual_backward(x, w, b, y):
    z, _ = forward(x, w, b, y)
    gz = z - y          # dL/dz
    return x * gz, gz, w * gz  # dL/dw, dL/db, dL/dx


def numeric(x, w, b, y, eps=1e-6):
    f = lambda xx, ww, bb: forward(xx, ww, bb, y)[1]
    gw = (f(x, w + eps, b) - f(x, w - eps, b)) / (2 * eps)
    gb = (f(x, w, b + eps) - f(x, w, b - eps)) / (2 * eps)
    gx = (f(x + eps, w, b) - f(x - eps, w, b)) / (2 * eps)
    return gw, gb, gx


def main() -> None:
    # --- đồ thị cũ của bài (nhánh rẽ, cộng dồn +=): z = (x + y) * y, x = 2, y = 3 ---
    x, y = 2.0, 3.0
    v1 = x + y
    z = v1 * y
    dz_dx, dz_dy = y, v1 + y * 1.0  # y xuất hiện ở 2 nhánh nên gradient cộng dồn
    assert z == 15.0 and dz_dx == 3.0 and dz_dy == 8.0
    f = lambda xx, yy: (xx + yy) * yy
    assert abs((f(x, y + 1e-6) - f(x, y - 1e-6)) / 2e-6 - dz_dy) < 1e-5

    # --- đồ thị của bài: mặc định x=2, w=1.5, b=0.5, y=4 ---
    z, L = forward(2.0, 1.5, 0.5, 4.0)
    assert z == 3.5 and L == 0.125
    gw, gb, gx = manual_backward(2.0, 1.5, 0.5, 4.0)
    assert (gw, gb, gx) == (-1.0, -0.5, -0.75)
    assert np.allclose(numeric(2.0, 1.5, 0.5, 4.0), (gw, gb, gx), atol=1e-6)

    # --- đối chiếu JS cho 3 preset ---
    for preset, (x_, w_, b_, y_) in (("default_flow", (2.0, 1.5, 0.5, 4.0)), ("perfect_prediction", (2.0, 1.75, 0.5, 4.0)), ("overshoot", (3.0, 2.0, 1.0, 2.0))):
        js = js_calc("autograd_graph", preset=preset)
        z_, L_ = forward(x_, w_, b_, y_)
        gw_, gb_, gx_ = manual_backward(x_, w_, b_, y_)
        assert abs(js["z"] - z_) < 1e-12 and abs(js["loss"] - L_) < 1e-12, preset
        assert abs(js["gradW"] - gw_) < 1e-12 and abs(js["gradB"] - gb_) < 1e-12 and abs(js["gradX"] - gx_) < 1e-12, preset
        assert np.allclose(numeric(x_, w_, b_, y_), (gw_, gb_, gx_), atol=1e-5)
        # bước SGD lr = 0.1
        w2, b2 = w_ - 0.1 * gw_, b_ - 0.1 * gb_
        assert abs(js["wNew"] - w2) < 1e-12 and abs(js["bNew"] - b2) < 1e-12
        assert abs(js["lossNew"] - forward(x_, w2, b2, y_)[1]) < 1e-12
        assert js["lossReduced"] is (L_ > 0), "Loss giảm sau 1 bước trừ khi đã bằng 0"
    assert js_calc("autograd_graph", preset="perfect_prediction")["gradW"] == 0


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
