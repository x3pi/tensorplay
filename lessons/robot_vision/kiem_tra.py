#!/usr/bin/env python3
"""
lessons/robot_vision/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_bai_01():
    print("=== [Kiểm tra Bài 01: Robot Vision & Dot Product] ===")
    # 1. Ảnh chuẩn gạch ngang và khuôn dập W
    X_std = np.array([1, 1, 0, 0])
    W = np.array([1, 1, -1, -1])
    Z_std = np.dot(X_std, W)
    assert Z_std == 2, f"Điểm chuẩn phải là 2, nhận được {Z_std}"

    # 2. Ảnh dính bụi (pixel 2 bị xám 0.5)
    X_dust = np.array([1, 1, 0.5, 0])
    Z_dust = np.dot(X_dust, W)
    assert Z_dust == 1.5, f"Điểm dính bụi phải là 1.5, nhận được {Z_dust}"
    assert Z_dust > 1.0, "Ngưỡng quyết định 1.0 vẫn nhận diện đúng khi dính bụi nhẹ"

    # 3. Đèn pha chói lòa [1, 1, 1, 1] bị triệt tiêu bởi trọng số âm
    X_headlight = np.array([1, 1, 1, 1])
    Z_headlight = np.dot(X_headlight, W)
    assert Z_headlight == 0, f"Đèn pha phải bị triệt tiêu về 0, nhận được {Z_headlight}"

    # 4. Ánh xạ 2D -> 1D
    r, c, N = 1, 0, 2
    offset = r * N + c
    assert offset == 2, f"Offset của (1, 0) với N=2 phải bằng 2, nhận được {offset}"
    print("-> Bài 01: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_bai_01()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
