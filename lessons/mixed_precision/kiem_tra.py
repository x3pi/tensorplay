#!/usr/bin/env python3
"""
lessons/mixed_precision/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    info = np.finfo(np.float16)
    assert float(info.max) == 65504.0
    g = 1e-8
    assert float(np.float16(g)) == 0.0
    S = 1024.0
    stored = np.float16(g * S)
    assert float(stored) > 0
    recovered = np.float32(stored) / np.float32(S)
    rel_err = abs(float(recovered) - g) / g
    assert rel_err < 0.01

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
