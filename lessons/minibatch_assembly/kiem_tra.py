#!/usr/bin/env python3
"""
lessons/minibatch_assembly/kiem_tra.py
Hình dạng tensor, FLOPs của GEMM và dung lượng activation theo batch; tỉ lệ CPU/GPU của dataloader.
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



def counts(B, D, H, L):
    X = np.zeros((B, D), dtype=np.float32)
    W = np.zeros((D, H), dtype=np.float32)
    Z = X @ W
    flops_layer = 2 * B * D * H  # B*H phần tử, mỗi phần tử D nhân + D cộng
    act_bytes = Z.nbytes * L
    return X.size, W.size, Z.size, flops_layer * L, act_bytes


def main() -> None:
    # --- numpy: hình dạng và số liệu ---
    assert counts(2, 4, 4, 3) == (8, 16, 8, 192, 96)
    assert counts(1, 4, 4, 3)[4] == 48 and counts(4, 4, 4, 3)[4] == 192, "Activation tăng tuyến tính theo batch"

    # --- đối chiếu JS ---
    for B in (1, 2, 4, 16):
        nx, nw, nz, flops, act = counts(B, 4, 4, 3)
        js = js_calc("minibatch_assembly", state={"batchSize": B})
        assert (js["numElementsX"], js["numElementsW"], js["numElementsZ"]) == (nx, nw, nz)
        assert js["totalFlops"] == flops and js["totalActivationBytes"] == act, B

    # Cấu hình lớn thật sự gây OOM: 16*1024*4 byte * 4 tầng = 256 KB > 100 KB
    js = js_calc("minibatch_assembly", state={"batchSize": 16, "hiddenDim": 1024, "numLayers": 4, "gpuMaxVramKb": 100})
    assert js["totalActivationBytes"] == 16 * 1024 * 4 * 4 and js["isOOM"] is True

    # Preset "Lô Cực Đại" phải thật sự minh họa OOM như nhãn của nó
    big = js_calc("minibatch_assembly", preset="batch_large_oom")
    assert big["isOOM"] is True, "Preset B = 16 nói về nguy cơ OOM nên phải vượt ngưỡng VRAM"
    assert js_calc("minibatch_assembly", preset="batch_sweet_spot")["isOOM"] is False

    # --- Dataloader: CPU tiền xử lý song song vs GPU tiêu thụ ---
    t_cpu_per_sample, workers, t_gpu_batch = 2.0, 4, 10.0
    assert (16 * t_cpu_per_sample) / workers == 8.0 < t_gpu_batch, "B=16, 4 worker: CPU kịp GPU"
    assert (32 * t_cpu_per_sample) / workers == 16.0 > t_gpu_batch, "B=32: CPU chậm hơn GPU -> GPU đói dữ liệu"


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
