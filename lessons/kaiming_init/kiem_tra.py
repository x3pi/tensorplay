#!/usr/bin/env python3
"""
lessons/kaiming_init/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    n = 4
    var_kaiming = 2.0 / n
    gain_kaiming = n * var_kaiming * 0.5
    assert gain_kaiming == 1.0
    assert gain_kaiming ** 10 == 1.0

    var_xavier = 1.0 / n
    gain_xavier = n * var_xavier * 0.5
    assert gain_xavier == 0.5
    assert np.isclose(gain_xavier ** 10, 0.5 ** 10)

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
