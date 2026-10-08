#!/usr/bin/env python3
"""
lessons/strides_views/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_strides_views():
    print("=== [Kiểm tra Bài: Strides & Views trong NDArray] ===")
    # Mảng 1D 6 phần tử: [0, 1, 2, 3, 4, 5] (tương ứng a, b, c, d, e, f)
    raw_mem = np.array([10, 20, 30, 40, 50, 60], dtype=np.float32)

    # View 2x3: shape=(2, 3), strides=(3*4, 1*4) bytes = (12, 4)
    v_base = np.lib.stride_tricks.as_strided(raw_mem, shape=(2, 3), strides=(3*4, 1*4))
    assert v_base.flags['C_CONTIGUOUS'] == True
    # Phần tử (1, 2): offset + 1*3 + 2*1 = 5 -> giá trị 60
    assert v_base[1, 2] == 60

    # Transpose 3x2: shape=(3, 2), strides=(1*4, 3*4) bytes = (4, 12)
    v_trans = np.lib.stride_tricks.as_strided(raw_mem, shape=(3, 2), strides=(1*4, 3*4))
    assert v_trans.flags['C_CONTIGUOUS'] == False, "Transpose view không còn contiguous"
    assert v_trans[2, 1] == 60 # ô (2, 1) trong ma trận chuyển vị chính là ô (1, 2) cũ

    # Broadcast: shape=(3, 3), strides=(0, 1*4) bytes
    v_bcast = np.lib.stride_tricks.as_strided(raw_mem, shape=(3, 3), strides=(0, 1*4))
    assert v_bcast.shape == (3, 3)
    assert np.all(v_bcast[0] == v_bcast[1]) and np.all(v_bcast[1] == v_bcast[2])
    print("-> Strides Views: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_strides_views()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
