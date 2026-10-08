#!/usr/bin/env python3
"""
lessons/gradient_check/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_gradient_check():
    print("=== [Kiểm tra Bài: Kiểm Tra Gradient Bằng Số] ===")
    x = np.array([1.0, 2.0])
    y = 3.0
    w = np.array([0.5, 0.5])

    def f(w_vec):
        return (np.dot(w_vec, x) - y) ** 2

    # f(w0) = (0.5*1 + 0.5*2 - 3)^2 = (-1.5)^2 = 2.25
    assert f(w) == 2.25

    # Đạo hàm giải tích: 2 * (w.x - y) * x = 2 * (-1.5) * [1, 2] = [-3, -6]
    grad_analytic = 2 * (np.dot(w, x) - y) * x
    assert np.allclose(grad_analytic, [-3.0, -6.0])

    # Sai phân trung tâm với eps = 1e-4
    eps = 1e-4
    grad_num = np.zeros(2)
    for i in range(2):
        w_plus = w.copy(); w_plus[i] += eps
        w_minus = w.copy(); w_minus[i] -= eps
        grad_num[i] = (f(w_plus) - f(w_minus)) / (2 * eps)

    rel_err = np.linalg.norm(grad_analytic - grad_num) / (np.linalg.norm(grad_analytic) + np.linalg.norm(grad_num))
    assert rel_err < 1e-7, f"Sai số tương đối phải < 1e-7, nhận được {rel_err}"

    # Lỗi bug quên nhân 2
    grad_bug = (np.dot(w, x) - y) * x
    rel_err_bug = np.linalg.norm(grad_bug - grad_num) / (np.linalg.norm(grad_bug) + np.linalg.norm(grad_num))
    assert rel_err_bug > 0.2, "Bug quên nhân 2 phải bị phát hiện"
    print("-> Gradient Check: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_gradient_check()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
