#!/usr/bin/env python3
"""
lessons/activation_checkpointing/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_activation_checkpointing():
    print("=== [Kiểm tra Bài: Activation Checkpointing] ===")
    L = 16

    # 1. Đỉnh bộ nhớ cho các giá trị k
    ks = [1, 2, 4, 8, 16]
    mems = [int(np.ceil(L / k) + k) for k in ks]
    assert mems == [17, 10, 8, 10, 17], f"Các đỉnh bộ nhớ phải là [17, 10, 8, 10, 17], nhận {mems}"

    # 2. k tối ưu khớp giải tích round(sqrt(L)) = 4
    k_opt = int(round(np.sqrt(L)))
    assert k_opt == 4
    assert min(mems) == 8 and mems[2] == 8

    # 3. Tiết kiệm 50% RAM
    saved_pct = ((L - min(mems)) / L) * 100
    assert np.isclose(saved_pct, 50.0)

    # 4. Chi phí tính toán: 4/3 = +33.33%
    time_normal = 1.0 + 2.0  # fwd + bwd
    time_checkpoint = 1.0 + 1.0 + 2.0  # fwd + recompute + bwd
    ratio = time_checkpoint / time_normal
    assert np.isclose(ratio, 4.0 / 3.0)
    print("-> Activation Checkpointing: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_activation_checkpointing()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
