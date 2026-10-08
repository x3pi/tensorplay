#!/usr/bin/env python3
"""
lessons/mini_gpt_forward/kiem_tra.py
Cài đặt độc lập một khối Pre-LN GPT nhỏ bằng numpy rồi so từng giai đoạn với logic.js.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402

E = np.eye(4)


def ln(x, eps=1e-5):
    return (x - x.mean(-1, keepdims=True)) / np.sqrt(x.var(-1, keepdims=True) + eps)


def pe(T):
    return np.array([[0, 0, np.sin(p * np.pi / 2), np.cos(p * np.pi / 2)] for p in range(T)])


def forward(ids):
    T = len(ids)
    x = E[ids] + pe(T)
    h = ln(x)
    heads = []
    for i in range(2):
        s = slice(2 * i, 2 * i + 2)
        sc = h[:, s] @ h[:, s].T / np.sqrt(2)
        sc = np.where(np.triu(np.ones((T, T)), 1) == 1, -np.inf, sc)
        p = np.exp(sc - sc.max(1, keepdims=True))
        p /= p.sum(1, keepdims=True)
        heads.append(p @ h[:, s])
    A = np.concatenate(heads, 1)
    x1 = x + A
    f = np.maximum(0, ln(x1))
    x2 = x1 + f
    logits = ln(x2) @ E.T
    P = np.exp(logits - logits.max(1, keepdims=True))
    P /= P.sum(1, keepdims=True)
    return {"x": x, "h": h, "A": A, "x1": x1, "f": f, "x2": x2, "logits": logits, "P": P}


def main() -> None:
    r = forward([0, 1, 2])
    assert np.allclose(r["x"], [[1, 0, 0, 1], [0, 1, 1, 0], [0, 0, 1, -1]], atol=1e-12)
    assert np.allclose(r["A"][1], [-0.888, 0.888, 0.888, -0.888], atol=1e-3)
    assert np.allclose(r["logits"][2], [-0.165, -0.165, 1.56, -1.229], atol=1e-3)
    assert np.isclose(r["P"][2].max(), 0.705, atol=1e-3) and int(r["P"][2].argmax()) == 2
    assert np.allclose(r["P"].sum(1), 1.0)

    # Nhân quả: đổi token cuối không đổi hàng trước; đảo thứ tự thì đổi
    r2 = forward([0, 1, 3])
    assert np.allclose(r["logits"][:2], r2["logits"][:2], atol=1e-12) and not np.allclose(r["logits"][2], r2["logits"][2])
    r3 = forward([2, 1, 0])
    assert not np.allclose(r["logits"][1], r3["logits"][1]), "Hoán vị đầu vào đổi đầu ra nhờ mã vị trí"

    # Đếm tham số từ shape
    d = 4
    attn = 4 * np.zeros((d, d)).size
    ffn = np.zeros((d, 2 * d)).size + np.zeros((2 * d, d)).size
    emb = np.zeros((4, d)).size
    assert (attn, ffn, emb, attn + ffn + emb) == (64, 64, 16, 144)

    # Đối chiếu JS từng giai đoạn
    names = {2: "x", 3: "h", 4: "A", 5: "x1", 6: "f", 7: "x2", 8: "logits", 9: "P"}
    for stage, key in names.items():
        js = js_calc("mini_gpt_forward", update={"seq": "seqA", "stage": stage})
        assert np.allclose(js["matrix"], r[key], atol=1e-3), (stage, key)
    js = js_calc("mini_gpt_forward", preset="final_probs")
    assert js["nextToken"] == "pin" and abs(js["nextProb"] - r["P"][2].max()) < 1e-3
    assert js["params"]["total"] == 144 and js["flopsPerToken"] == 288
    assert js_calc("mini_gpt_forward", update={"seq": "seqB", "stage": 8})["matrix"][:2] == js_calc("mini_gpt_forward", update={"seq": "seqA", "stage": 8})["matrix"][:2]


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
