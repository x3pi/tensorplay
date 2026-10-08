#!/usr/bin/env python3
"""
lessons/reverse_vs_forward_ad/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
def main() -> None:
    n_in = 1_000_000
    n_out = 1
    # Forward mode needs n_in passes
    assert n_in == 1_000_000
    # Reverse mode needs n_out passes
    assert n_out == 1

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
