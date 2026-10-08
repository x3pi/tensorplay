#!/usr/bin/env python3
"""
lessons/cpp_matmul_loops/kiem_tra.py
Ba vòng lặp for với chỉ số 1D (i*K+l, l*N+j, i*N+j) trùng matmul của numpy ở mọi bước và mọi kích thước.
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



def loops(A, B, M, K, N):
    """Trả (C cuối, danh sách các (idxA, idxB, idxC) theo từng bước)."""
    C = [0] * (M * N)
    trace = []
    for i in range(M):
        for j in range(N):
            for l in range(K):
                ia, ib, ic = i * K + l, l * N + j, i * N + j
                C[ic] += A[ia] * B[ib]
                trace.append((ia, ib, ic, list(C)))
    return C, trace


def main() -> None:
    M, K, N = 2, 3, 2
    A = [1, 2, 0, 0, 1, -1]
    B = [1, 0, 0, 1, 1, 1]
    C, trace = loops(A, B, M, K, N)
    ref = (np.array(A).reshape(M, K) @ np.array(B).reshape(K, N)).reshape(-1)
    assert C == ref.tolist() == [1, 2, -1, 0], C
    assert len(trace) == M * N * K == 12

    # --- đối chiếu JS từng bước một ---
    for step in range(12):
        js = js_calc("cpp_matmul_loops", update={"A": A, "B": B, "M": M, "K": K, "N": N, "currentStep": step})
        ia, ib, ic, c_so_far = trace[step]
        assert (js["idxA"], js["idxB"], js["idxC"]) == (ia, ib, ic), step
        assert js["C"] == c_so_far, step
        assert js["totalSteps"] == 12

    # --- mọi kích thước ngẫu nhiên: vòng lặp 1D == matmul ---
    rng = np.random.default_rng(5)
    for (m, k, n) in ((1, 1, 1), (2, 3, 4), (5, 2, 3), (4, 4, 4)):
        a = rng.integers(-3, 4, size=m * k)
        b = rng.integers(-3, 4, size=k * n)
        c, tr = loops(a.tolist(), b.tolist(), m, k, n)
        assert c == (a.reshape(m, k) @ b.reshape(k, n)).reshape(-1).tolist()
        assert len(tr) == m * n * k
        # Mảng C mặc định của numpy là C-contiguous (hàng trước): r*N + c
        assert np.arange(m * n).reshape(m, n)[m - 1, n - 1] == (m - 1) * n + (n - 1)


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
