#!/usr/bin/env python3
"""
kiem_tra_bai_tap.py
Script kiểm chứng tự động toàn bộ kết quả số học và nguyên lý toán học
cho các bài học Track 0 (HW0: Tensor, Bộ Nhớ & Lan Truyền Ngược).
Tuân thủ nghiêm ngặt Quy Chuẩn AGENTS.md.
"""

import math
import numpy as np

def kiem_tra_bai_01():
    print("=== [Kiểm tra Bài 01: Robot Vision & Dot Product] ===")
    # 1. Ảnh chuẩn gạch ngang và khuôn dập W
    X_std = np.array([1, 1, 0, 0])
    W = np.array([1, 1, -1, -1])
    Z_std = np.dot(X_std, W)
    assert Z_std == 2, f"Điểm chuẩn phải là 2, nhận được {Z_std}"

    # 2. Ảnh dính bụi (pixel 2 bị xám 0.5)
    X_dust = np.array([1, 1, 0.5, 0])
    Z_dust = np.dot(X_dust, W)
    assert Z_dust == 1.5, f"Điểm dính bụi phải là 1.5, nhận được {Z_dust}"
    assert Z_dust > 1.0, "Ngưỡng quyết định 1.0 vẫn nhận diện đúng khi dính bụi nhẹ"

    # 3. Đèn pha chói lòa [1, 1, 1, 1] bị triệt tiêu bởi trọng số âm
    X_headlight = np.array([1, 1, 1, 1])
    Z_headlight = np.dot(X_headlight, W)
    assert Z_headlight == 0, f"Đèn pha phải bị triệt tiêu về 0, nhận được {Z_headlight}"

    # 4. Ánh xạ 2D -> 1D
    r, c, N = 1, 0, 2
    offset = r * N + c
    assert offset == 2, f"Offset của (1, 0) với N=2 phải bằng 2, nhận được {offset}"
    print("-> Bài 01: ĐẠT CHUẨN 100%\n")


def kiem_tra_bai_02():
    print("=== [Kiểm tra Bài 02: Softmax & Cross-Entropy Loss] ===")
    # 1. Softmax chuẩn
    z = np.array([2.0, 0.0])
    exp_z = np.exp(z)
    P = exp_z / np.sum(exp_z)
    assert math.isclose(np.sum(P), 1.0, rel_tol=1e-5), "Tổng xác suất phải bằng 1.0"
    assert P[0] > P[1], "Điểm số cao hơn phải có xác suất cao hơn"

    # 2. Cơn ác mộng tràn số FP32
    assert math.exp(88) < 3.4e38, "exp(88) nằm trong giới hạn FP32"
    try:
        # Trong float thông thường, exp(1000) sẽ tràn số
        overflow_val = math.exp(1000)
    except OverflowError:
        pass  # Đạt chuẩn: exp(1000) gây lỗi tràn số

    # 3. Kỹ thuật Safe Softmax (trừ max)
    z_large = np.array([1000.0, 1000.0])
    M = np.max(z_large)
    safe_exp = np.exp(z_large - M)
    P_safe = safe_exp / np.sum(safe_exp)
    assert np.allclose(P_safe, [0.5, 0.5]), f"Safe Softmax [1000, 1000] phải là [0.5, 0.5], nhận được {P_safe}"

    # 4. Tính bất biến đối với phép tịnh tiến
    z_orig = np.array([2.0, 1.0])
    z_shift = z_orig + 500.0
    P_orig = np.exp(z_orig - np.max(z_orig)) / np.sum(np.exp(z_orig - np.max(z_orig)))
    P_shift = np.exp(z_shift - np.max(z_shift)) / np.sum(np.exp(z_shift - np.max(z_shift)))
    assert np.allclose(P_orig, P_shift), "Xác suất Safe Softmax bất biến tuyệt đối với phép cộng hằng số"

    # 5. Cross-Entropy Loss
    loss_confident = -math.log(0.99)
    loss_wrong = -math.log(0.01)
    assert loss_confident < 0.02, "Đoán đúng tự tin thì Loss tiến sát 0"
    assert loss_wrong > 4.6, "Đoán sai tự tin thì Loss phạt rất nặng (>4.6)"
    print("-> Bài 02: ĐẠT CHUẨN 100%\n")


