#!/usr/bin/env python3
"""
lessons/minibatch_sgd/kiem_tra.py
Hồi quy softmax với mini-batch B = 2: forward, gradient X^T G, kiểm chứng bằng sai phân hữu hạn và SGD nhiều bước.
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



X = np.array([[1.0, 0.0], [0.0, 1.0]])
Y = np.array([0, 1])
B = 2


def softmax_rows(Z):
    e = np.exp(Z - Z.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)


def loss_fn(theta):
    P = softmax_rows(X @ theta)
    return -np.mean(np.log(P[np.arange(B), Y]))


def grad_fn(theta):
    P = softmax_rows(X @ theta)
    I = np.eye(2)[Y]
    return X.T @ ((P - I) / B)


def num_grad(theta, eps=1e-6):
    g = np.zeros_like(theta)
    for idx in np.ndindex(theta.shape):
        tp, tm = theta.copy(), theta.copy()
        tp[idx] += eps
        tm[idx] -= eps
        g[idx] = (loss_fn(tp) - loss_fn(tm)) / (2 * eps)
    return g


def main() -> None:
    theta = np.zeros((2, 2))
    G0 = (softmax_rows(X @ theta) - np.eye(2)[Y]) / B
    g = grad_fn(theta)
    assert np.allclose(G0, [[-0.25, 0.25], [0.25, -0.25]]), "G = (P - I_y) / B với P = 0.5"
    assert np.allclose(g, [[-0.25, 0.25], [0.25, -0.25]]) and g.shape == theta.shape == (2, 2)
    assert np.allclose(g, num_grad(theta), atol=1e-8), "Gradient giải tích khớp sai phân hữu hạn"
    t_rand = np.array([[0.3, -0.2], [0.1, 0.4]])
    assert np.allclose(grad_fn(t_rand), num_grad(t_rand), atol=1e-7)

    # Thứ tự X^T G (đúng) so với G X^T (sai kích thước hoặc sai nghĩa)
    G_rand = np.random.default_rng(1).normal(size=(B, 3))
    assert (X.T @ G_rand).shape == (2, 3), "X^T G có kích thước (n x k) trùng với theta"

    # --- đối chiếu JS: ban đầu và sau mỗi bước SGD ---
    js = js_calc("minibatch_sgd", preset="bai5_init")
    assert np.allclose([[js["gT00"], js["gT01"]], [js["gT10"], js["gT11"]]], g)
    th = theta.copy()
    for step in range(1, 21):
        th = th - 0.2 * grad_fn(th)
        if step in (1, 5, 20):
            js = js_calc("minibatch_sgd", preset="bai5_init", calls=["stepSGD"] * step)
            assert np.allclose([[js["t00"], js["t01"]], [js["t10"], js["t11"]]], th, atol=1e-12), step
            assert np.allclose([[js["gT00"], js["gT01"]], [js["gT10"], js["gT11"]]], grad_fn(th), atol=1e-12)
    # SGD làm loss giảm dần và xác suất đúng tăng
    assert loss_fn(th) < loss_fn(theta) and np.log(2) - 1e-12 <= loss_fn(theta) <= np.log(2) + 1e-12
    P = softmax_rows(X @ th)
    assert P[0, 0] > 0.5 and P[1, 1] > 0.5


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
