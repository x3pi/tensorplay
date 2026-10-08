#!/usr/bin/env python3
"""
lessons/kv_cache_anatomy/kiem_tra.py
KV-Cache cho kết quả giống hệt tính lại từ đầu, giảm số token phải tính, và công thức dung lượng VRAM.
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



rng = np.random.default_rng(3)
D = 4
Wq, Wk, Wv = (rng.normal(size=(D, D)) for _ in range(3))


def attend_last(q, K, V):
    s = K @ q / np.sqrt(D)
    p = np.exp(s - s.max())
    p /= p.sum()
    return p @ V


def decode_no_cache(X):
    """Mỗi bước tính lại K, V cho TOÀN BỘ tiền tố. Trả (đầu ra mỗi bước, số lần chiếu token)."""
    outs, proj = [], 0
    for t in range(1, len(X) + 1):
        pref = X[:t]
        K, V = pref @ Wk, pref @ Wv
        proj += t
        outs.append(attend_last(pref[-1] @ Wq, K, V))
    return np.array(outs), proj


def decode_cache(X):
    """Mỗi bước chỉ chiếu token mới, nối vào cache."""
    Kc, Vc, outs, proj = [], [], [], 0
    for x in X:
        Kc.append(x @ Wk)
        Vc.append(x @ Wv)
        proj += 1
        outs.append(attend_last(x @ Wq, np.array(Kc), np.array(Vc)))
    return np.array(outs), proj


def main() -> None:
    X = rng.normal(size=(6, D))
    o1, p1 = decode_no_cache(X)
    o2, p2 = decode_cache(X)
    assert np.allclose(o1, o2, atol=1e-12), "KV-Cache không đổi kết quả, chỉ đổi chi phí"
    assert p1 == 6 * 7 // 2 == 21 and p2 == 6, "Số token phải chiếu: N(N+1)/2 so với N"

    # --- đối chiếu JS: cùng số token-ops ---
    for step in range(6):
        seq = step + 1
        no = js_calc("kv_cache_anatomy", state={"hasCache": False, "currentStep": step})
        yes = js_calc("kv_cache_anatomy", state={"hasCache": True, "currentStep": step})
        assert no["cumulativeTokensComputed"] == seq * (seq + 1) // 2
        assert yes["cumulativeTokensComputed"] == seq
        assert no["tokensComputedThisStep"] == seq and yes["tokensComputedThisStep"] == 1
    full_no = js_calc("kv_cache_anatomy", state={"hasCache": False, "currentStep": 5})
    full_yes = js_calc("kv_cache_anatomy", state={"hasCache": True, "currentStep": 5})
    assert full_no["cumulativeTokensComputed"] == p1 and full_yes["cumulativeTokensComputed"] == p2

    # --- dung lượng VRAM: 2 (K và V) * L * H * d * bytes * số token ---
    L, H, d, nbytes = 12, 8, 64, 2
    cache = np.zeros((2, L, H, 3, d), dtype=np.float16)  # 3 token đã sinh
    assert cache.nbytes == 2 * L * H * d * nbytes * 3 == 73728
    js = js_calc("kv_cache_anatomy", preset="cached_step_3")
    assert js["totalCacheBytes"] == cache.nbytes and js["seqLen"] == 3
    per_token = 2 * L * H * d * nbytes
    assert per_token == 24576 and js_calc("kv_cache_anatomy", preset="full_seq_6")["totalCacheBytes"] == 6 * per_token

    # Ngoại suy sang mô hình thật (Llama-7B: 32 tầng, 32 đầu, d = 128, FP16, ngữ cảnh 4096)
    assert 2 * 32 * 32 * 128 * 2 * 4096 == 2 * 1024 ** 3, "KV-Cache 1 chuỗi 4096 token = 2 GiB"


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
