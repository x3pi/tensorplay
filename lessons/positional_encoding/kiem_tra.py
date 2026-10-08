#!/usr/bin/env python3
"""
lessons/positional_encoding/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def _softmax(s):
    e = np.exp(s - np.max(s))
    return e / e.sum()


def kiem_tra_positional_encoding():
    print("=== [Kiểm tra Bài 31: Positional Encoding & Hoán Vị Bất Biến] ===")
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


def main() -> None:
    kiem_tra_positional_encoding()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
