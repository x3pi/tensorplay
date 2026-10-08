#!/usr/bin/env python3
"""
lessons/positional_encoding/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    pos = 1
    d = 2
    pe = [np.sin(pos / (10000.0 ** (0 / d))), np.cos(pos / (10000.0 ** (0 / d)))]
    assert np.allclose(np.round(pe, 3), [0.841, 0.540])

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
