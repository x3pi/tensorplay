#!/usr/bin/env python3
"""
lessons/softmax_stability/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_bai_02():
    print("=== [Kiểm tra Bài 02: Softmax & Cross-Entropy Loss] ===")
    # 1. Softmax chuẩn
    z = np.array([2.0, 0.0])
    exp_z = np.exp(z)
    P = exp_z / np.sum(exp_z)
    assert math.isclose(np.sum(P), 1.0, rel_tol=1e-5), "Tổng xác suất phải bằng 1.0"
    assert P[0] > P[1], "Điểm số cao hơn phải có xác suất cao hơn"

    # 2. Cơn ác mộng tràn số FP32
    assert math.exp(88) < 3.4e38, "exp(88) nằm trong giới hạn FP32"
    try:
        # Trong float thông thường, exp(1000) sẽ tràn số
        overflow_val = math.exp(1000)
    except OverflowError:
        pass  # Đạt chuẩn: exp(1000) gây lỗi tràn số

    # 3. Kỹ thuật Safe Softmax (trừ max)
    z_large = np.array([1000.0, 1000.0])
    M = np.max(z_large)
    safe_exp = np.exp(z_large - M)
    P_safe = safe_exp / np.sum(safe_exp)
    assert np.allclose(P_safe, [0.5, 0.5]), f"Safe Softmax [1000, 1000] phải là [0.5, 0.5], nhận được {P_safe}"

    # 4. Tính bất biến đối với phép tịnh tiến
    z_orig = np.array([2.0, 1.0])
    z_shift = z_orig + 500.0
    P_orig = np.exp(z_orig - np.max(z_orig)) / np.sum(np.exp(z_orig - np.max(z_orig)))
    P_shift = np.exp(z_shift - np.max(z_shift)) / np.sum(np.exp(z_shift - np.max(z_shift)))
    assert np.allclose(P_orig, P_shift), "Xác suất Safe Softmax bất biến tuyệt đối với phép cộng hằng số"

    # 5. Cross-Entropy Loss
    loss_confident = -math.log(0.99)
    loss_wrong = -math.log(0.01)
    assert loss_confident < 0.02, "Đoán đúng tự tin thì Loss tiến sát 0"
    assert loss_wrong > 4.6, "Đoán sai tự tin thì Loss phạt rất nặng (>4.6)"
    print("-> Bài 02: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_bai_02()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
