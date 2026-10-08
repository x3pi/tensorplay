#!/usr/bin/env python3
"""
lessons/lr_schedule_warmup/kiem_tra.py
Mô phỏng độc lập bằng numpy, đối chiếu với logic.js.
"""
import numpy as np

T, W, NOISE = 12, 4, 0.2


def simulate(lr_max, warmup, decay):
    w, ws, lrs = 1.0, [1.0], []
    start = W if warmup else 0
    for t in range(T):
        a = 4.0 if t < 3 else 1.0
        if warmup and t < W:
            lr = lr_max * (t + 1) / W
        elif decay:
            lr = lr_max * 0.5 * (1 + np.cos(np.pi * (t - start) / (T - start)))
        else:
            lr = lr_max
        n = NOISE if t % 2 == 0 else -NOISE
        w = w - lr * (a * w + n)
        ws.append(w)
        lrs.append(lr)
    return np.array(ws), np.array(lrs)


def main() -> None:
    # Điều kiện ổn định của GD trên hàm bậc hai: |1 - lr*a| < 1  <=>  lr < 2/a
    assert 0.6 > 2 / 4 and 0.4 < 2 / 4

    ws, _ = simulate(0.6, False, False)
    assert np.allclose(ws[:4], [1.0, -1.52, 2.248, -3.2672], atol=1e-3), ws[:4]
    assert np.isclose(np.abs(ws).max(), 3.267, atol=1e-3), "Không warmup: bùng nổ ở vùng dốc"

    ws, lrs = simulate(0.6, True, False)
    assert np.allclose(lrs[:5], [0.15, 0.3, 0.45, 0.6, 0.6])
    assert np.isclose(np.abs(ws).max(), 1.0), "Warmup: |w| không vượt giá trị khởi tạo"
    assert np.isclose(abs(ws[-1]), 0.086, atol=1e-3), "Cuối vẫn dao động theo nhiễu"

    ws, lrs = simulate(0.6, True, True)
    assert abs(ws[-1]) < 0.01 and np.abs(ws).max() <= 1.0 + 1e-12, "Warmup + cosine: êm đầu, sạch cuối"
    assert lrs[-1] < 0.03

    ws, _ = simulate(0.4, False, False)
    assert np.abs(ws[:4]).max() <= 1.0 + 1e-12, "lr 0.4 < 0.5 nên ổn định không cần warmup"


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
