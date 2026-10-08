#!/usr/bin/env python3
"""
lessons/softmax_regression/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_bai_03():
    print("=== [Kiểm tra Bài 03: Softmax Regression & SGD] ===")
    X = np.array([[1.0, 0.0]])  # Biển Gạch Ngang (1, 0)
    W = np.array([
        [1.0, -1.0],
        [-1.0, 1.0]
    ])
    y_target = 0  # Lớp Dừng

    # Forward
    Z = np.dot(X, W)  # [1.0, -1.0]
    P = np.exp(Z - np.max(Z)) / np.sum(np.exp(Z - np.max(Z)))
    Loss_truoc = -math.log(P[0, y_target])

    # Backward: G = P - I_y
    G = P.copy()
    G[0, y_target] -= 1.0
    assert G[0, 0] < 0, "Lớp đúng thiếu điểm phải có gradient dội ngược mang dấu âm"
    assert G[0, 1] > 0, "Lớp sai thừa điểm phải có gradient dội ngược mang dấu dương"

    # Gradient: grad_W = X.T @ G
    grad_W = np.dot(X.T, G)

    # SGD update
    lr = 0.5
    W_moi = W - lr * grad_W

    # Kiểm chứng sau 1 bước cập nhật, robot thông minh hơn
    Z_sau = np.dot(X, W_moi)
    P_sau = np.exp(Z_sau - np.max(Z_sau)) / np.sum(np.exp(Z_sau - np.max(Z_sau)))
    Loss_sau = -math.log(P_sau[0, y_target])

    assert Loss_sau < Loss_truoc, f"Loss phải giảm sau 1 bước SGD ({Loss_sau:.4f} < {Loss_truoc:.4f})"
    assert P_sau[0, y_target] > P[0, y_target], "Độ tự tin của lớp đúng phải tăng lên"
    print(f"-> Loss trước: {Loss_truoc:.4f} -> Loss sau: {Loss_sau:.4f} (Đã giảm!)")
    print("-> Bài 03: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_bai_03()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
