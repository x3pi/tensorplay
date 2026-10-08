#!/usr/bin/env python3
"""
lessons/adamw_weight_decay/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    w0 = 1.0
    lr = 0.1
    lamb = 0.1
    w_adamw = w0 - lr * lamb * w0
    assert np.isclose(w_adamw, 0.99)

    w = 1.0
    for _ in range(5):
        w = w - lr * lamb * w
    assert np.isclose(w, 0.95099, atol=1e-4)

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
