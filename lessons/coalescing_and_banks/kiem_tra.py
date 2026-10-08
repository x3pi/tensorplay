#!/usr/bin/env python3
"""
lessons/coalescing_and_banks/kiem_tra.py
Số giao dịch bộ nhớ 128 byte của một warp và xung đột bank của shared memory theo bước nhảy (stride).
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



def transactions(stride, warp=32, word=4, line=128):
    addrs = np.arange(warp) * stride * word
    return len(set((addrs // line).tolist()))


def bank_conflict_way(stride, warp=32, banks=32):
    counts = np.bincount((np.arange(warp) * stride) % banks, minlength=banks)
    return int(counts.max())


def main() -> None:
    # --- numpy: đếm trực tiếp từ địa chỉ ---
    assert transactions(1) == 1, "Liền kề: 32 float = 128 byte = 1 giao dịch"
    assert [transactions(s) for s in (2, 4, 8, 16, 32)] == [2, 4, 8, 16, 32]
    assert [bank_conflict_way(s) for s in (1, 2, 4, 8, 16, 32)] == [1, 2, 4, 8, 16, 32]
    # Bước nhảy lẻ (nguyên tố cùng nhau với 32) không xung đột bank
    for s in (1, 3, 5, 7, 9, 31, 33):
        assert bank_conflict_way(s) == 1, s

    # --- đối chiếu JS cho mọi bước nhảy từ 1 đến 33 ---
    for s in range(1, 34):
        js = js_calc("coalescing_and_banks", state={"stride": s})
        assert js["numTransactions"] == min(32, transactions(s)), s
        assert js["maxBankConflictWay"] == bank_conflict_way(s), s
        useful = 32 * 4
        assert js["usefulBytes"] == useful and js["transferredBytes"] == js["numTransactions"] * 128
        assert abs(js["busEfficiencyPercent"] - 100 * useful / (js["numTransactions"] * 128)) <= 0.05 + 1e-9  # JS làm tròn 1 chữ số

    # --- Ba preset trong bài ---
    p = js_calc("coalescing_and_banks", preset="perfect_coalesced")
    assert p["busEfficiencyPercent"] == 100.0 and p["isFullyCoalesced"] is True
    assert js_calc("coalescing_and_banks", preset="strided_step_2")["busEfficiencyPercent"] == 50.0
    w = js_calc("coalescing_and_banks", preset="worst_col_stride")
    assert w["busEfficiencyPercent"] == 3.1 and w["maxBankConflictWay"] == 32

    # --- Cách chữa: đệm (padding) 1 phần tử cho bước nhảy 32 -> stride 33 hết xung đột ---
    assert bank_conflict_way(33) == 1 and js_calc("coalescing_and_banks", state={"stride": 33})["maxBankConflictWay"] == 1


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
