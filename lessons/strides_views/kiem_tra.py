#!/usr/bin/env python3
"""
lessons/strides_views/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
import numpy as np

def main() -> None:
    raw = np.array([10, 20, 30, 40, 50, 60], dtype=np.float32)
    v_base = np.lib.stride_tricks.as_strided(raw, shape=(2, 3), strides=(12, 4))
    assert v_base.flags['C_CONTIGUOUS']
    assert v_base[1, 2] == 60

    v_trans = np.lib.stride_tricks.as_strided(raw, shape=(3, 2), strides=(4, 12))
    assert not v_trans.flags['C_CONTIGUOUS']
    assert v_trans[2, 1] == 60

    v_bcast = np.lib.stride_tricks.as_strided(raw, shape=(3, 3), strides=(0, 4))
    assert v_bcast.shape == (3, 3)

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
