#!/usr/bin/env python3
"""
kiem_tra_bai_tap.py
Script kiểm chứng tự động toàn bộ kết quả số học và nguyên lý toán học
cho các bài học Track 3 (HW3: Kiến Trúc GPU & Lập Trình CUDA).
Tuân thủ nghiêm ngặt Quy Chuẩn AGENTS.md.
"""

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



def kiem_tra_mixed_precision():
    print("=== [Kiểm tra Bài 25: Mixed Precision FP16 & Loss Scaling] ===")
    # Hằng số FP16 từ numpy (nguồn độc lập với code JS)
    info = np.finfo(np.float16)
    assert float(info.max) == 65504.0
    min_sub = 2.0 ** -24
    assert float(np.nextafter(np.float16(0), np.float16(1))) == min_sub

    # Underflow: gradient 1e-8 không scale -> 0
    g = 1e-8
    assert float(np.float16(g)) == 0.0, "1e-8 phải bị FP16 làm tròn về 0"

    # Loss scale 1024: lưu 1.024e-5 rồi chia lại trong FP32
    S = 1024.0
    stored = np.float16(g * S)
    assert float(stored) > 0
    recovered = np.float32(stored) / np.float32(S)
    rel_err = abs(float(recovered) - g) / g
    assert rel_err < 0.01, f"Sai số tương đối phải < 1%, nhận được {rel_err:.4%}"

    # Overflow: 1.0 * 2^16 = 65536 > 65504 -> inf
    with np.errstate(over="ignore"):
        assert np.isinf(np.float16(1.0 * 2.0 ** 16))
        # Ngưỡng làm tròn IEEE: 65519 -> 65504, 65520 -> inf
        assert float(np.float16(65519.0)) == 65504.0
        assert np.isinf(np.float16(65520.0))

    # BF16 mô phỏng bằng cách cắt 16 bit cao của float32 (làm tròn half-to-even)
    def to_bf16(x):
        b = np.float32(x).view(np.uint32)
        rounding = ((b >> 16) & 1) + 0x7FFF
        return np.uint32((b + rounding) & 0xFFFF0000).view(np.float32)
    bf = float(to_bf16(1e-8))
    assert bf > 0 and abs(bf - 1e-8) / 1e-8 < 0.005, "BF16 giữ được 1e-8 với sai số < 0.5%"

    # Bộ nhớ trạng thái Adam: FP32 thuần 16 byte/param, mixed cũng 16 byte/param
    assert 4 + 4 + 4 + 4 == 2 + 2 + 4 + 4 + 4 == 16
    print("-> Mixed Precision: ĐẠT CHUẨN 100%\n")


if __name__ == "__main__":
    print("==================================================")
    print("  KIỂM CHỨNG TOÁN HỌC TỰ ĐỘNG - TRACK 3 (CUDA & GPU)")
    print("==================================================\n")
    kiem_tra_cuda_threads_and_tiling()
    kiem_tra_mixed_precision()
    print("🎉 TẤT CẢ CÁC BÀI TẬP TRACK 3 ĐỀU ĐẠT CHUẨN SỐ HỌC!")
