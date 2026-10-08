#!/usr/bin/env python3
"""
lessons/twolayer_relu_backprop/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
(Khôi phục đầy đủ các assertion gốc từ bộ kiểm chứng theo track cũ.)
"""
import math

import numpy as np


def kiem_tra_bai_04():
    print("=== [Kiểm tra Bài 05: Two-Layer ReLU, Dead Neuron & SGD] ===")
    X = np.array([[1.0, 1.0]])
    y = 1

    def forward(W1, W2):
        Z1 = X @ W1
        A1 = np.maximum(0, Z1)
        Z2 = A1 @ W2
        P = np.exp(Z2 - Z2.max())
        P /= P.sum()
        return Z1, A1, P, -np.log(P[0, y])

    def backward(W1, W2):
        Z1, A1, P, _ = forward(W1, W2)
        G2 = P.copy()
        G2[0, y] -= 1.0
        gW2 = A1.T @ G2
        G1 = (G2 @ W2.T) * (Z1 > 0)
        gW1 = X.T @ G1
        return gW1, gW2, G1

    def sgd(W1, W2, lr, steps):
        W1, W2 = W1.copy(), W2.copy()
        losses = [forward(W1, W2)[3]]
        for _ in range(steps):
            gW1, gW2, _ = backward(W1, W2)
            W1 -= lr * gW1
            W2 -= lr * gW2
            losses.append(forward(W1, W2)[3])
        return W1, W2, losses

    I2 = np.eye(2)
    dead_W1 = np.array([[1.0, -2.0], [0.0, 1.0]])
    healthy_W1 = np.array([[1.0, 0.0], [0.0, 0.5]])

    # 1) Nơ-ron 2 chết: Z1 = [1, -1], A1 = [1, 0], P ≈ [0.731, 0.269], loss ≈ 1.3133
    Z1, A1, P, L = forward(dead_W1, I2)
    assert np.allclose(Z1, [[1.0, -1.0]]) and np.allclose(A1, [[1.0, 0.0]])
    assert np.allclose(P, [[0.7311, 0.2689]], atol=1e-4)
    assert abs(L - 1.3133) < 1e-4

    gW1, gW2, G1 = backward(dead_W1, I2)
    assert np.all(gW2[1, :] == 0.0), "Hàng 2 của grad W2 phải bằng 0 do A1[0,1] = 0"
    assert np.allclose(gW2[0, :], [0.7311, -0.7311], atol=1e-4)
    assert G1[0, 1] == 0.0 and np.all(gW1[:, 1] == 0.0), "Cột 2 của grad W1 bị van ReLU chém đứt"
    assert np.allclose(gW1[:, 0], [0.7311, 0.7311], atol=1e-4)

    # 2) Gradient giải tích khớp sai phân hữu hạn (mạng chuẩn, mọi trọng số)
    W2 = I2.copy()
    gW1, gW2, _ = backward(healthy_W1, W2)
    eps = 1e-6
    for (name, W, g) in (("W1", healthy_W1, gW1), ("W2", W2, gW2)):
        for idx in np.ndindex(W.shape):
            Wp, Wm = W.copy(), W.copy()
            Wp[idx] += eps
            Wm[idx] -= eps
            if name == "W1":
                num = (forward(Wp, W2)[3] - forward(Wm, W2)[3]) / (2 * eps)
            else:
                num = (forward(healthy_W1, Wp)[3] - forward(healthy_W1, Wm)[3]) / (2 * eps)
            assert abs(num - g[idx]) < 1e-5, f"Gradient {name}{idx}: số {num} vs giải tích {g[idx]}"

    # 3) SGD lr = 0.5: mạng chuẩn học tốt, nơ-ron chết kẹt ở ln 2
    _, _, healthy_losses = sgd(healthy_W1, I2, 0.5, 50)
    assert np.allclose(healthy_losses[:4], [0.9741, 0.2348, 0.1188, 0.0715], atol=1e-4)
    assert healthy_losses[-1] < 0.01
    W1_end, _, dead_losses = sgd(dead_W1, I2, 0.5, 50)
    assert np.allclose(dead_losses[:4], [1.3133, 0.7300, 0.7016, 0.6952], atol=1e-4)
    assert abs(dead_losses[-1] - np.log(2)) < 1e-3, "Mạng một nơ-ron sống chỉ đoán mò: loss -> ln 2"
    assert np.allclose(W1_end[:, 1], dead_W1[:, 1]), "Cột 2 của W1 không bao giờ đổi -> nơ-ron không hồi sinh"
    assert (X @ W1_end)[0, 1] == -1.0

    # 4) Lời nguyền khởi tạo 0
    zeros = np.zeros((2, 2))
    gW1, gW2, _ = backward(zeros, zeros)
    assert np.all(gW1 == 0) and np.all(gW2 == 0), "W1 = W2 = 0: mọi gradient bằng 0"
    _, _, zero_losses = sgd(zeros, zeros, 0.5, 5)
    assert np.allclose(zero_losses, np.log(2)), "Loss đứng yên ở ln 2"

    gW1, gW2, _ = backward(healthy_W1, zeros)
    assert np.all(gW1 == 0) and np.any(gW2 != 0), "Chỉ W2 = 0: grad W1 = 0 nhưng grad W2 khác 0"
    _, _, w2_losses = sgd(healthy_W1, zeros, 0.5, 1)
    assert abs(w2_losses[1] - 0.4287) < 1e-4 and w2_losses[1] < w2_losses[0]
    print("-> Bài 05: ĐẠT CHUẨN 100%\n")


def main() -> None:
    kiem_tra_bai_04()


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
