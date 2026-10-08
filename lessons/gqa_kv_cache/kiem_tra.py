#!/usr/bin/env python3
"""
lessons/gqa_kv_cache/kiem_tra.py
(1) GQA tương đương MHA với K,V được sao chép cho mỗi nhóm; (2) đếm dung lượng KV-Cache từ shape thật.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402


def attention(q, k, v):
    s = q @ k.T / np.sqrt(q.shape[-1])
    p = np.exp(s - s.max(-1, keepdims=True))
    p /= p.sum(-1, keepdims=True)
    return p @ v


def main() -> None:
    # --- GQA == MHA có K,V được lặp lại theo nhóm ---
    rng = np.random.default_rng(0)
    n_heads, n_kv, T, dh = 8, 2, 5, 4
    group = n_heads // n_kv
    Q = rng.normal(size=(n_heads, T, dh))
    K = rng.normal(size=(n_kv, T, dh))
    V = rng.normal(size=(n_kv, T, dh))
    gqa = np.stack([attention(Q[h], K[h // group], V[h // group]) for h in range(n_heads)])
    K_full, V_full = np.repeat(K, group, axis=0), np.repeat(V, group, axis=0)
    mha_tied = np.stack([attention(Q[h], K_full[h], V_full[h]) for h in range(n_heads)])
    assert np.allclose(gqa, mha_tied), "GQA bằng MHA với K,V sao chép"
    assert K.size * group == K_full.size, "Cache GQA nhỏ hơn MHA đúng group lần"

    # --- Đếm KV-Cache từ shape thật (FP16) ---
    L, heads, dh, d_model, ctx = 80, 64, 128, 8192, 4096
    def cache_bytes(nkv, tokens):
        cache = np.zeros((2, L, nkv, tokens, dh), dtype=np.float16)
        return cache.nbytes
    assert cache_bytes(64, 1) == 2621440 and cache_bytes(8, 1) == 327680 and cache_bytes(1, 1) == 40960
    gib = 1024 ** 3
    assert [cache_bytes(n, ctx) / gib for n in (64, 8, 1)] == [10.0, 1.25, 0.15625]
    assert 16 * cache_bytes(64, ctx) / gib == 160.0 > 140e9 / gib, "KV của MHA batch 16 lớn hơn trọng số 70B FP16"
    assert 16 * cache_bytes(8, ctx) / gib == 20.0 and 16 * cache_bytes(1, ctx) / gib == 2.5
    assert [int(40 // (cache_bytes(n, ctx) / gib)) for n in (64, 8, 1)] == [4, 32, 256]
    # Tham số W_K, W_V
    proj = lambda nkv: L * 2 * d_model * nkv * dh
    assert proj(64) == 10_737_418_240 and proj(8) == 1_342_177_280

    # --- Đối chiếu JS ---
    for preset, n in (("mha", 64), ("gqa8", 8), ("mqa", 1)):
        js = js_calc("gqa_kv_cache", preset=preset)
        assert js["bytesPerToken"] == cache_bytes(n, 1) and abs(js["perSeqGiB"] - cache_bytes(n, ctx) / gib) <= 1e-4
        assert js["reduction"] == 64 // n
    assert js_calc("gqa_kv_cache", preset="long_context_mha")["batchGiB"] == 8 * 80.0
    assert js_calc("gqa_kv_cache", preset="long_context_gqa")["batchGiB"] == 80.0


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
