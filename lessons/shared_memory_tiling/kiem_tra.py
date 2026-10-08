#!/usr/bin/env python3
"""
lessons/shared_memory_tiling/kiem_tra.py
Tiled matmul: kết quả bằng matmul thường, đếm số lần đọc DRAM của bản ngây thơ so với bản tiling, và nội dung tile từng pha.
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



A = np.array([[1, 2, 0, 1], [0, 1, 2, 1], [1, 0, 1, 2], [2, 1, 0, 1]], dtype=float)
B = np.array([[1, 0, 1, 2], [0, 1, 2, 0], [2, 1, 0, 1], [1, 2, 1, 0]], dtype=float)


def naive_dram_reads(N):
    # Mỗi trong N^2 luồng đọc một hàng của A và một cột của B: 2N phần tử từ DRAM
    return N * N * 2 * N


def tiled(Am, Bm, T):
    N = Am.shape[0]
    C = np.zeros((N, N))
    dram = sram = 0
    for bi in range(0, N, T):
        for bj in range(0, N, T):
            acc = np.zeros((T, T))
            for k in range(0, N, T):
                tA, tB = Am[bi:bi + T, k:k + T], Bm[k:k + T, bj:bj + T]
                dram += tA.size + tB.size   # nạp 2 tile từ DRAM vào shared memory
                acc += tA @ tB              # tính trong SRAM
                sram += 2 * T * T * T
            C[bi:bi + T, bj:bj + T] = acc
    return C, dram, sram


def main() -> None:
    for T in (1, 2, 4):
        C, dram, _ = tiled(A, B, T)
        assert np.allclose(C, A @ B), "Tiling không đổi kết quả"
        assert dram == 2 * 4 ** 3 // T, (T, dram)
    assert naive_dram_reads(4) == 128

    # --- đối chiếu JS với công thức đếm từ mô phỏng thật ---
    for N, T in ((4, 2), (16, 4), (1024, 32)):
        js = js_calc("shared_memory_tiling", state={"matrixDim": N, "tileSize": T})
        assert js["naiveDramReads"] == naive_dram_reads(N)
        assert js["tiledDramReads"] == 2 * N ** 3 // T
        assert js["bandwidthReductionFactor"] == T and js["numPhases"] == N // T
    # đếm trực tiếp trên mô phỏng 16x16
    rng = np.random.default_rng(2)
    A16, B16 = rng.normal(size=(16, 16)), rng.normal(size=(16, 16))
    C16, dram16, sram16 = tiled(A16, B16, 4)
    assert np.allclose(C16, A16 @ B16) and dram16 == js_calc("shared_memory_tiling", preset="tile_16x16_t4")["tiledDramReads"]
    assert sram16 == 2 * 16 ** 3 == js_calc("shared_memory_tiling", preset="tile_16x16_t4")["tiledSramReads"]

    # --- nội dung tile ở từng pha khớp lát cắt numpy (khối đầu ra (0, 0)) ---
    for phase in (0, 1):
        js = js_calc("shared_memory_tiling", update={"matrixDim": 4, "tileSize": 2, "currentPhase": phase})
        assert np.array_equal(js["tileA"], A[0:2, phase * 2:phase * 2 + 2])
        assert np.array_equal(js["tileB"], B[phase * 2:phase * 2 + 2, 0:2])


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
