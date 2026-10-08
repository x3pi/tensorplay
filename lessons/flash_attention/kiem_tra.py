#!/usr/bin/env python3
"""
lessons/flash_attention/kiem_tra.py
Online Softmax và FlashAttention theo khối phải cho kết quả TRÙNG KHỚP attention chuẩn; công thức I/O của HBM.
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



def softmax_attention(Q, K, V):
    s = Q @ K.T / np.sqrt(Q.shape[1])
    s -= s.max(axis=1, keepdims=True)
    p = np.exp(s)
    p /= p.sum(axis=1, keepdims=True)
    return p @ V


def flash_attention(Q, K, V, block):
    """Duyệt K,V theo khối; giữ running max m, running sum l, và tích lũy O chưa chuẩn hóa."""
    n, d = Q.shape
    O = np.zeros((n, V.shape[1]))
    m = np.full(n, -np.inf)
    l = np.zeros(n)
    for j in range(0, K.shape[0], block):
        Kj, Vj = K[j:j + block], V[j:j + block]
        s = Q @ Kj.T / np.sqrt(d)
        m_new = np.maximum(m, s.max(axis=1))
        alpha = np.exp(m - m_new)
        p = np.exp(s - m_new[:, None])
        l = alpha * l + p.sum(axis=1)
        O = alpha[:, None] * O + p @ Vj
        m = m_new
    return O / l[:, None]


def main() -> None:
    # --- Online softmax ví dụ trong bài: khối 1 = [2, 4], khối 2 = [3, 5] ---
    x = np.array([2.0, 4.0, 3.0, 5.0])
    m1 = x[:2].max()
    l1 = np.exp(x[:2] - m1).sum()
    m_new = max(m1, x[2:].max())
    alpha = np.exp(m1 - m_new)
    l_new = alpha * l1 + np.exp(x[2:] - m_new).sum()
    assert np.isclose(l_new, np.exp(x - x.max()).sum()), "Online softmax = softmax toàn phần"
    assert np.isclose(l1, 1.1353, atol=1e-4) and np.isclose(alpha, 0.3679, atol=1e-4) and np.isclose(l_new, 1.5530, atol=1e-4)

    r = js_calc("flash_attention", preset="seq_8_demo")["onlineSoftmax"]
    assert r["m1"] == 4.0 and r["m_new"] == 5.0
    assert abs(r["l1"] - l1) < 1e-3 and abs(r["alpha"] - alpha) < 1e-3 and abs(r["l_new"] - l_new) < 1e-3

    # --- FlashAttention thật bằng numpy trùng khớp attention chuẩn, mọi cỡ khối ---
    rng = np.random.default_rng(7)
    Q, K, V = (rng.normal(size=(8, 4)) for _ in range(3))
    ref = softmax_attention(Q, K, V)
    for block in (1, 2, 4, 8):
        assert np.allclose(flash_attention(Q, K, V, block), ref, atol=1e-12), block

    # Ổn định số học: logit cực lớn không tràn
    Qb = Q * 1000
    assert np.all(np.isfinite(flash_attention(Qb, K, V, 4)))

    # --- I/O HBM: chuẩn 4*N^2*2, flash 4*N*d*2  => tỉ lệ N/d ---
    for preset, N in (("seq_8_demo", 8), ("seq_32_speedup", 32), ("seq_128_flash", 128)):
        js = js_calc("flash_attention", preset=preset)
        d = js["headDim"]
        assert js["standardHbmBytes"] == 4 * N * N * 2 and js["flashHbmBytes"] == 4 * N * d * 2
        assert abs(js["ioReductionRatio"] - round(N / d, 1)) < 1e-9
    # Điểm hòa vốn: flash chỉ tiết kiệm I/O khi N > d (với d = 64, N > 64)
    assert js_calc("flash_attention", state={"seqLen": 64})["ioReductionRatio"] == 1.0
    assert js_calc("flash_attention", preset="seq_128_flash")["ioReductionRatio"] == 2.0


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
