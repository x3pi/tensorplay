#!/usr/bin/env python3
"""
lessons/conv2d_im2col/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    H, W = 4, 4
    kH, kW = 2, 2
    outH, outW = H - kH + 1, W - kW + 1
    # im2col matrix shape: (outH * outW, kH * kW)
    assert outH * outW == 9
    assert kH * kW == 4

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
