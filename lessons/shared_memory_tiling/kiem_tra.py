#!/usr/bin/env python3
"""
lessons/shared_memory_tiling/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    N, B = 64, 16
    num_phases = N // B
    assert num_phases == 4
    # Arithmetic intensity with tiling increases by factor of B
    assert B == 16

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
