#!/usr/bin/env python3
"""
lessons/rnn_bptt/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_rnn_bptt():
    print("=== [Kiểm tra Bài: RNN & BPTT qua thời gian] ===")
    w = 0.5
    T = 10
    # Gradient dội ngược qua chuỗi tuyến tính dL/dx1 = w^(T-1)
    grad_vanish = w ** (T - 1)
    assert np.isclose(grad_vanish, 0.5 ** 9), f"Gradient tiêu biến phải là 0.5^9, nhận được {grad_vanish}"
    assert grad_vanish < 0.01, "0.5^9 < 0.01 (tiêu biến)"

    w_exp = 1.5
    grad_explode = w_exp ** (T - 1)
    assert np.isclose(grad_explode, 1.5 ** 9)
    assert grad_explode > 10.0, "1.5^9 > 10.0 (bùng nổ)"

    # Gradient clipping tại threshold = 5.0
    clip_tau = 5.0
    grad_clipped = np.clip(grad_explode, -clip_tau, clip_tau)
    assert grad_clipped == 5.0
    print("-> RNN BPTT: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_rnn_bptt()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
