#!/usr/bin/env python3
"""
lessons/data_parallel_allreduce/kiem_tra.py
Đối chiếu gradient shard với gradient cả batch (numpy) và mô phỏng ring all-reduce độc lập.
"""
import numpy as np

X = np.array([1.0, 2.0, 3.0, 4.0])
Y = np.array([2.0, 4.0, 3.0, 8.0])


def per_sample_grad(w):
    return (w * X - Y) * X


def ring_allreduce(vectors):
    n = len(vectors)
    data = [v.copy() for v in vectors]
    for s in range(n - 1):  # reduce-scatter
        sends = [((i - s) % n, data[i][(i - s) % n]) for i in range(n)]
        for i, (c, val) in enumerate(sends):
            data[(i + 1) % n][c] += val
    for s in range(n - 1):  # all-gather
        sends = [((i + 1 - s) % n, data[i][(i + 1 - s) % n]) for i in range(n)]
        for i, (c, val) in enumerate(sends):
            data[(i + 1) % n][c] = val
    return data


def main() -> None:
    # Đạo hàm giải tích khớp sai phân hữu hạn của loss trung bình
    def loss(w):
        return np.mean(0.5 * (w * X - Y) ** 2)
    eps = 1e-6
    num = (loss(1.0 + eps) - loss(1.0 - eps)) / (2 * eps)
    g = per_sample_grad(1.0)
    assert np.allclose(g, [-1, -4, 0, -16])
    assert np.isclose(g.mean(), num, atol=1e-6) and np.isclose(g.mean(), -5.25)

    # Shard đều: trung bình các shard = gradient cả batch
    s0, s1 = g[:2].mean(), g[2:].mean()
    assert np.isclose(s0, -2.5) and np.isclose(s1, -8.0)
    assert np.isclose((s0 + s1) / 2, g.mean())
    # Quên chia: gấp N lần => bước học gấp N lần
    assert np.isclose(s0 + s1, -10.5) and np.isclose(1.0 - 0.1 * (s0 + s1), 2.05)
    assert np.isclose(1.0 - 0.1 * g.mean(), 1.525)

    # Shard không đều 3 + 1
    a, b = g[:3].mean(), g[3:].mean()
    assert np.isclose((a + b) / 2, -8.8333, atol=1e-3) and not np.isclose((a + b) / 2, g.mean())
    assert np.isclose((3 * a + 1 * b) / 4, g.mean())

    # Ring all-reduce bằng tổng trực tiếp
    for n in (2, 4, 8):
        vecs = [np.array([(c + 1) * (i + 1) for c in range(n)], dtype=float) for i in range(n)]
        total = np.sum(vecs, axis=0)
        out = ring_allreduce(vecs)
        assert all(np.allclose(row, total) for row in out), n

    # Lưu lượng: ring 2(N-1)/N * S so với (N-1) * S
    S = 14.0
    assert np.isclose(2 * 3 / 4 * S, 21.0) and 3 * S == 42.0
    assert np.isclose(2 * 7 / 8 * S, 24.5) and 7 * S == 98.0
    assert 2 * 1023 / 1024 * S < 2 * S


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
