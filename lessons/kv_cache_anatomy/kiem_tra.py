#!/usr/bin/env python3
"""
lessons/kv_cache_anatomy/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_kv_cache():
    print("=== [Kiểm tra Bài: KV Cache Memory Anatomy] ===")
    # Token thứ t=10 sinh ra: chỉ cần tính Q_new (1 token) nhân K_past (10 tokens)
    # Tiết kiệm O(t) phép nhân ma trận thừa thãi
    num_heads = 8
    seq_len = 512
    head_dim = 64
    bytes_per_fp16 = 2
    # Dung lượng 1 layer KV Cache: 2 (K và V) * num_heads * seq_len * head_dim * 2 bytes
    kv_layer_bytes = 2 * num_heads * seq_len * head_dim * bytes_per_fp16
    assert kv_layer_bytes == 1048576, f"1 layer KV Cache phải là 1MB (1048576 bytes), nhận được {kv_layer_bytes}"
    print("-> KV Cache: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_kv_cache()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
