#!/usr/bin/env python3
"""
lessons/cpp_matmul_loops/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_bai_06a():
    print("=== [Kiểm tra Bài 06a: C++ Matmul Loops & 1D Indexing] ===")
    M, K, N = 2, 3, 2
    A = np.array([[1, 2, 3], [4, 5, 6]], dtype=np.float32)
    B_mat = np.array([[7, 8], [9, 1], [2, 3]], dtype=np.float32)

    # Trải phẳng 1D
    A_1D = A.flatten()
    B_1D = B_mat.flatten()
    C_1D = np.zeros(M * N, dtype=np.float32)

    # 3 vòng lặp C++ lồng nhau
    total_steps = 0
    for i in range(M):
        for j in range(N):
            for l in range(K):
                C_1D[i * N + j] += A_1D[i * K + l] * B_1D[l * N + j]
                total_steps += 1

    expected_C = np.dot(A, B_mat).flatten()
    assert np.allclose(C_1D, expected_C), "Phép nhân 1D C++ phải cho kết quả chính xác 100%"
    assert total_steps == M * N * K, f"Số bước lặp phải là {M*N*K}, nhận được {total_steps}"
    print(f"-> Tổng bước lặp: {total_steps} khớp chuẩn $M \\times N \\times K$")
    print("-> Bài 06a: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_bai_06a()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
