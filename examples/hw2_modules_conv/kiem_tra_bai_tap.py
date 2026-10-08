#!/usr/bin/env python3
"""
kiem_tra_bai_tap.py
Script kiểm chứng tự động toàn bộ kết quả số học và nguyên lý toán học
cho các bài học Track 2 (HW2: Modules & Mạng Tích Chập).
Tuân thủ nghiêm ngặt Quy Chuẩn AGENTS.md.
"""

import numpy as np

def kiem_tra_kaiming_init():
    print("=== [Kiểm tra Bài: Khởi Tạo Kaiming vs Xavier] ===")
    n = 4 # fan_in
    # Với ReLU: k = 0.5. gain = n * var * 0.5
    # Kaiming var = 2/n = 0.5 -> gain = 4 * 0.5 * 0.5 = 1.0
    var_kaiming = 2.0 / n
    gain_kaiming = n * var_kaiming * 0.5
    assert gain_kaiming == 1.0, f"Gain Kaiming phải bằng 1.0, nhận được {gain_kaiming}"

    # Sau 10 tầng: 1.0^10 = 1.0
    energy_kaiming_10 = gain_kaiming ** 10
    assert energy_kaiming_10 == 1.0

    # Xavier với ReLU: var = 1/n = 0.25 -> gain = 4 * 0.25 * 0.5 = 0.5
    var_xavier = 1.0 / n
    gain_xavier = n * var_xavier * 0.5
    assert gain_xavier == 0.5
    energy_xavier_10 = gain_xavier ** 10
    assert np.isclose(energy_xavier_10, 0.5 ** 10), "Xavier qua 10 tầng phải tiêu biến về 0.5^10"
    print("-> Kaiming Init: ĐẠT CHUẨN 100%\n")


def kiem_tra_dropout():
    print("=== [Kiểm tra Bài: Inverted Dropout] ===")
    h = np.array([4.0, 2.0, 6.0, 4.0])
    mask = np.array([1.0, 0.0, 1.0, 0.0])
    p = 0.5
    scale = 1.0 / (1.0 - p) # scale = 2.0
    assert scale == 2.0

    out_train = h * mask * scale
    assert np.allclose(out_train, [8.0, 0.0, 12.0, 0.0])

    # Kỳ vọng năng lượng lúc train
    expected_mean = np.mean(h) # (4+2+6+4)/4 = 4.0
    assert expected_mean == 4.0

    # Gradient dội về với dL/dout = [1, 1, 1, 1]
    grad_out = np.array([1.0, 1.0, 1.0, 1.0])
    grad_in = grad_out * mask * scale
    assert np.allclose(grad_in, [2.0, 0.0, 2.0, 0.0])
    print("-> Dropout: ĐẠT CHUẨN 100%\n")


def kiem_tra_optimizers():
    print("=== [Kiểm tra Bài: Động Học Các Bộ Tối Ưu] ===")
    p0 = np.array([-4.0, 1.0])
    # f(x, y) = 0.5 * (0.2 x^2 + 4 y^2)
    loss0 = 0.5 * (0.2 * (-4.0)**2 + 4 * (1.0)**2)
    assert loss0 == 3.6, f"Loss ban đầu phải là 3.6, nhận được {loss0}"

    g0 = np.array([0.2 * (-4.0), 4.0 * 1.0])
    assert np.allclose(g0, [-0.8, 4.0])

    # SGD 1 bước với lr = 0.1
    p1_sgd = p0 - 0.1 * g0
    assert np.allclose(p1_sgd, [-3.92, 0.6])
    loss1_sgd = 0.5 * (0.2 * (p1_sgd[0])**2 + 4 * (p1_sgd[1])**2)
    assert np.isclose(loss1_sgd, 2.25664)

    # Giới hạn phân kỳ trục y: Hessian = 4. Hệ số sai phân (1 - 4 * lr).
    # Với lr = 0.55: |1 - 4 * 0.55| = |-1.2| = 1.2 > 1 -> bùng nổ
    assert abs(1 - 4 * 0.55) > 1.0
    print("-> Optimizers: ĐẠT CHUẨN 100%\n")



def kiem_tra_layernorm_residual():
    print("=== [Kiểm tra Bài 19: LayerNorm vs BatchNorm & Residual] ===")
    X = np.array([[1.0, 3.0], [2.0, 6.0]])

    # LayerNorm: chuẩn hóa theo hàng (axis=1)
    ln = (X - X.mean(axis=1, keepdims=True)) / X.std(axis=1, keepdims=True)
    assert np.allclose(ln, [[-1, 1], [-1, 1]]), f"LayerNorm sai: {ln}"

    # BatchNorm: chuẩn hóa theo cột (axis=0)
    bn = (X - X.mean(axis=0, keepdims=True)) / X.std(axis=0, keepdims=True)
    assert np.allclose(bn, [[-1, -1], [1, 1]]), f"BatchNorm sai: {bn}"

    # Batch = 1: BatchNorm sụp về 0 (phương sai 0), LayerNorm không phụ thuộc batch
    x1 = X[:1]
    assert np.all(x1.std(axis=0) == 0), "Batch=1 -> phương sai mỗi cột phải bằng 0"
    assert np.allclose((x1 - x1.mean(axis=0)), 0), "BatchNorm batch=1 -> tử số = 0"
    ln1 = (x1 - x1.mean(axis=1, keepdims=True)) / x1.std(axis=1, keepdims=True)
    assert np.allclose(ln1[0], ln[0]), "LayerNorm mẫu 1 phải không đổi khi batch đổi"

    # Mẫu 1 qua BatchNorm: batch=2 ra [-1,-1], batch=1 ra [0,0] -> phụ thuộc hàng xóm
    assert np.allclose(bn[0], [-1, -1])

    # Residual: gradient qua L=6 tầng với f' = 0.1
    L, fp = 6, 0.1
    assert np.isclose(fp ** L, 1e-6)
    assert np.isclose((1 + fp) ** L, 1.771561)

    # Kiểm tra bằng autograd số: y = x + 0.1*x lặp 6 lần -> dy/dx = 1.1^6
    def f(x):
        for _ in range(L):
            x = x + fp * x
        return x
    eps = 1e-6
    num = (f(1.0 + eps) - f(1.0 - eps)) / (2 * eps)
    assert np.isclose(num, 1.1 ** 6, rtol=1e-6)
    print("-> LayerNorm & Residual: ĐẠT CHUẨN 100%\n")


if __name__ == "__main__":
    print("==================================================")
    print("  KIỂM CHỨNG TOÁN HỌC TỰ ĐỘNG - TRACK 2 (MODULES & CNN)")
    print("==================================================\n")
    kiem_tra_kaiming_init()
    kiem_tra_dropout()
    kiem_tra_optimizers()
    kiem_tra_layernorm_residual()
    print("🎉 TẤT CẢ CÁC BÀI TẬP TRACK 2 ĐỀU ĐẠT CHUẨN SỐ HỌC!")
