#!/usr/bin/env python3
"""
lessons/conv2d_im2col/kiem_tra.py
Tích chập 2D (thực chất là tương quan chéo) bằng vòng lặp trực tiếp, bằng im2col + GEMM và bằng cửa sổ trượt numpy.
Mỗi mục gồm: (1) phép tính độc lập bằng numpy, (2) đối chiếu trực tiếp với logic.js qua tools/checks_common.js_calc.
"""
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402



def direct_conv(img, ker):
    H, W = img.shape
    kh, kw = ker.shape
    out = np.zeros((H - kh + 1, W - kw + 1))
    for r in range(out.shape[0]):
        for c in range(out.shape[1]):
            out[r, c] = (img[r:r + kh, c:c + kw] * ker).sum()
    return out


def im2col(img, kh, kw):
    H, W = img.shape
    rows = [img[r:r + kh, c:c + kw].reshape(-1) for r in range(H - kh + 1) for c in range(W - kw + 1)]
    return np.array(rows)


def main() -> None:
    img = np.array([[1, 2, 0], [0, 1, 1], [2, 0, 1]], dtype=float)
    expected_cols = [[1, 2, 0, 1], [2, 0, 1, 1], [0, 1, 2, 0], [1, 1, 0, 1]]
    assert im2col(img, 2, 2).tolist() == expected_cols

    kernels = {
        "identity_diagonal": [1, 0, 0, 1],
        "edge_horizontal": [1, 1, -1, -1],
        "box_blur": [1, 1, 1, 1],
    }
    for preset, k in kernels.items():
        ker = np.array(k, dtype=float).reshape(2, 2)
        direct = direct_conv(img, ker)
        gemm = im2col(img, 2, 2) @ ker.reshape(-1)
        win = np.lib.stride_tricks.sliding_window_view(img, (2, 2))  # cửa sổ trượt không sao chép (view)
        via_view = (win * ker).sum(axis=(2, 3))
        assert np.allclose(direct, gemm.reshape(2, 2)) and np.allclose(direct, via_view), preset

        js = js_calc("conv2d_im2col", preset=preset)
        assert js["im2colMatrix"] == expected_cols
        assert np.allclose(js["directConvOutputs"], direct.reshape(-1)), preset
        assert np.allclose(js["gemmOutputs"], gemm) and js["isGemmExactMatch"] is True

    # Giá trị cụ thể trong bài: kernel đường chéo cho [2, 3, 0, 2]; làm mờ đều cho [4, 4, 3, 3]
    assert js_calc("conv2d_im2col", preset="identity_diagonal")["gemmOutputs"] == [2, 3, 0, 2]
    assert js_calc("conv2d_im2col", preset="box_blur")["gemmOutputs"] == [4, 4, 3, 3]

    # Kích thước đầu ra và chi phí bộ nhớ của im2col
    H = W = 3; k = 2
    out_h, out_w = H - k + 1, W - k + 1
    assert (out_h, out_w) == (2, 2) and im2col(img, 2, 2).shape == (out_h * out_w, k * k)
    assert im2col(img, 2, 2).size == 16 > img.size == 9, "im2col nhân bản dữ liệu: 16 > 9 phần tử"


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
