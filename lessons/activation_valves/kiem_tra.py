#!/usr/bin/env python3
"""
lessons/activation_valves/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    z = np.array([-1.5, 2.0, 0.0, -0.1], dtype=np.float32)
    mask = (z > 0).astype(np.float32)
    assert np.allclose(mask, [0.0, 1.0, 0.0, 0.0])

    upstream_grad = np.array([1.0, 1.0, 1.0, 1.0], dtype=np.float32)
    downstream_grad = upstream_grad * mask
    assert np.allclose(downstream_grad, [0.0, 1.0, 0.0, 0.0])

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
