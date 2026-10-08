#!/usr/bin/env python3
"""
lessons/transformer_block_params/kiem_tra.py
Dựng một khối Transformer bằng numpy, đếm tham số từ kích thước mảng thật và đối chiếu công thức.
"""
import numpy as np


def layer_norm(x):
    return (x - x.mean(-1, keepdims=True)) / np.sqrt(x.var(-1, keepdims=True) + 1e-5)


def build_block(d, m, rng):
    return {
        "Wq": rng.normal(size=(d, d)), "Wk": rng.normal(size=(d, d)),
        "Wv": rng.normal(size=(d, d)), "Wo": rng.normal(size=(d, d)),
        "W1": rng.normal(size=(d, m * d)), "W2": rng.normal(size=(m * d, d)),
    }


def forward(x, blk, heads):
    n, d = x.shape
    dk = d // heads
    h = layer_norm(x)
    q, k, v = h @ blk["Wq"], h @ blk["Wk"], h @ blk["Wv"]
    outs = []
    for i in range(heads):
        s = slice(i * dk, (i + 1) * dk)
        sc = q[:, s] @ k[:, s].T / np.sqrt(dk)
        w = np.exp(sc - sc.max(-1, keepdims=True))
        w /= w.sum(-1, keepdims=True)
        outs.append(w @ v[:, s])
    x = x + np.concatenate(outs, -1) @ blk["Wo"]
    h = layer_norm(x)
    x = x + np.maximum(0, h @ blk["W1"]) @ blk["W2"]
    return x


def main() -> None:
    rng = np.random.default_rng(0)
    d, m = 4, 4
    blk = build_block(d, m, rng)
    count = sum(a.size for a in blk.values())
    attn = sum(blk[k].size for k in ("Wq", "Wk", "Wv", "Wo"))
    ffn = blk["W1"].size + blk["W2"].size
    assert attn == 64 and ffn == 128 and count == 192 == 12 * d * d
    assert abs(ffn / count - 2 / 3) < 1e-12

    # Hình dạng được bảo toàn (cần cho residual) và số đầu không đổi tham số
    x = rng.normal(size=(3, d))
    for heads in (1, 2, 4):
        assert forward(x, blk, heads).shape == x.shape

    # m = 2
    blk2 = build_block(d, 2, rng)
    assert sum(a.size for a in blk2.values()) == 8 * d * d

    # Mô hình thật
    def total(d, L, V, m=4):
        return L * (4 + 2 * m) * d * d + V * d
    assert 12 * 12 * 768 * 768 == 84_934_656 and 50257 * 768 == 38_597_376
    assert total(768, 12, 50257) == 123_532_032
    assert total(4096, 32, 32000) == 6_573_522_944
    assert abs(total(4096, 32, 32000) * 2 / 1e9 - 13.147) < 1e-3, "FP16 inference GB"
    assert abs(total(4096, 32, 32000) * 16 / 1e9 - 105.176) < 1e-3, "Adam mixed precision GB"
    assert abs(total(8192, 80, 32000) / 1e9 - 64.69) < 0.01
    # FLOPs mỗi token ≈ 2 * tham số
    assert abs(2 * total(4096, 32, 32000) / 1e9 - 13.147) < 1e-3


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
