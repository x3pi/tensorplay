#!/usr/bin/env python3
"""
lessons/sampling_decoding/kiem_tra.py
Cài đặt độc lập (numpy) của temperature, top-k, top-p, bốc theo CDF.
"""
import numpy as np

Z = np.array([3.0, 2.0, 1.0, 0.0, -1.0])


def softmax(z, T=1.0):
    e = np.exp(z / T - np.max(z / T))
    return e / e.sum()


def top_filter(p, k=0, top_p=1.0):
    order = np.argsort(-p)
    keep = np.zeros(len(p), dtype=bool)
    cum = 0.0
    for r, i in enumerate(order):
        if k > 0 and r >= k:
            break
        keep[i] = True
        cum += p[i]
        if top_p < 1 and cum >= top_p:
            break
    q = np.where(keep, p, 0.0)
    return keep, q / q.sum(), p[keep].sum()


def main() -> None:
    p1 = softmax(Z)
    assert np.allclose(p1, [0.6364, 0.2341, 0.0861, 0.0317, 0.0117], atol=1e-4)
    assert np.isclose(softmax(Z, 0.5)[0], 0.8647, atol=1e-4)
    assert np.isclose(softmax(Z, 2.0)[0], 0.4287, atol=1e-4)

    keep, q, mass = top_filter(p1, 0, 0.9)
    assert keep.tolist() == [True, True, True, False, False]
    assert np.allclose(q[:3], [0.6652, 0.2447, 0.0900], atol=1e-3) and np.isclose(mass, 0.9567, atol=1e-4)
    _, q2, _ = top_filter(p1, 2, 1.0)
    assert np.allclose(q2[:2], [0.7311, 0.2689], atol=1e-4)

    # Đuôi xấu = 2 token cuối
    p2 = softmax(Z, 2.0)
    bad = p2[3:].sum()
    assert np.isclose(bad, 0.1537, atol=1e-4)
    assert 1 - (1 - bad) ** 50 > 0.999, "Sinh 50 token gần như chắc chắn gặp token xấu nếu không lọc"
    keep, q3, _ = top_filter(p2, 0, 0.9)
    assert keep.sum() == 4 and np.isclose(q3[3:].sum(), 0.1015, atol=1e-3)
    _, q4, _ = top_filter(p1, 2, 1.0)
    assert q4[3:].sum() == 0

    # Kiểm tra thực nghiệm của bốc theo CDF: tần suất khớp xác suất
    rng = np.random.default_rng(0)
    draws = rng.choice(5, size=200_000, p=p1)
    freq = np.bincount(draws, minlength=5) / len(draws)
    assert np.allclose(freq, p1, atol=5e-3)

    # Nghịch đảo CDF
    cdf = np.cumsum(p1)
    assert np.searchsorted(cdf, 0.5, side="right") == 0
    assert np.searchsorted(cdf, 0.8, side="right") == 1
    assert np.searchsorted(cdf, 0.95, side="right") == 2


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