def kiem_tra_bai_03():
    print("=== [Kiểm tra Bài 03: Softmax Regression & SGD] ===")
    X = np.array([[1.0, 0.0]])  # Biển Gạch Ngang (1, 0)
    W = np.array([
        [1.0, -1.0],
        [-1.0, 1.0]
    ])
    y_target = 0  # Lớp Dừng

    # Forward
    Z = np.dot(X, W)  # [1.0, -1.0]
    P = np.exp(Z - np.max(Z)) / np.sum(np.exp(Z - np.max(Z)))
    Loss_truoc = -math.log(P[0, y_target])

    # Backward: G = P - I_y
    G = P.copy()
    G[0, y_target] -= 1.0
    assert G[0, 0] < 0, "Lớp đúng thiếu điểm phải có gradient dội ngược mang dấu âm"
    assert G[0, 1] > 0, "Lớp sai thừa điểm phải có gradient dội ngược mang dấu dương"

    # Gradient: grad_W = X.T @ G
    grad_W = np.dot(X.T, G)

    # SGD update
    lr = 0.5
    W_moi = W - lr * grad_W

    # Kiểm chứng sau 1 bước cập nhật, robot thông minh hơn
    Z_sau = np.dot(X, W_moi)
    P_sau = np.exp(Z_sau - np.max(Z_sau)) / np.sum(np.exp(Z_sau - np.max(Z_sau)))
    Loss_sau = -math.log(P_sau[0, y_target])

    assert Loss_sau < Loss_truoc, f"Loss phải giảm sau 1 bước SGD ({Loss_sau:.4f} < {Loss_truoc:.4f})"
    assert P_sau[0, y_target] > P[0, y_target], "Độ tự tin của lớp đúng phải tăng lên"
    print(f"-> Loss trước: {Loss_truoc:.4f} -> Loss sau: {Loss_sau:.4f} (Đã giảm!)")
    print("-> Bài 03: ĐẠT CHUẨN 100%\n")


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


def kiem_tra_bai_05():
    print("=== [Kiểm tra Bài 06: Mini-batch SGD B=2] ===")
    B = 2
    X = np.array([
        [1.0, 0.0],
        [0.0, 1.0]
    ])
    theta = np.array([
        [1.0, -1.0],
        [-1.0, 1.0]
    ])
    Z = np.dot(X, theta)
    P = np.exp(Z) / np.sum(np.exp(Z), axis=1, keepdims=True)
    assert np.allclose(np.sum(P, axis=1), [1.0, 1.0]), "Mỗi hàng trong batch có tổng xác suất độc lập = 1.0"

    # Sai số trung bình chia cho B
    I_y = np.eye(2)
    G = (P - I_y) / B
    grad_theta = np.dot(X.T, G)
    assert grad_theta.shape == (2, 2), "Kích thước gradient ma trận chuyển vị phải khớp với theta"
    print("-> Bài 06: ĐẠT CHUẨN 100%\n")


def kiem_tra_bai_06a():
    print("=== [Kiểm tra Bài 06a: C++ Matmul Loops & 1D Indexing] ===")
    M, K, N = 2, 3, 2
    A = np.array([[1, 2, 3], [4, 5, 6]], dtype=np.float32)
    B_mat = np.array([[7, 8], [9, 1], [2, 3]], dtype=np.float32)

    # Trải phẳng 1D
    A_1D = A.flatten()
    B_1D = B_mat.flatten()
    C_1D = np.zeros(M * N, dtype=np.float32)

    # 3 vòng lặp C++ lồng nhau
    total_steps = 0
    for i in range(M):
        for j in range(N):
            for l in range(K):
                C_1D[i * N + j] += A_1D[i * K + l] * B_1D[l * N + j]
                total_steps += 1

    expected_C = np.dot(A, B_mat).flatten()
    assert np.allclose(C_1D, expected_C), "Phép nhân 1D C++ phải cho kết quả chính xác 100%"
    assert total_steps == M * N * K, f"Số bước lặp phải là {M*N*K}, nhận được {total_steps}"
    print(f"-> Tổng bước lặp: {total_steps} khớp chuẩn $M \\times N \\times K$")
    print("-> Bài 06a: ĐẠT CHUẨN 100%\n")


