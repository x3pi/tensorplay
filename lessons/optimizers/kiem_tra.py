#!/usr/bin/env python3
"""
lessons/optimizers/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_optimizers():
    print("=== [Kiểm tra Bài: Động Học Các Bộ Tối Ưu] ===")
    p0 = np.array([-4.0, 1.0])
    # f(x, y) = 0.5 * (0.2 x^2 + 4 y^2)
    loss0 = 0.5 * (0.2 * (-4.0)**2 + 4 * (1.0)**2)
    assert loss0 == 3.6, f"Loss ban đầu phải là 3.6, nhận được {loss0}"

    g0 = np.array([0.2 * (-4.0), 4.0 * 1.0])
    assert np.allclose(g0, [-0.8, 4.0])

    # SGD 1 bước với lr = 0.1
    p1_sgd = p0 - 0.1 * g0
    assert np.allclose(p1_sgd, [-3.92, 0.6])
    loss1_sgd = 0.5 * (0.2 * (p1_sgd[0])**2 + 4 * (p1_sgd[1])**2)
    assert np.isclose(loss1_sgd, 2.25664)

    # Giới hạn phân kỳ trục y: Hessian = 4. Hệ số sai phân (1 - 4 * lr).
    # Với lr = 0.55: |1 - 4 * 0.55| = |-1.2| = 1.2 > 1 -> bùng nổ
    assert abs(1 - 4 * 0.55) > 1.0
    print("-> Optimizers: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_optimizers()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
