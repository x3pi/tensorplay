#!/usr/bin/env python3
"""
lessons/cpp_matmul_loops/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    M, K, N = 2, 3, 2
    A = np.array([[1, 2, 3], [4, 5, 6]], dtype=np.float32)
    B = np.array([[7, 8], [9, 1], [2, 3]], dtype=np.float32)
    A_1D = A.flatten()
    B_1D = B.flatten()
    C_1D = np.zeros(M * N, dtype=np.float32)

    steps = 0
    for i in range(M):
        for j in range(N):
            for l in range(K):
                C_1D[i * N + j] += A_1D[i * K + l] * B_1D[l * N + j]
                steps += 1

    expected = np.dot(A, B).flatten()
    assert np.allclose(C_1D, expected)
    assert steps == M * N * K

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
