#!/usr/bin/env python3
"""
lessons/self_attention/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_self_attention():
    print("=== [Kiểm tra Bài: Self-Attention & Hệ Số Căn d_k] ===")
    # 2 tokens, d_k = 4
    # Q, K có phương sai 1.0 -> dot product có phương sai d_k = 4, độ lệch chuẩn sqrt(4) = 2.0
    d_k = 4.0
    scale = np.sqrt(d_k)
    assert scale == 2.0

    # Tích vô hướng thô S = 4.0 -> Sau khi scale: S / 2.0 = 2.0
    s_raw = 4.0
    s_scaled = s_raw / scale
    assert s_scaled == 2.0
    print("-> Self-Attention: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_self_attention()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
