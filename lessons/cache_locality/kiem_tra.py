#!/usr/bin/env python3
"""
lessons/cache_locality/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    rows, cols = 4, 8
    # Row-major stride for element (r, c): r * cols + c
    assert 2 * cols + 3 == 19
    # Column-major stride for element (r, c): c * rows + r
    assert 3 * rows + 2 == 14

    arr = np.arange(rows * cols).reshape(rows, cols)
    assert arr.flags['C_CONTIGUOUS']
    assert arr.strides == (cols * 8, 8)

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
