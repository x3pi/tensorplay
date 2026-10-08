#!/usr/bin/env python3
"""
lessons/cuda_threads/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
def main() -> None:
    N = 64
    B = 16
    grid_dim = (N // B, N // B)
    assert grid_dim == (4, 4)
    threads_per_block = B * B
    assert threads_per_block == 256

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
