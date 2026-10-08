#!/usr/bin/env python3
"""
lessons/layernorm_residual/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_layernorm_residual():
    print("=== [Kiểm tra Bài 21: LayerNorm vs BatchNorm & Residual] ===")
    X = np.array([[1.0, 3.0], [2.0, 6.0]])

    # LayerNorm: chuẩn hóa theo hàng (axis=1)
    ln = (X - X.mean(axis=1, keepdims=True)) / X.std(axis=1, keepdims=True)
    assert np.allclose(ln, [[-1, 1], [-1, 1]]), f"LayerNorm sai: {ln}"

    # BatchNorm: chuẩn hóa theo cột (axis=0)
    bn = (X - X.mean(axis=0, keepdims=True)) / X.std(axis=0, keepdims=True)
    assert np.allclose(bn, [[-1, -1], [1, 1]]), f"BatchNorm sai: {bn}"

    # Batch = 1: BatchNorm sụp về 0 (phương sai 0), LayerNorm không phụ thuộc batch
    x1 = X[:1]
    assert np.all(x1.std(axis=0) == 0), "Batch=1 -> phương sai mỗi cột phải bằng 0"
    assert np.allclose((x1 - x1.mean(axis=0)), 0), "BatchNorm batch=1 -> tử số = 0"
    ln1 = (x1 - x1.mean(axis=1, keepdims=True)) / x1.std(axis=1, keepdims=True)
    assert np.allclose(ln1[0], ln[0]), "LayerNorm mẫu 1 phải không đổi khi batch đổi"

    # Mẫu 1 qua BatchNorm: batch=2 ra [-1,-1], batch=1 ra [0,0] -> phụ thuộc hàng xóm
    assert np.allclose(bn[0], [-1, -1])

    # Residual: gradient qua L=6 tầng với f' = 0.1
    L, fp = 6, 0.1
    assert np.isclose(fp ** L, 1e-6)
    assert np.isclose((1 + fp) ** L, 1.771561)

    # Kiểm tra bằng autograd số: y = x + 0.1*x lặp 6 lần -> dy/dx = 1.1^6
    def f(x):
        for _ in range(L):
            x = x + fp * x
        return x
    eps = 1e-6
    num = (f(1.0 + eps) - f(1.0 - eps)) / (2 * eps)
    assert np.isclose(num, 1.1 ** 6, rtol=1e-6)
    print("-> LayerNorm & Residual: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_layernorm_residual()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
