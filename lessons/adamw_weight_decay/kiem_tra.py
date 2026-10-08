#!/usr/bin/env python3
"""
lessons/adamw_weight_decay/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_adamw_weight_decay():
    print("=== [Kiểm tra Bài: Weight Decay — L2 vs AdamW] ===")
    w0 = 1.0
    g_data = 0.0
    lr = 0.1
    lamb = 0.1
    beta1 = 0.9
    beta2 = 0.999
    eps = 1e-8

    # 1. Bước 1: SGD + L2 và AdamW đều ra 0.99
    w_sgd = w0 - lr * (g_data + lamb * w0)
    assert np.isclose(w_sgd, 0.99), f"SGD+L2 bước 1 phải ra 0.99, nhận {w_sgd}"

    # AdamW bước 1 với g_data = 0: Adam step = 0, decay step = lr * lamb * w0 = 0.01 -> w = 0.99
    w_adamw = w0 - lr * lamb * w0
    assert np.isclose(w_adamw, 0.99), f"AdamW bước 1 phải ra 0.99, nhận {w_adamw}"

    # Adam + L2 bước 1: g' = lamb * w0 = 0.1
    g_l2 = lamb * w0
    m1 = (1 - beta1) * g_l2
    v1 = (1 - beta2) * (g_l2 ** 2)
    m1_hat = m1 / (1 - beta1)
    v1_hat = v1 / (1 - beta2)
    step_adam_l2 = lr * m1_hat / (np.sqrt(v1_hat) + eps)
    w_adam_l2 = w0 - step_adam_l2
    assert np.isclose(w_adam_l2, 0.90), f"Adam+L2 bước 1 phải nổ lực kéo ra 0.90, nhận {w_adam_l2}"

    # 2. Kiểm chứng lambda bị triệt tiêu trong Adam + L2
    lamb_small = 0.01
    g_l2_small = lamb_small * w0
    m_s = (1 - beta1) * g_l2_small
    v_s = (1 - beta2) * (g_l2_small ** 2)
    step_small = lr * (m_s / (1 - beta1)) / (np.sqrt(v_s / (1 - beta2)) + eps)
    w_adam_l2_small = w0 - step_small
    assert np.isclose(w_adam_l2_small, 0.90), f"Adam+L2 khi lambda=0.01 vẫn ra 0.90 do triệt tiêu lambda, nhận {w_adam_l2_small}"
    w_adamw_small = w0 - lr * lamb_small * w0
    assert np.isclose(w_adamw_small, 0.999), f"AdamW khi lambda=0.01 phải ra 0.999, nhận {w_adamw_small}"

    # 3. Quỹ đạo 5 bước
    w = 1.0
    for _ in range(5):
        w = w - lr * lamb * w
    assert np.isclose(w, 0.95099, atol=1e-4), f"AdamW sau 5 bước phải xấp xỉ 0.9510, nhận {w}"
    print("-> Weight Decay L2 vs AdamW: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_adamw_weight_decay()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
