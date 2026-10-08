#!/usr/bin/env python3
"""
lessons/kaiming_init/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_kaiming_init():
    print("=== [Kiểm tra Bài: Khởi Tạo Kaiming vs Xavier] ===")
    n = 4 # fan_in
    # Với ReLU: k = 0.5. gain = n * var * 0.5
    # Kaiming var = 2/n = 0.5 -> gain = 4 * 0.5 * 0.5 = 1.0
    var_kaiming = 2.0 / n
    gain_kaiming = n * var_kaiming * 0.5
    assert gain_kaiming == 1.0, f"Gain Kaiming phải bằng 1.0, nhận được {gain_kaiming}"

    # Sau 10 tầng: 1.0^10 = 1.0
    energy_kaiming_10 = gain_kaiming ** 10
    assert energy_kaiming_10 == 1.0

    # Xavier với ReLU: var = 1/n = 0.25 -> gain = 4 * 0.25 * 0.5 = 0.5
    var_xavier = 1.0 / n
    gain_xavier = n * var_xavier * 0.5
    assert gain_xavier == 0.5
    energy_xavier_10 = gain_xavier ** 10
    assert np.isclose(energy_xavier_10, 0.5 ** 10), "Xavier qua 10 tầng phải tiêu biến về 0.5^10"
    print("-> Kaiming Init: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_kaiming_init()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
