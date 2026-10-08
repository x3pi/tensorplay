#!/usr/bin/env python3
"""
lessons/minibatch_sgd/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    X = np.array([[1.0, 0.0], [0.0, 1.0]], dtype=np.float64)
    y = np.array([0, 1])
    theta = np.zeros((2, 2), dtype=np.float64)
    B = 2

    Z = np.dot(X, theta)
    P = np.exp(Z) / np.sum(np.exp(Z), axis=1, keepdims=True)
    Iy = np.array([[1.0, 0.0], [0.0, 1.0]])
    G = (P - Iy) / B
    grad = np.dot(X.T, G)
    theta_new = theta - 0.2 * grad

    assert np.isclose(theta_new[0, 0], 0.05)
    assert np.isclose(theta_new[1, 1], 0.05)

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
