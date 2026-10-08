#!/usr/bin/env python3
"""
lessons/softmax_stability/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    z_extreme = np.array([1000.0, 999.0], dtype=np.float64)
    c = np.max(z_extreme)
    assert c == 1000.0

    z_shifted = z_extreme - c
    assert np.allclose(z_shifted, [0.0, -1.0])

    exp_shifted = np.exp(z_shifted)
    probs = exp_shifted / np.sum(exp_shifted)
    assert not np.isnan(probs).any()
    assert np.isclose(probs[0], 1.0 / (1.0 + np.exp(-1.0)))

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
