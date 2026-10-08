#!/usr/bin/env python3
"""
lessons/layernorm_residual/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    X = np.array([[1.0, 3.0], [2.0, 6.0]], dtype=np.float64)
    ln = (X - X.mean(axis=1, keepdims=True)) / X.std(axis=1, keepdims=True)
    assert np.allclose(ln, [[-1.0, 1.0], [-1.0, 1.0]])
    L, fp = 6, 0.1
    assert np.isclose((1.0 + fp) ** L, 1.771561)

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
