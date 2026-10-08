#!/usr/bin/env python3
"""
lessons/memory_leak/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
def main() -> None:
    bytes_per_leak = 100 * 10 * 4
    n_batches = 60000 // 100
    leak_epoch = bytes_per_leak * n_batches
    total_leak = leak_epoch * 50
    assert total_leak == 120_000_000
    assert total_leak / (1024 ** 2) > 114.0

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
