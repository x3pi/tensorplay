#!/usr/bin/env python3
"""
lessons/robot_vision/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    W = np.array([
        [1.0, 1.0],
        [1.0, -1.0],
        [-1.0, 1.0],
        [-1.0, -1.0]
    ], dtype=np.float32)

    x_clean = np.array([1.0, 1.0, 0.0, 0.0], dtype=np.float32)
    z_clean = np.dot(x_clean, W)
    assert z_clean[0] == 2.0 and z_clean[1] == 0.0
    assert z_clean[0] > z_clean[1]

    x_dust = np.array([1.0, 1.0, 0.5, 0.0], dtype=np.float32)
    z_dust = np.dot(x_dust, W)
    assert z_dust[0] == 1.5 and z_dust[1] == 0.5
    assert z_dust[0] > z_dust[1]

    x_glare = np.array([1.0, 1.0, 1.0, 1.0], dtype=np.float32)
    z_glare = np.dot(x_glare, W)
    assert z_glare[0] == 0.0 and z_glare[1] == 0.0

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
