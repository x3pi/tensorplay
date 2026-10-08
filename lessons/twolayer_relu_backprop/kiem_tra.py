#!/usr/bin/env python3
"""
lessons/twolayer_relu_backprop/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    X = np.array([[1.0, 1.0]], dtype=np.float64)
    W1 = np.array([[1.0, -2.0], [0.0, 1.0]], dtype=np.float64)
    W2 = np.array([[1.0, 0.0], [0.0, 1.0]], dtype=np.float64)
    y = np.array([1])

    Z1 = np.dot(X, W1)
    A1 = np.maximum(Z1, 0.0)
    assert np.allclose(A1, [[1.0, 0.0]])

    Z2 = np.dot(A1, W2)
    P = np.exp(Z2) / np.sum(np.exp(Z2), axis=1, keepdims=True)
    Iy = np.array([[0.0, 1.0]])
    G2 = P - Iy
    grad_W2 = np.dot(A1.T, G2)
    assert grad_W2[1, 0] == 0.0 and grad_W2[1, 1] == 0.0

    signal = np.dot(G2, W2.T)
    G1 = signal * (Z1 > 0).astype(np.float64)
    grad_W1 = np.dot(X.T, G1)
    assert grad_W1[0, 1] == 0.0 and grad_W1[1, 1] == 0.0

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
