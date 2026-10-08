#!/usr/bin/env python3
"""
lessons/broadcast_grad/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    P = np.array([[2.0, 0.0], [0.0, 1.0]])
    Y = np.array([[3.0, 0.0], [1.0, 2.0]])
    b0 = np.array([0.0, 0.0])
    G = (P + b0) - Y
    grad_b = np.sum(G, axis=0)
    assert np.allclose(grad_b, [-2.0, -1.0])
    b1 = b0 - 0.5 * grad_b
    assert np.allclose(b1, [1.0, 0.5])

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
