#!/usr/bin/env python3
"""
lessons/activation_checkpointing/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    L = 16
    ks = [1, 2, 4, 8, 16]
    mems = [int(np.ceil(L / k) + k) for k in ks]
    assert mems == [17, 10, 8, 10, 17]
    assert min(mems) == 8
    assert int(round(np.sqrt(L))) == 4

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
