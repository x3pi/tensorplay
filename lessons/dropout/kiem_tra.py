#!/usr/bin/env python3
"""
lessons/dropout/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    h = np.array([4.0, 2.0, 6.0, 4.0])
    mask = np.array([1.0, 0.0, 1.0, 0.0])
    p = 0.5
    scale = 1.0 / (1.0 - p)
    assert scale == 2.0
    out = h * mask * scale
    assert np.allclose(out, [8.0, 0.0, 12.0, 0.0])

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
