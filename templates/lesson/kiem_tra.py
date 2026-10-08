#!/usr/bin/env python3
"""
lessons/{{SLUG}}/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy (AGENTS.md mục 5). Mọi assertion trong logic.test.js
phải có đối chứng ở đây. tools/run_checks.py chạy file này và yêu cầu mã thoát 0.
"""
import numpy as np


def main() -> None:
    x = 2.0
    y = 2 * x  # TODO: thay bằng đối chứng độc lập của bài
    assert np.isclose(y, 4.0), f"y phải bằng 4, nhận {y}"
    assert 2 * 0.0 == 0.0


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
