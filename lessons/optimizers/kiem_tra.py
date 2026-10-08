#!/usr/bin/env python3
"""
lessons/optimizers/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    p0 = np.array([-4.0, 1.0])
    loss0 = 0.5 * (0.2 * (-4.0)**2 + 4 * (1.0)**2)
    assert loss0 == 3.6
    g0 = np.array([0.2 * (-4.0), 4.0 * 1.0])
    p1 = p0 - 0.1 * g0
    assert np.allclose(p1, [-3.92, 0.6])

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
