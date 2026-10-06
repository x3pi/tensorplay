#!/usr/bin/env python3
"""
kiem_tra_bai_tap.py
Script kiểm chứng tự động toàn bộ kết quả số học và nguyên lý toán học
cho các bài học Track 1 (HW1: Động Cơ Tính Đạo Hàm Autograd).
Tuân thủ nghiêm ngặt Quy Chuẩn AGENTS.md.
"""

import numpy as np

def kiem_tra_broadcast_grad():
    print("=== [Kiểm tra Bài: Gradient Của Broadcast (Cộng dồn)] ===")
    P = np.array([[2.0, 0.0], [0.0, 1.0]])
    Y = np.array([[3.0, 0.0], [1.0, 2.0]])
    b0 = np.array([0.0, 0.0])

    # Forward
    Z = P + b0
    G = Z - Y
    assert np.allclose(G, [[-1.0, 0.0], [-1.0, -1.0]])
    loss0 = 0.5 * np.sum(G ** 2)
    assert loss0 == 1.5

    # Đạo hàm cộng dồn dọc theo trục batch (axis 0)
    grad_b = np.sum(G, axis=0)
    assert np.allclose(grad_b, [-2.0, -1.0])

    # Cập nhật 1 bước với lr = 0.5
    lr = 0.5
    b1 = b0 - lr * grad_b
    assert np.allclose(b1, [1.0, 0.5])
    Z1 = P + b1
    loss1 = 0.5 * np.sum((Z1 - Y) ** 2)
    assert loss1 == 0.25, f"Loss sau 1 bước phải là 0.25, nhận được {loss1}"

    # Lỗi ghi đè (chỉ lấy hàng cuối)
    grad_b_bug = G[-1]
    assert np.allclose(grad_b_bug, [-1.0, -1.0])
    print("-> Broadcast Grad: ĐẠT CHUẨN 100%\n")


def kiem_tra_gradient_check():
    print("=== [Kiểm tra Bài: Kiểm Tra Gradient Bằng Số] ===")
    x = np.array([1.0, 2.0])
    y = 3.0
    w = np.array([0.5, 0.5])

    def f(w_vec):
        return (np.dot(w_vec, x) - y) ** 2

    # f(w0) = (0.5*1 + 0.5*2 - 3)^2 = (-1.5)^2 = 2.25
    assert f(w) == 2.25

    # Đạo hàm giải tích: 2 * (w.x - y) * x = 2 * (-1.5) * [1, 2] = [-3, -6]
    grad_analytic = 2 * (np.dot(w, x) - y) * x
    assert np.allclose(grad_analytic, [-3.0, -6.0])

    # Sai phân trung tâm với eps = 1e-4
    eps = 1e-4
    grad_num = np.zeros(2)
    for i in range(2):
        w_plus = w.copy(); w_plus[i] += eps
        w_minus = w.copy(); w_minus[i] -= eps
        grad_num[i] = (f(w_plus) - f(w_minus)) / (2 * eps)

    rel_err = np.linalg.norm(grad_analytic - grad_num) / (np.linalg.norm(grad_analytic) + np.linalg.norm(grad_num))
    assert rel_err < 1e-7, f"Sai số tương đối phải < 1e-7, nhận được {rel_err}"

    # Lỗi bug quên nhân 2
    grad_bug = (np.dot(w, x) - y) * x
    rel_err_bug = np.linalg.norm(grad_bug - grad_num) / (np.linalg.norm(grad_bug) + np.linalg.norm(grad_num))
    assert rel_err_bug > 0.2, "Bug quên nhân 2 phải bị phát hiện"
    print("-> Gradient Check: ĐẠT CHUẨN 100%\n")


def kiem_tra_autograd_graph():
    print("=== [Kiểm tra Bài: Autograd Graph Topological Sort] ===")
    # Đồ thị z = (x + y) * y với x=2, y=3
    # v1 = x + y = 5
    # z = v1 * y = 15
    # dz/dz = 1
    # dz/dv1 = y = 3
    # dz/dy = v1 + dz/dv1 * 1 = 5 + 3 = 8
    # dz/dx = dz/dv1 * 1 = 3
    x, y = 2.0, 3.0
    v1 = x + y
    z = v1 * y
    assert z == 15.0

    dz_dv1 = y
    dz_dx = dz_dv1 * 1.0
    dz_dy = v1 + dz_dv1 * 1.0
    assert dz_dx == 3.0
    assert dz_dy == 8.0
    print("-> Autograd Graph: ĐẠT CHUẨN 100%\n")


if __name__ == "__main__":
    print("==================================================")
    print("  KIỂM CHỨNG TOÁN HỌC TỰ ĐỘNG - TRACK 1 (AUTOGRAD)")
    print("==================================================\n")
    kiem_tra_broadcast_grad()
    kiem_tra_gradient_check()
    kiem_tra_autograd_graph()
    print("🎉 TẤT CẢ CÁC BÀI TẬP TRACK 1 ĐỀU ĐẠT CHUẨN SỐ HỌC!")
