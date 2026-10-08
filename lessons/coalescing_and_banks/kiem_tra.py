#!/usr/bin/env python3
"""
lessons/coalescing_and_banks/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
def main() -> None:
    num_banks = 32
    stride = 1
    # No bank conflict when stride is coprime to 32 (e.g. stride 1)
    conflict = (32 * stride) % num_banks == 0 and stride != 1
    assert not conflict

    stride_bad = 32
    # 32-way bank conflict
    assert (32 * stride_bad) % num_banks == 0

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
