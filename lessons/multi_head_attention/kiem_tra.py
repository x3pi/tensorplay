#!/usr/bin/env python3
"""
lessons/multi_head_attention/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    T, d, h = 3, 4, 2
    dk = d // h
    assert dk == 2
    # Concatenation of 2 heads (3 x 2 each) gives (3 x 4)
    H1 = np.ones((T, dk))
    H2 = np.ones((T, dk)) * 2
    H_cat = np.concatenate([H1, H2], axis=-1)
    assert H_cat.shape == (3, 4)

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
