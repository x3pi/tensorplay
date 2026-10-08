#!/usr/bin/env python3
"""
lessons/self_attention/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    d_k = 4.0
    scale = np.sqrt(d_k)
    assert scale == 2.0
    s_raw = 4.0
    assert s_raw / scale == 2.0

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
