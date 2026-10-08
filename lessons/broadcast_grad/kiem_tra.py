#!/usr/bin/env python3
"""
lessons/broadcast_grad/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_broadcast_grad():
    print("=== [Kiểm tra Bài: Gradient Của Broadcast (Cộng dồn)] ===")
    P = np.array([[2.0, 0.0], [0.0, 1.0]])
    Y = np.array([[3.0, 0.0], [1.0, 2.0]])
    b0 = np.array([0.0, 0.0])

    # Forward
    Z = P + b0
    G = Z - Y
    assert np.allclose(G, [[-1.0, 0.0], [-1.0, -1.0]])
    loss0 = 0.5 * np.sum(G ** 2)
    assert loss0 == 1.5

    # Đạo hàm cộng dồn dọc theo trục batch (axis 0)
    grad_b = np.sum(G, axis=0)
    assert np.allclose(grad_b, [-2.0, -1.0])

    # Cập nhật 1 bước với lr = 0.5
    lr = 0.5
    b1 = b0 - lr * grad_b
    assert np.allclose(b1, [1.0, 0.5])
    Z1 = P + b1
    loss1 = 0.5 * np.sum((Z1 - Y) ** 2)
    assert loss1 == 0.25, f"Loss sau 1 bước phải là 0.25, nhận được {loss1}"

    # Lỗi ghi đè (chỉ lấy hàng cuối)
    grad_b_bug = G[-1]
    assert np.allclose(grad_b_bug, [-1.0, -1.0])
    print("-> Broadcast Grad: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_broadcast_grad()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
