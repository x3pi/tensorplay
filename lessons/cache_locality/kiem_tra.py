#!/usr/bin/env python3
"""
lessons/cache_locality/kiem_tra.py
Mô phỏng cache L1 độc lập (dòng 4 phần tử, giữ 2 dòng gần nhất) cho quét hàng và quét cột.
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



LINE, CAP_LINES = 4, 2


def simulate(dim, order):
    """Trả về (hits, misses). Ô nhớ của (r, c) trong mảng C là r*dim + c."""
    a = np.arange(dim * dim).reshape(dim, dim)
    seq = a.reshape(-1) if order == "row" else a.T.reshape(-1)  # quét cột = đi qua a theo cột
    cache, hits, misses = [], 0, 0
    for idx in seq:
        if idx in cache:
            hits += 1
        else:
            misses += 1
            start = (idx // LINE) * LINE
            cache = (cache + list(range(start, start + LINE)))[-LINE * CAP_LINES:]
    return hits, misses


def main() -> None:
    # --- bố cục bộ nhớ từ strides thật ---
    a = np.arange(16, dtype=np.int64).reshape(4, 4)
    assert a.strides == (32, 8) and a[2, 3] == 2 * 4 + 3
    assert a.T.reshape(-1)[:4].tolist() == [0, 4, 8, 12], "Quét cột nhảy cóc bước 4 phần tử"

    # --- mô phỏng độc lập ---
    h_row, m_row = simulate(4, "row")
    h_col, m_col = simulate(4, "col")
    assert (h_row, m_row) == (12, 4)
    assert (h_col, m_col) == (0, 16), "Quét cột: mỗi truy cập rơi vào một dòng cache khác và dòng cũ bị đẩy ra trước khi dùng lại"
    assert h_row / 16 == 0.75

    # --- đối chiếu JS: bước qua 16 phần tử ---
    for preset, (h, m) in (("row_major_scan", (h_row, m_row)), ("col_major_scan", (h_col, m_col))):
        js = js_calc("cache_locality", preset=preset, calls=["stepScan"] * 16)
        assert (js["hits"], js["misses"]) == (h, m), (preset, js["hits"], js["misses"])
        assert js["estimatedCycles"] == h * 1 + m * 20
        assert abs(js["hitRate"] - h / 16) < 1e-12

    # Tổng quát: quét hàng luôn có tỉ lệ hit = 1 - 1/LINE khi dim chia hết cho LINE
    for dim in (4, 8, 12):
        h, m = simulate(dim, "row")
        assert m == dim * dim // LINE and h == dim * dim - m
        h2, m2 = simulate(dim, "col")
        assert m2 >= m, "Quét cột không bao giờ tốt hơn quét hàng"

    # Chi phí ước lượng 1 cycle/hit, 20 cycle/miss: hàng 92, cột 320 (chậm gấp 3.5 lần)
    assert 12 * 1 + 4 * 20 == 92 and 16 * 20 == 320
    assert js_calc("cache_locality", preset="col_major_scan", calls=["stepScan"] * 16)["estimatedCycles"] == 320


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