def kiem_tra_strides_views():
    print("=== [Kiểm tra Bài: Strides & Views trong NDArray] ===")
    # Mảng 1D 6 phần tử: [0, 1, 2, 3, 4, 5] (tương ứng a, b, c, d, e, f)
    raw_mem = np.array([10, 20, 30, 40, 50, 60], dtype=np.float32)

    # View 2x3: shape=(2, 3), strides=(3*4, 1*4) bytes = (12, 4)
    v_base = np.lib.stride_tricks.as_strided(raw_mem, shape=(2, 3), strides=(3*4, 1*4))
    assert v_base.flags['C_CONTIGUOUS'] == True
    # Phần tử (1, 2): offset + 1*3 + 2*1 = 5 -> giá trị 60
    assert v_base[1, 2] == 60

    # Transpose 3x2: shape=(3, 2), strides=(1*4, 3*4) bytes = (4, 12)
    v_trans = np.lib.stride_tricks.as_strided(raw_mem, shape=(3, 2), strides=(1*4, 3*4))
    assert v_trans.flags['C_CONTIGUOUS'] == False, "Transpose view không còn contiguous"
    assert v_trans[2, 1] == 60 # ô (2, 1) trong ma trận chuyển vị chính là ô (1, 2) cũ

    # Broadcast: shape=(3, 3), strides=(0, 1*4) bytes
    v_bcast = np.lib.stride_tricks.as_strided(raw_mem, shape=(3, 3), strides=(0, 1*4))
    assert v_bcast.shape == (3, 3)
    assert np.all(v_bcast[0] == v_bcast[1]) and np.all(v_bcast[1] == v_bcast[2])
    print("-> Strides Views: ĐẠT CHUẨN 100%\n")


def kiem_tra_cross_entropy_logsumexp():
    print("=== [Kiểm tra Bài: Cross-Entropy dạng Log-Sum-Exp] ===")
    def lse(z):
        m = np.max(z)
        return m + np.log(np.sum(np.exp(z - m)))

    def loss_lse(z, y):
        return lse(z) - z[y]

    # 1. Trường hợp bình thường [2.0, 1.0], nhãn y=1
    z_norm = np.array([2.0, 1.0])
    lse_norm = lse(z_norm)
    assert math.isclose(lse_norm, 2.3132616875, rel_tol=1e-5)
    loss_norm = loss_lse(z_norm, 1)
    assert math.isclose(loss_norm, 1.3132616875, rel_tol=1e-5)

    # 2. Trường hợp chênh lệch cực đại [0.0, -1000.0], nhãn y=1 (Underflow)
    z_under = np.array([0.0, -1000.0])
    # Naive: exp(-1000) -> 0.0 -> log(0) -> -inf -> loss = inf
    loss_under_lse = loss_lse(z_under, 1)
    assert loss_under_lse == 1000.0, f"Loss LSE phải đúng bằng 1000.0, nhận được {loss_under_lse}"

    # 3. Trường hợp số cực lớn [1000.0, 999.0], nhãn y=0 (Overflow)
    z_over = np.array([1000.0, 999.0])
    loss_over_lse = loss_lse(z_over, 0)
    assert math.isclose(loss_over_lse, 0.3132616875, rel_tol=1e-5)

    # 4. Kiểm chứng Gradient bằng sai phân hữu hạn (Numerical Gradient)
    eps = 1e-6
    grad_analytical = np.exp(z_norm - np.max(z_norm)) / np.sum(np.exp(z_norm - np.max(z_norm)))
    grad_analytical[1] -= 1.0  # target y=1

    grad_numerical = np.zeros(2)
    for i in range(2):
        z_pos = z_norm.copy()
        z_neg = z_norm.copy()
        z_pos[i] += eps
        z_neg[i] -= eps
        grad_numerical[i] = (loss_lse(z_pos, 1) - loss_lse(z_neg, 1)) / (2 * eps)

    assert np.allclose(grad_analytical, grad_numerical, atol=1e-5), "Gradient giải tích và sai phân hữu hạn phải khớp nhau"
    assert math.isclose(np.sum(grad_analytical), 0.0, abs_tol=1e-7), "Tổng các phần tử gradient luôn bằng 0"
    print("-> Cross-Entropy LogSumExp: ĐẠT CHUẨN 100%\n")


if __name__ == '__main__':
    print("CHẠY BỘ KIỂM CHỨNG TỰ ĐỘNG TRACK 0 (HW0) THEO QUY CHUẨN AGENTS.MD...\n")
    kiem_tra_bai_01()
    kiem_tra_bai_02()
    kiem_tra_bai_03()
    kiem_tra_bai_04()
    kiem_tra_bai_05()
    kiem_tra_bai_06a()
    kiem_tra_strides_views()
    kiem_tra_cross_entropy_logsumexp()
    print("==================================================")
    print("TẤT CẢ PHÉP TOÁN VÀ KỊCH BẢN ĐÃ ĐƯỢC XÁC THỰC THÀNH CÔNG!")
    print("==================================================")

