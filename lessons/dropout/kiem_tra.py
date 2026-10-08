#!/usr/bin/env python3
"""
lessons/dropout/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_dropout():
    print("=== [Kiểm tra Bài: Inverted Dropout] ===")
    h = np.array([4.0, 2.0, 6.0, 4.0])
    mask = np.array([1.0, 0.0, 1.0, 0.0])
    p = 0.5
    scale = 1.0 / (1.0 - p) # scale = 2.0
    assert scale == 2.0

    out_train = h * mask * scale
    assert np.allclose(out_train, [8.0, 0.0, 12.0, 0.0])

    # Kỳ vọng năng lượng lúc train
    expected_mean = np.mean(h) # (4+2+6+4)/4 = 4.0
    assert expected_mean == 4.0

    # Gradient dội về với dL/dout = [1, 1, 1, 1]
    grad_out = np.array([1.0, 1.0, 1.0, 1.0])
    grad_in = grad_out * mask * scale
    assert np.allclose(grad_in, [2.0, 0.0, 2.0, 0.0])
    print("-> Dropout: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_dropout()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
