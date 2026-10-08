#!/usr/bin/env python3
"""
lessons/overfitting_validation/kiem_tra.py
Kiểm chứng độc lập bằng numpy.polyfit (nguồn khác với code JS).
"""
import numpy as np


def main() -> None:
    x = np.array([0.0, 1.0, 2.0, 3.0])
    y = np.array([0.5, 0.5, 2.5, 2.5])
    xv = np.array([0.5, 1.5, 2.5, 3.5])
    yv = xv.copy()  # quy luật thật y = x

    def errs(d):
        c = np.polyfit(x, y, d)
        return c, np.mean((np.polyval(c, x) - y) ** 2), np.mean((np.polyval(c, xv) - yv) ** 2)

    c0, tr0, va0 = errs(0)
    assert np.isclose(c0[0], 1.5) and np.isclose(tr0, 1.0) and np.isclose(va0, 1.5)

    c1, tr1, va1 = errs(1)
    assert np.allclose(c1, [0.8, 0.3]), c1
    assert np.isclose(tr1, 0.2) and np.isclose(va1, 0.06)

    _, tr2, va2 = errs(2)
    assert np.isclose(va2, 0.06), "Bậc 2 không cải thiện được val (hệ số x^2 bằng 0 do đối xứng)"

    c3, tr3, va3 = errs(3)
    assert np.isclose(tr3, 0.0, atol=1e-12), "Bậc 3 phải nội suy đúng 4 điểm train"
    assert np.isclose(va3, 2.375), va3
    assert va3 > 30 * va1, "Quá khớp: val tệ hơn bậc 1 hơn 30 lần dù train hoàn hảo"

    # Train luôn giảm khi tăng bậc, val thì không
    trains = [errs(d)[1] for d in range(4)]
    vals = [errs(d)[2] for d in range(4)]
    assert all(trains[i] >= trains[i + 1] - 1e-12 for i in range(3))
    assert int(np.argmin(vals)) in (1, 2)


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
