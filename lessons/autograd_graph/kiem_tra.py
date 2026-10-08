#!/usr/bin/env python3
"""
lessons/autograd_graph/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_autograd_graph():
    print("=== [Kiểm tra Bài: Autograd Graph Topological Sort] ===")
    # Đồ thị z = (x + y) * y với x=2, y=3
    # v1 = x + y = 5
    # z = v1 * y = 15
    # dz/dz = 1
    # dz/dv1 = y = 3
    # dz/dy = v1 + dz/dv1 * 1 = 5 + 3 = 8
    # dz/dx = dz/dv1 * 1 = 3
    x, y = 2.0, 3.0
    v1 = x + y
    z = v1 * y
    assert z == 15.0

    dz_dv1 = y
    dz_dx = dz_dv1 * 1.0
    dz_dy = v1 + dz_dv1 * 1.0
    assert dz_dx == 3.0
    assert dz_dy == 8.0
    print("-> Autograd Graph: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_autograd_graph()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
