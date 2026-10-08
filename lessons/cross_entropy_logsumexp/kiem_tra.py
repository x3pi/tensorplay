#!/usr/bin/env python3
"""
lessons/cross_entropy_logsumexp/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    z = np.array([1000.0, 1000.0], dtype=np.float64)
    c = np.max(z)
    lse = c + np.log(np.sum(np.exp(z - c)))
    loss = lse - z[0]
    assert np.isclose(loss, np.log(2.0))

    z_under = np.array([-1000.0, 0.0], dtype=np.float64)
    c_u = np.max(z_under)
    lse_u = c_u + np.log(np.sum(np.exp(z_under - c_u)))
    loss_u = lse_u - z_under[0]
    assert np.isclose(loss_u, 1000.0)

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
