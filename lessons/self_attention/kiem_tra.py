#!/usr/bin/env python3
"""
lessons/self_attention/kiem_tra.py
Scaled dot-product attention: softmax theo hàng, mặt nạ nhân quả, và lý do chia căn d_k (phương sai tích vô hướng).
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



RAW = np.array([[4.0, 2.0, 1.0], [3.0, 6.0, 2.0], [2.0, 4.0, 5.0]])


def attention_weights(scores, d_k, scaled, causal):
    s = scores / (np.sqrt(d_k) if scaled else 1.0)
    if causal:
        s = np.where(np.triu(np.ones_like(s), k=1) == 1, -np.inf, s)
    s = s - s.max(axis=1, keepdims=True)
    e = np.exp(s)
    return e / e.sum(axis=1, keepdims=True)


def main() -> None:
    # --- numpy độc lập ---
    gpt = attention_weights(RAW, 4, True, True)
    bert = attention_weights(RAW, 4, True, False)
    assert np.allclose(gpt.sum(axis=1), 1.0) and np.allclose(bert.sum(axis=1), 1.0)
    assert np.all(gpt[np.triu_indices(3, k=1)] == 0), "Mặt nạ nhân quả: tam giác trên bằng đúng 0"
    assert gpt[0, 0] == 1.0, "Token đầu tiên chỉ nhìn được chính nó"
    assert np.all(bert[np.triu_indices(3, k=1)] > 0), "Không mask: nhìn được cả tương lai"

    # --- đối chiếu JS cho 3 preset ---
    for preset, (scaled, causal) in (("gpt_causal_standard", (True, True)), ("bert_bidirectional", (True, False)), ("unscaled_hazard", (False, True))):
        js = js_calc("self_attention", preset=preset)
        ref = attention_weights(RAW, 4, scaled, causal)
        assert np.allclose(js["attentionMatrix"], ref, atol=1e-3), preset
        assert js["isStrictlyCausal"] is causal

    # --- Vì sao chia căn d_k: phương sai của q·k bằng d_k khi q, k ~ N(0, 1) ---
    rng = np.random.default_rng(0)
    for d in (4, 64, 256):
        q, k = rng.normal(size=(200_000, d)), rng.normal(size=(200_000, d))
        dots = (q * k).sum(axis=1)
        assert abs(dots.var() / d - 1.0) < 0.03, d
        assert abs((dots / np.sqrt(d)).var() - 1.0) < 0.03, "Chia căn d_k đưa phương sai về 1"

    # Không chia: điểm lớn làm softmax gần one-hot (bão hòa, gradient ~ 0)
    big = np.array([[40.0, 20.0, 10.0]])
    p = attention_weights(big, 4, False, False)[0]
    assert p.max() > 0.999999 and (p * (1 - p)).max() < 1e-8, "Softmax bão hòa: đạo hàm p(1-p) gần 0"
    p2 = attention_weights(big, 256, True, False)[0]
    assert p2.max() < 0.8, "Có chia căn d_k thì còn phân phối mềm"
    assert abs(js_calc("self_attention", state={"d_k": 16})["scaleFactor"] - 4.0) < 1e-9


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
