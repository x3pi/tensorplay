#!/usr/bin/env python3
"""
lessons/roofline_arithmetic_intensity/kiem_tra.py
Đếm FLOPs và byte trực tiếp từ kích thước mảng numpy rồi đối chiếu công thức trong logic.js.
"""
import numpy as np

P, BW = 200e12, 2e12
RIDGE = P / BW


def gemm_counts(b, n):
    """Đếm theo shape thật: X (b x n) @ W (n x n) -> Y (b x n), FP16 = 2 byte."""
    X = np.zeros((b, n), dtype=np.float16)
    W = np.zeros((n, n), dtype=np.float16)
    Y = np.zeros((b, n), dtype=np.float16)
    flops = 2 * b * n * n
    bytes_ = X.nbytes + W.nbytes + Y.nbytes
    return flops, bytes_


def main() -> None:
    assert RIDGE == 100

    # Elementwise c = a + b trên n phần tử: n FLOP, đọc 2 mảng + ghi 1 mảng
    n = 1_000_000
    a = np.zeros(n, dtype=np.float16)
    ai_elem = n / (3 * a.nbytes)
    assert np.isclose(ai_elem, 1 / 6)
    assert np.isclose(min(P, ai_elem * BW) / 1e12, 1 / 3)

    # GEMM với n = 4096: AI = b / (1 + 2b/n)
    for b, expect in [(1, 0.9995), (64, 62.06), (128, 120.47)]:
        fl, by = gemm_counts(b, 4096)
        assert np.isclose(fl / by, expect, atol=0.01), (b, fl / by)
    fl, by = gemm_counts(4096, 4096)
    assert np.isclose(fl / by, 4096 / 3), "GEMM vuông: AI = n/3"

    # Hiệu năng đạt được
    ai1 = gemm_counts(1, 4096)[0] / gemm_counts(1, 4096)[1]
    assert np.isclose(min(P, ai1 * BW) / 1e12, 1.999, atol=1e-3)
    ai128 = gemm_counts(128, 4096)[0] / gemm_counts(128, 4096)[1]
    assert ai128 > RIDGE and min(P, ai128 * BW) == P

    # Mô hình 7B: trọng số 14 GB FP16, 2 FLOP mỗi tham số mỗi token
    t_mem = 14e9 / BW
    assert np.isclose(t_mem * 1e3, 7.0)
    assert np.isclose(1 / t_mem, 142.857, atol=1e-2)
    assert np.isclose(64 / max(2 * 7e9 * 64 / P, t_mem), 9142.857, atol=1e-2)
    t128 = max(2 * 7e9 * 128 / P, t_mem)
    assert np.isclose(t128 * 1e3, 8.96)
    # Batch tại điểm gấp: flops/P = bytes/BW  ->  b = RIDGE
    assert np.isclose(2 * 7e9 * 100 / P, t_mem)


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
