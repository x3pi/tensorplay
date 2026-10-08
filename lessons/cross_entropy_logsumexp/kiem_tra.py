#!/usr/bin/env python3
"""
lessons/cross_entropy_logsumexp/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_cross_entropy_logsumexp():
    print("=== [Kiểm tra Bài: Cross-Entropy dạng Log-Sum-Exp] ===")
    def lse(z):
        m = np.max(z)
        return m + np.log(np.sum(np.exp(z - m)))

    def loss_lse(z, y):
        return lse(z) - z[y]

    # 1. Trường hợp bình thường [2.0, 1.0], nhãn y=1
    z_norm = np.array([2.0, 1.0])
    lse_norm = lse(z_norm)
    assert math.isclose(lse_norm, 2.3132616875, rel_tol=1e-5)
    loss_norm = loss_lse(z_norm, 1)
    assert math.isclose(loss_norm, 1.3132616875, rel_tol=1e-5)

    # 2. Trường hợp chênh lệch cực đại [0.0, -1000.0], nhãn y=1 (Underflow)
    z_under = np.array([0.0, -1000.0])
    # Naive: exp(-1000) -> 0.0 -> log(0) -> -inf -> loss = inf
    loss_under_lse = loss_lse(z_under, 1)
    assert loss_under_lse == 1000.0, f"Loss LSE phải đúng bằng 1000.0, nhận được {loss_under_lse}"

    # 3. Trường hợp số cực lớn [1000.0, 999.0], nhãn y=0 (Overflow)
    z_over = np.array([1000.0, 999.0])
    loss_over_lse = loss_lse(z_over, 0)
    assert math.isclose(loss_over_lse, 0.3132616875, rel_tol=1e-5)

    # 4. Kiểm chứng Gradient bằng sai phân hữu hạn (Numerical Gradient)
    eps = 1e-6
    grad_analytical = np.exp(z_norm - np.max(z_norm)) / np.sum(np.exp(z_norm - np.max(z_norm)))
    grad_analytical[1] -= 1.0  # target y=1

    grad_numerical = np.zeros(2)
    for i in range(2):
        z_pos = z_norm.copy()
        z_neg = z_norm.copy()
        z_pos[i] += eps
        z_neg[i] -= eps
        grad_numerical[i] = (loss_lse(z_pos, 1) - loss_lse(z_neg, 1)) / (2 * eps)

    assert np.allclose(grad_analytical, grad_numerical, atol=1e-5), "Gradient giải tích và sai phân hữu hạn phải khớp nhau"
    assert math.isclose(np.sum(grad_analytical), 0.0, abs_tol=1e-7), "Tổng các phần tử gradient luôn bằng 0"
    print("-> Cross-Entropy LogSumExp: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_cross_entropy_logsumexp()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
