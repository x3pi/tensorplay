#!/usr/bin/env python3
"""
lessons/quantization_int8/kiem_tra.py
Lượng tử hóa bằng numpy.rint (nửa về chẵn) rồi đối chiếu logic.js.
"""
import numpy as np

BASE = np.array([0.1, -0.2, 0.3, 0.2, -0.1, 0.25, -0.3, 0.28])


def quant(w, bits, scheme, g=2):
    qmax = 2 ** (bits - 1) - 1
    if scheme == "tensor":
        s = np.full(len(w), np.abs(w).max() / qmax)
    else:
        s = np.repeat([np.abs(w[i:i + g]).max() / qmax for i in range(0, len(w), g)], g)
    q = np.rint(w / s).astype(int)
    return q, q * s


def stats(w, dq):
    err = np.abs(dq - w)[:7]
    return err.mean(), (err / np.abs(w[:7])).max()


def main() -> None:
    q, dq = quant(BASE, 8, "tensor")
    assert q.tolist() == [42, -85, 127, 85, -42, 106, -127, 119]
    assert np.isclose(stats(BASE, dq)[0], 0.00051, atol=1e-5)

    out = BASE.copy()
    out[7] = 20.0
    q, dq = quant(out, 8, "tensor")
    assert q.tolist() == [1, -1, 2, 1, -1, 2, -2, 127]
    mae_t, rel_t = stats(out, dq)
    assert np.isclose(mae_t, 0.04213, atol=1e-5) and np.isclose(rel_t, 0.575, atol=1e-3)

    q, dq = quant(out, 8, "group")
    assert q.tolist() == [63, -127, 127, 85, -51, 127, -2, 127]
    mae_g, rel_g = stats(out, dq)
    assert np.isclose(mae_g, 0.00242, atol=1e-5) and np.isclose(rel_g, 0.05, atol=5e-3)
    assert mae_t / mae_g > 15, "Chia nhóm cải thiện sai số trên 15 lần"

    q, dq = quant(out, 4, "tensor")
    assert q.tolist() == [0, 0, 0, 0, 0, 0, 0, 7], "INT4 + ngoại lai: toàn bộ trọng số bình thường về 0"
    q, dq = quant(BASE, 4, "group")
    mae4, rel4 = stats(BASE, dq)
    assert np.isclose(mae4, 0.0051, atol=1e-4) and np.isclose(rel4, 0.143, atol=1e-3)

    # Sai số lượng tử hóa không bao giờ vượt s/2 với trọng số trong dải
    q, dq = quant(BASE, 8, "tensor")
    s = np.abs(BASE).max() / 127
    assert np.all(np.abs(dq - BASE) <= s / 2 + 1e-12)

    # Hệ thống: 7B tham số, băng thông 2 TB/s
    params, bw = 7e9, 2e12
    assert np.isclose(bw / (params * 2), 142.857, atol=1e-2)
    assert np.isclose(bw / (params * 1), 285.714, atol=1e-2)
    assert np.isclose(bw / (params * 0.5), 571.428, atol=1e-2)
    assert np.isclose(1 + 2 / 128, 1.015625)


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
