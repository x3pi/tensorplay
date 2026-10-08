#!/usr/bin/env python3
"""
lessons/moe_routing/kiem_tra.py
Router top-k, dung lượng chuyên gia, loss cân bằng tải bằng numpy; đối chiếu logic.js.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402

L = np.array([[2, 0, 0, 0], [2, 1, 0, 0], [1, 2, 0, 0], [3, 0, 0, 0],
              [2, 0, 1, 0], [0, 0, 2, 1], [1, 0, 0, 2], [2, 0, 0, 1]], dtype=float)
BIAS = np.array([-1.5, 0, 0.5, 0.5])


def softmax(x):
    e = np.exp(x - x.max(1, keepdims=True))
    return e / e.sum(1, keepdims=True)


def route(k, cf, balanced):
    T, E = L.shape
    P = softmax(L + (BIAS if balanced else 0))
    topk = np.argsort(-P, axis=1, kind="stable")[:, :k]
    counts = np.bincount(topk.ravel(), minlength=E)
    cap = int(np.ceil(cf * T * k / E))
    load, drops = np.zeros(E, int), []
    for t in range(T):
        for e in topk[t]:
            if load[e] < cap:
                load[e] += 1
            else:
                drops.append((t, int(e)))
    f = counts / (T * k)
    aux = E * float((f * P.mean(0)).sum())
    return counts, cap, load, drops, aux


def main() -> None:
    counts, cap, load, drops, aux = route(1, 1.0, False)
    assert counts.tolist() == [5, 1, 1, 1] and cap == 2 and load.tolist() == [2, 1, 1, 1]
    assert [d[0] for d in drops] == [3, 4, 7] and np.isclose(aux, 1.4859, atol=1e-4)

    counts, cap, load, drops, aux = route(1, 1.0, True)
    assert counts.tolist() == [2, 2, 2, 2] and not drops and np.isclose(aux, 1.0, atol=1e-9), "Cân bằng hoàn hảo: aux = 1"

    counts, cap, load, drops, aux = route(2, 1.0, False)
    assert counts.tolist() == [7, 4, 2, 3] and cap == 4 and len(drops) == 3 and np.isclose(aux, 1.243, atol=1e-3)
    assert counts.sum() == 8 * 2

    # Phân phối đều hoàn hảo cho aux đúng bằng 1
    uniform = np.full((8, 4), 0.25)
    assert np.isclose(4 * float((np.full(4, 0.25) * uniform.mean(0)).sum()), 1.0)

    # Tham số: một FFN d = 4, m = 4 có 128 tham số
    d, m = 4, 4
    ffn = np.zeros((d, m * d)).size + np.zeros((m * d, d)).size
    assert ffn == 128 and 4 * ffn == 512 and 2 * ffn == 256

    # Đối chiếu JS cho 5 preset
    for preset, (k, cf, bal) in (("collapse_top1", (1, 1.0, False)), ("roomy_capacity", (1, 2.5, False)), ("balanced_top1", (1, 1.0, True)),
                                 ("top2", (2, 1.0, False)), ("top2_roomy", (2, 2.5, False))):
        js = js_calc("moe_routing", preset=preset)
        counts, cap, load, drops, aux = route(k, cf, bal)
        assert js["counts"] == counts.tolist() and js["cap"] == cap and js["load"] == load.tolist(), preset
        assert len(js["dropped"]) == len(drops) and abs(js["aux"] - aux) < 1e-3, preset


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
