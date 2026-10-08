#!/usr/bin/env python3
"""
lessons/gradient_check/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    x = np.array([1.0, 2.0])
    y = 3.0
    w = np.array([0.5, 0.5])
    def f(w_vec):
        return (np.dot(w_vec, x) - y) ** 2

    grad_analytic = 2 * (np.dot(w, x) - y) * x
    eps = 1e-4
    grad_num = np.zeros(2)
    for i in range(2):
        wp, wm = w.copy(), w.copy()
        wp[i] += eps; wm[i] -= eps
        grad_num[i] = (f(wp) - f(wm)) / (2 * eps)
    rel_err = np.linalg.norm(grad_analytic - grad_num) / (np.linalg.norm(grad_analytic) + np.linalg.norm(grad_num))
    assert rel_err < 1e-7

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
