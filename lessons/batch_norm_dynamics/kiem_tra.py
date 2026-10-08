#!/usr/bin/env python3
"""
lessons/batch_norm_dynamics/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    X = np.array([[1.0, 3.0], [2.0, 6.0]], dtype=np.float64)
    mu = X.mean(axis=0)
    std = X.std(axis=0)
    bn = (X - mu) / std
    assert np.allclose(bn, [[-1.0, -1.0], [1.0, 1.0]])

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
