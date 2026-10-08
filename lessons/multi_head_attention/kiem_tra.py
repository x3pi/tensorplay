#!/usr/bin/env python3
"""
lessons/multi_head_attention/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def _softmax(s):
    e = np.exp(s - np.max(s))
    return e / e.sum()


def kiem_tra_multi_head_attention():
    print("=== [Kiểm tra Bài 32: Multi-Head Attention] ===")
    X = np.array([[1, 0, 1, 0], [0, 1, 0, 1], [1, 0, 0, 1]], dtype=float)
    q_idx = 2  # token "pin"

    def mha(h):
        dk = X.shape[1] // h
        weights, outs = [], []
        for m in range(h):
            Xm = X[:, m * dk:(m + 1) * dk]
            w = _softmax(Xm @ Xm[q_idx])
            weights.append(w)
            outs.append(w @ Xm)
        return weights, np.concatenate(outs)

    w1, c1 = mha(1)
    assert np.allclose(w1[0], [0.2119, 0.2119, 0.5761], atol=1e-4)

    w2, c2 = mha(2)
    assert np.allclose(w2[0], [0.4223, 0.1554, 0.4223], atol=1e-4)
    assert np.allclose(w2[1], [0.1554, 0.4223, 0.4223], atol=1e-4)
    assert np.allclose(c2, [0.8446, 0.1554, 0.1554, 0.8446], atol=1e-4)

    w4, c4 = mha(4)
    assert np.allclose(w4[1], 1 / 3) and np.allclose(w4[2], 1 / 3), "d_k = 1 cột giữa -> chú ý đều"

    # Số tham số và KV-cache không đổi theo số đầu
    d = 4
    assert 4 * d * d == 64
    for h in (1, 2, 4):
        assert 2 * h * (d // h) == 2 * d
    print("-> Multi-Head Attention: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_multi_head_attention()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
