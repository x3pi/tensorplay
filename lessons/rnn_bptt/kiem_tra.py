#!/usr/bin/env python3
"""
lessons/rnn_bptt/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    w = 0.5
    T = 10
    grad_vanish = w ** (T - 1)
    assert grad_vanish < 0.01
    w_exp = 1.5
    grad_explode = w_exp ** (T - 1)
    assert grad_explode > 10.0
    grad_clipped = np.clip(grad_explode, -5.0, 5.0)
    assert grad_clipped == 5.0

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
