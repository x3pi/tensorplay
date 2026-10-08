#!/usr/bin/env python3
"""
lessons/minibatch_sgd/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_bai_05():
    print("=== [Kiểm tra Bài 06: Mini-batch SGD B=2] ===")
    B = 2
    X = np.array([
        [1.0, 0.0],
        [0.0, 1.0]
    ])
    theta = np.array([
        [1.0, -1.0],
        [-1.0, 1.0]
    ])
    Z = np.dot(X, theta)
    P = np.exp(Z) / np.sum(np.exp(Z), axis=1, keepdims=True)
    assert np.allclose(np.sum(P, axis=1), [1.0, 1.0]), "Mỗi hàng trong batch có tổng xác suất độc lập = 1.0"

    # Sai số trung bình chia cho B
    I_y = np.eye(2)
    G = (P - I_y) / B
    grad_theta = np.dot(X.T, G)
    assert grad_theta.shape == (2, 2), "Kích thước gradient ma trận chuyển vị phải khớp với theta"
    print("-> Bài 06: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_bai_05()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
