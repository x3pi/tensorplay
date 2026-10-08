#!/usr/bin/env python3
"""
lessons/softmax_regression/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    X = np.array([[1.0, 0.5]], dtype=np.float64)
    y = np.array([0])
    theta = np.zeros((2, 2), dtype=np.float64)

    Z = np.dot(X, theta)
    P = np.exp(Z) / np.sum(np.exp(Z), axis=1, keepdims=True)
    assert np.allclose(P, [[0.5, 0.5]])

    loss_before = -np.log(P[0, y[0]])
    G = P - np.array([[1.0, 0.0]])
    grad = np.dot(X.T, G)

    lr = 0.2
    theta_new = theta - lr * grad
    Z_new = np.dot(X, theta_new)
    P_new = np.exp(Z_new) / np.sum(np.exp(Z_new), axis=1, keepdims=True)
    loss_after = -np.log(P_new[0, y[0]])

    assert loss_after < loss_before
    assert P_new[0, 0] > 0.5

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
