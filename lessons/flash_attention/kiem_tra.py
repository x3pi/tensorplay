#!/usr/bin/env python3
"""
lessons/flash_attention/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    # Online Softmax update formula:
    # m_new = max(m_old, x)
    # d_new = d_old * exp(m_old - m_new) + exp(x - m_new)
    x1 = 2.0
    x2 = 4.0
    m1 = x1
    d1 = np.exp(0.0) # 1.0

    m2 = max(m1, x2) # 4.0
    d2 = d1 * np.exp(m1 - m2) + np.exp(x2 - m2) # exp(-2) + 1.0

    standard_d = np.exp(x1) + np.exp(x2)
    assert np.isclose(d2 * np.exp(m2), standard_d)

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
