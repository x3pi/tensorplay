#!/usr/bin/env python3
"""
lessons/cuda_threads/kiem_tra.py
Chỉ số toàn cục idx = blockIdx*blockDim + threadIdx, số block = ceil(N/blockDim) và Boundary Guard; mô phỏng một kernel vector-add.
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



def launch(N, block, guard):
    grid = -(-N // block)  # ceil
    out = np.zeros(N)
    oob = 0
    idxs = []
    for b in range(grid):
        for t in range(block):
            idx = b * block + t
            idxs.append(idx)
            if guard and idx >= N:
                continue
            try:
                out[idx] = idx * 2.0  # kernel: out[i] = 2 * i
            except IndexError:  # ghi ngoài biên: trên GPU là hỏng bộ nhớ âm thầm hoặc crash
                oob += 1
    return grid, idxs, out, oob


def main() -> None:
    # --- numpy: kernel phải phủ đúng N phần tử, mỗi phần tử đúng 1 lần ---
    grid, idxs, out, oob = launch(10, 4, True)
    assert grid == 3 and len(idxs) == 12 and oob == 0
    assert idxs == list(range(12)), "idx liên tục, duy nhất: blockIdx * blockDim + threadIdx"
    assert np.allclose(out, np.arange(10) * 2.0), "Có guard: đúng 10 phần tử được ghi"
    grid, idxs, out, oob = launch(10, 4, False)
    assert oob == 2, "Không guard: idx 10 và 11 ghi ngoài biên"

    # --- đối chiếu JS cho mọi (N, blockDim) ---
    for N in (1, 4, 10, 12, 31, 32, 33, 100):
        for block in (1, 2, 4, 8, 32):
            for guard in (True, False):
                g, ids, _, ob = launch(N, block, guard)
                js = js_calc("cuda_threads", state={"N": N, "blockDim": block, "hasBoundaryGuard": guard})
                assert js["gridDim"] == g and js["totalThreadsLaunched"] == g * block
                assert [t["globalIdx"] for t in js["threads"]] == ids
                assert js["oobCount"] == ob and js["hasCrash"] is (ob > 0), (N, block, guard)
                # số luồng dư = lãng phí < blockDim
                assert 0 <= g * block - N < block
    # Vừa vặn: không dư luồng nên không cần guard
    assert js_calc("cuda_threads", preset="perfect_fit")["oobCount"] == 0
    assert js_calc("cuda_threads", preset="oob_crash_hazard")["oobCount"] == 2
    assert js_calc("cuda_threads", preset="guarded_excess")["oobCount"] == 0


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
