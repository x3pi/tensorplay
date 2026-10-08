#!/usr/bin/env python3
"""
lessons/kv_cache_anatomy/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
def main() -> None:
    num_heads = 8
    seq_len = 512
    head_dim = 64
    bytes_per_fp16 = 2
    kv_layer_bytes = 2 * num_heads * seq_len * head_dim * bytes_per_fp16
    assert kv_layer_bytes == 1048576 # 1 MB

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
