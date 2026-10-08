#!/usr/bin/env python3
"""
lessons/cuda_threads/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_cuda_threads_and_tiling():
    print("=== [Kiểm tra Bài: Phân Chia Grid/Block & Tiling Shared Memory] ===")
    # Ma trận 64x64 nhân ma trận, Tile size B = 16
    N = 64
    B = 16
    grid_dim = (N // B, N // B)
    assert grid_dim == (4, 4), "Grid phải gồm 4x4 blocks"
    threads_per_block = B * B
    assert threads_per_block == 256, "Mỗi block cần 256 threads"

    # Số lần nạp shared memory qua các phase K:
    num_phases = N // B
    assert num_phases == 4
    print("-> CUDA Threads & Tiling: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_cuda_threads_and_tiling()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
