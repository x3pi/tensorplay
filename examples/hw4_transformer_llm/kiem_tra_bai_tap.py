#!/usr/bin/env python3
"""
kiem_tra_bai_tap.py
Script kiểm chứng tự động toàn bộ kết quả số học và nguyên lý toán học
cho các bài học Track 4 (HW4: Transformer & Hệ Thống LLM).
Tuân thủ nghiêm ngặt Quy Chuẩn AGENTS.md.
"""

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


def kiem_tra_kv_cache():
    print("=== [Kiểm tra Bài: KV Cache Memory Anatomy] ===")
    # Token thứ t=10 sinh ra: chỉ cần tính Q_new (1 token) nhân K_past (10 tokens)
    # Tiết kiệm O(t) phép nhân ma trận thừa thãi
    num_heads = 8
    seq_len = 512
    head_dim = 64
    bytes_per_fp16 = 2
    # Dung lượng 1 layer KV Cache: 2 (K và V) * num_heads * seq_len * head_dim * 2 bytes
    kv_layer_bytes = 2 * num_heads * seq_len * head_dim * bytes_per_fp16
    assert kv_layer_bytes == 1048576, f"1 layer KV Cache phải là 1MB (1048576 bytes), nhận được {kv_layer_bytes}"
    print("-> KV Cache: ĐẠT CHUẨN 100%\n")



def _softmax(s):
    e = np.exp(s - np.max(s))
    return e / e.sum()


def kiem_tra_positional_encoding():
    print("=== [Kiểm tra Bài 28: Positional Encoding & Hoán Vị Bất Biến] ===")
    E = {"chó": [1, 0], "cắn": [0, 1], "người": [1, 1]}

    def attend(tokens, use_pe, query):
        X = []
        for i, t in enumerate(tokens):
            pe = [np.sin(i * np.pi / 2), np.cos(i * np.pi / 2)] if use_pe else [0, 0]
            X.append(np.array(E[t], dtype=float) + pe)
        X = np.array(X)
        q = X[tokens.index(query)]
        w = _softmax(X @ q)
        return w, w @ X

    A = ["chó", "cắn", "người"]
    B = ["người", "cắn", "chó"]

    # Không PE: đầu ra của "cắn" giống hệt nhau ở hai câu
    _, out_a = attend(A, False, "cắn")
    _, out_b = attend(B, False, "cắn")
    assert np.allclose(out_a, out_b), "Không PE -> bất biến theo hoán vị"
    assert np.allclose(out_a, [0.5777, 0.8446], atol=1e-4)

    # Có PE: khác nhau
    w_a, out_a = attend(A, True, "cắn")
    w_b, out_b = attend(B, True, "cắn")
    assert np.allclose(w_a, [0.4223, 0.4223, 0.1554], atol=1e-4)
    assert np.allclose(w_b, [0.7054, 0.2595, 0.0351], atol=1e-4)
    assert np.allclose(out_a, [1.0, 0.8446], atol=1e-4)
    assert np.allclose(out_b, [1.0, 1.6351], atol=1e-4)
    assert np.linalg.norm(out_a - out_b) > 0.5
    print("-> Positional Encoding: ĐẠT CHUẨN 100%\n")


def kiem_tra_multi_head_attention():
    print("=== [Kiểm tra Bài 29: Multi-Head Attention] ===")
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


if __name__ == "__main__":
    print("==================================================")
    print("  KIỂM CHỨNG TOÁN HỌC TỰ ĐỘNG - TRACK 4 (TRANSFORMER)")
    print("==================================================\n")
    kiem_tra_rnn_bptt()
    kiem_tra_self_attention()
    kiem_tra_kv_cache()
    kiem_tra_positional_encoding()
    kiem_tra_multi_head_attention()
    print("🎉 TẤT CẢ CÁC BÀI TẬP TRACK 4 ĐỀU ĐẠT CHUẨN SỐ HỌC!")
