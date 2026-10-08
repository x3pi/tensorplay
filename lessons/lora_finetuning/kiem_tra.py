#!/usr/bin/env python3
"""
lessons/lora_finetuning/kiem_tra.py
Dựng LoRA bằng numpy: hạng của ΔW, tương đương giữa đường song song và hợp nhất, đếm tham số từ shape.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402


def main() -> None:
    W = np.eye(4)
    B = np.array([[1.0], [0.0], [2.0], [0.0]])   # 4 x 1
    A = np.array([[0.0, 1.0, 0.0, 1.0]])        # 1 x 4
    dW = B @ A
    assert np.allclose(dW, [[0, 1, 0, 1], [0, 0, 0, 0], [0, 2, 0, 2], [0, 0, 0, 0]])
    assert np.linalg.matrix_rank(dW) == 1 and np.linalg.matrix_rank(W + dW) == 4

    x = np.array([1.0, 2.0, 3.0, 4.0])
    y_parallel = W @ x + B @ (A @ x)     # không cần hợp nhất
    y_merged = (W + dW) @ x              # hợp nhất sau huấn luyện: không tốn thêm khi suy diễn
    assert np.allclose(y_parallel, y_merged) and np.allclose(y_merged, [7, 2, 15, 4])
    assert np.allclose(W @ x, [1, 2, 3, 4]) and np.allclose((W + np.zeros((4, 1)) @ A) @ x, W @ x), "B = 0 -> mô hình không đổi"

    # Hạng của ΔW không vượt quá r với ma trận ngẫu nhiên
    rng = np.random.default_rng(0)
    for r in (1, 2, 4, 8):
        Bm, Am = rng.normal(size=(64, r)), rng.normal(size=(r, 64))
        assert np.linalg.matrix_rank(Bm @ Am) == r

    # Đếm tham số từ shape thật
    d = 4096
    for r, per in ((1, 8192), (8, 65536), (16, 131072)):
        assert np.zeros((d, r)).size + np.zeros((r, d)).size == per == 2 * d * r
    total = 12 * 32 * d * d + 32000 * d
    assert total == 6_573_522_944
    trainable = 64 * 2 * d * 8
    assert trainable == 4_194_304 and np.isclose(trainable / total * 100, 0.0638, atol=1e-4)
    assert np.isclose(trainable * 16 / 1e6, 67.108864)
    base_gb, full_gb = total * 2 / 1e9, total * 16 / 1e9
    assert np.isclose(base_gb + trainable * 16 / 1e9, 13.2142, atol=1e-3) and np.isclose(full_gb, 105.176, atol=1e-3)

    # Đối chiếu JS
    js = js_calc("lora_finetuning", preset="trained_r8")
    assert js["trainable"] == trainable and abs(js["totalGB"] - (base_gb + trainable * 16 / 1e9)) < 1e-3
    assert js["toy"]["yLora"] == [7, 2, 15, 4] and js["mergeIdentical"] is True
    assert js_calc("lora_finetuning", preset="init_zero")["toy"]["yMerged"] == [1, 2, 3, 4]
    assert js_calc("lora_finetuning", preset="rank64")["trainable"] == 64 * 2 * d * 64


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
