#!/usr/bin/env python3
"""
Kiểm chứng toán học cho {{SLUG}}
Tuân thủ AGENTS.md: số nhỏ, tròn trị, tự động kiểm tra từ đầu đến cuối.
"""

import sys


def kiem_tra_{{SLUG}}():
    print("--- KIỂM CHỨNG: {{TITLE}} ---")
    x = 2
    y = x * 2
    expected = 4
    assert y == expected, f"Lỗi tính toán: nhận {y}, kỳ vọng {expected}"
    print(f"  ✓ Tính toán kiểm chứng đạt yêu cầu (x={x}, y={y})")
    return True


if __name__ == "__main__":
    try:
        ok = kiem_tra_{{SLUG}}()
        if ok:
            print("Toàn bộ bài test {{SLUG}} thành công! 🎉")
            sys.exit(0)
    except AssertionError as e:
        print(f"✗ Thất bại: {e}")
        sys.exit(1)
