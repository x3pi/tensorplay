#!/usr/bin/env python3
"""
lessons/autograd_graph/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
def main() -> None:
    x, y = 2.0, 3.0
    v1 = x + y
    z = v1 * y
    assert z == 15.0
    dz_dv1 = y
    dz_dx = dz_dv1 * 1.0
    dz_dy = v1 + dz_dv1 * 1.0
    assert dz_dx == 3.0
    assert dz_dy == 8.0

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
