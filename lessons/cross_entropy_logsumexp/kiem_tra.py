#!/usr/bin/env python3
"""
lessons/cross_entropy_logsumexp/kiem_tra.py
Dùng kiểu số thật của numpy (float32, float16) làm chuẩn độc lập để kiểm chứng mô phỏng độ chính xác trong logic.js.
"""
import math
import pathlib
import sys
import warnings

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
from checks_common import js_calc  # noqa: E402

warnings.filterwarnings("ignore")


def naive_loss(z, y, dt):
    z = np.array(z, dtype=dt)
    with np.errstate(all="ignore"):
        e = np.exp(z)
        s = e.sum(dtype=dt)
        p = (e / s).astype(dt)
        return float(-np.log(p[y])), p


def lse_loss(z, y, dt):
    z = np.array(z, dtype=dt)
    with np.errstate(all="ignore"):
        m = z.max()
        lse = (m + np.log(np.exp(z - m).sum(dtype=dt))).astype(dt)
        return float((lse - z[y]).astype(dt))


def main() -> None:
    # --- Ngưỡng tràn / hụt của từng kiểu số ---
    assert math.isclose(np.log(float(np.finfo(np.float32).max)), 88.7228, abs_tol=1e-3)
    assert math.isclose(np.log(float(np.finfo(np.float16).max)), 11.09, abs_tol=1e-2)
    assert np.exp(np.float32(88)) < np.inf and np.exp(np.float32(89)) == np.inf
    assert np.exp(np.float16(11)) < np.inf and np.exp(np.float16(12)) == np.inf
    assert np.exp(np.float32(-110)) == 0.0 and np.exp(np.float16(-20)) == 0.0

    # --- Các tình huống của bài: numpy làm chuẩn ---
    cases = {
        "normal": (np.float32, [2.0, 1.0], 1),
        "underflow": (np.float32, [0.0, -110.0], 1),
        "overflow": (np.float32, [100.0, 99.0], 0),
        "fp16_overflow": (np.float16, [12.0, 11.0], 0),
        "fp16_underflow": (np.float16, [0.0, -20.0], 1),
    }
    expected = {
        "normal": (1.3132617, 1.3132617),
        "underflow": (math.inf, 110.0),
        "overflow": (math.nan, 0.31326),
        "fp16_overflow": (math.nan, 0.3125),
        "fp16_underflow": (math.inf, 20.0),
    }
    for name, (dt, z, y) in cases.items():
        naive, _ = naive_loss(z, y, dt)
        lse = lse_loss(z, y, dt)
        e_naive, e_lse = expected[name]
        if math.isnan(e_naive):
            assert math.isnan(naive), name
        else:
            assert naive == e_naive or math.isclose(naive, e_naive, rel_tol=1e-5), name
        assert math.isclose(lse, e_lse, rel_tol=2e-4, abs_tol=1e-4), (name, lse)

        # --- Đối chiếu JS: cùng kết quả với numpy ---
        js = js_calc("cross_entropy_logsumexp", preset=name if name in ("normal", "underflow", "overflow", "fp16_overflow", "fp16_underflow") else None)
        # JS trả Infinity/NaN dạng null qua JSON: null nghĩa là không hữu hạn
        if math.isnan(e_naive) or math.isinf(e_naive):
            assert js["lossNaive"] is None, name
        else:
            assert abs(js["lossNaive"] - naive) < 1e-4, name
        assert abs(js["lossLSE"] - lse) < 1e-3, name

    # --- LSE bằng numpy.logaddexp (nguồn độc lập thứ hai, tính ở float64) ---
    for z in ([2.0, 1.0], [0.0, -110.0], [100.0, 99.0], [1000.0, 999.0], [0.0, -1000.0]):
        assert math.isclose(float(np.logaddexp.reduce(np.array(z, dtype=np.float64))), max(z) + math.log1p(math.exp(min(z) - max(z))), rel_tol=1e-12, abs_tol=1e-300)

    # --- Gradient: giải tích = sai phân hữu hạn (float64) và tổng bằng 0 ---
    z = np.array([2.0, 1.0])
    p = np.exp(z - z.max()) / np.exp(z - z.max()).sum()
    g = p.copy()
    g[1] -= 1.0
    eps = 1e-6
    num = np.zeros(2)
    for i in range(2):
        zp, zm = z.copy(), z.copy()
        zp[i] += eps
        zm[i] -= eps
        num[i] = (lse_loss(zp, 1, np.float64) - lse_loss(zm, 1, np.float64)) / (2 * eps)
    assert np.allclose(g, num, atol=1e-5) and math.isclose(g.sum(), 0.0, abs_tol=1e-7)
    js = js_calc("cross_entropy_logsumexp", preset="normal")
    assert np.allclose(js["grad"], g, atol=1e-6) and np.allclose(js["gradNaive"], g, atol=1e-6)

    # Gradient Naive hỏng thành NaN ở mọi tình huống lỗi, còn gradient LSE hữu hạn
    for preset in ("underflow", "overflow", "fp16_overflow", "fp16_underflow"):
        js = js_calc("cross_entropy_logsumexp", preset=preset)
        assert all(v is None for v in js["gradNaive"]), preset
        assert all(v is not None for v in js["grad"]), preset
    assert js_calc("cross_entropy_logsumexp", preset="underflow")["grad"] == [1, -1]

    # --- Đường B (Softmax an toàn rồi ln): numpy độc lập, đối chiếu JS ---
    def safe_then_log(z, y, dt):
        z = np.array(z, dtype=dt)
        with np.errstate(all="ignore"):
            e = np.exp(z - z.max())
            p = (e / e.sum(dtype=dt)).astype(dt)
            return float(-np.log(p[y]))
    assert math.isclose(safe_then_log([100.0, 99.0], 0, np.float32), 0.31326, rel_tol=1e-4), "Trừ max cứu được tràn số"
    assert safe_then_log([0.0, -110.0], 1, np.float32) == math.inf, "Trừ max KHÔNG cứu được hụt số"
    assert safe_then_log([0.0, -20.0], 1, np.float16) == math.inf
    assert math.isclose(safe_then_log([12.0, 11.0], 0, np.float16), 0.3135, abs_tol=2e-3)
    for preset in ("normal", "overflow", "underflow", "fp16_overflow", "fp16_underflow"):
        dt, z, y = cases[preset]
        js = js_calc("cross_entropy_logsumexp", preset=preset)
        ref = safe_then_log(z, y, dt)
        if math.isinf(ref):
            assert js["lossSafeLog"] is None and js["safeBroken"] is True, preset
        else:
            assert abs(js["lossSafeLog"] - ref) < 2e-3 and js["safeBroken"] is False, preset
        assert [r["ok"] for r in js["routes"]][2] is True, "Đường C (LSE) luôn thành công"

    # --- Công thức hiển thị phải mang đúng số liệu (so với numpy) ---
    F = js_calc("cross_entropy_logsumexp", preset="normal")["formulas"]
    e = np.exp(np.array([2.0, 1.0], dtype=np.float32))
    assert f"{e[0]:.4f}" in F["softmaxNaive"] and f"{e[1]:.4f}" in F["softmaxNaive"]
    assert f"{e.sum():.3f}" in F["softmaxNaive"]
    assert "2.3133" in F["lse"] and "1.3133" in F["lossC"] and "0.73106" in F["grad"]
    Fu = js_calc("cross_entropy_logsumexp", preset="underflow")["formulas"]
    assert "-\\ln(0) = \\infty" in Fu["lossA"] and "= 110" in Fu["lossC"]
    Fo = js_calc("cross_entropy_logsumexp", preset="overflow")["formulas"]
    assert "\\text{NaN}" in Fo["lossA"] and "\\infty" in Fo["softmaxNaive"]

    # --- FP32 vs FP16: cùng logit [12, 11] chỉ hỏng ở FP16 ---
    assert naive_loss([12.0, 11.0], 0, np.float32)[0] == naive_loss([12.0, 11.0], 0, np.float32)[0] > 0
    assert math.isnan(naive_loss([12.0, 11.0], 0, np.float16)[0])
    js = js_calc("cross_entropy_logsumexp", state={"z0": 12.0, "z1": 11.0, "y": 0, "mode": "naive", "precision": "fp32"})
    assert js["naiveBroken"] is False and abs(js["lossNaive"] - 0.31326) < 1e-4


def naive_grad(z, y, dt, shift=False):
    """Chuỗi đạo hàm ngược qua -ln(p_y), p = e / S, e = exp(z - m?), bằng kiểu số thật của numpy."""
    z = np.array(z, dtype=dt)
    with np.errstate(all="ignore"):
        if shift:
            z = (z - z.max()).astype(dt)
        e = np.exp(z).astype(dt)
        s = e.sum(dtype=dt)
        py = (e[y] / s).astype(dt)
        gp = dt(-1) / py
        ds = (gp * -(e[y] / (s * s))).astype(dt)
        de = np.array([(gp if i == y else dt(0)) / s + ds for i in range(len(z))], dtype=dt)
        return (e * de).astype(dt)


def main_backward() -> None:
    """Chiều ngược: điểm hỏng chung với chiều xuôi, đối chiếu numpy float32/float16."""
    cases = [([2.0, 1.0], 1, "fp32", np.float32), ([0.0, -110.0], 1, "fp32", np.float32),
             ([100.0, 99.0], 0, "fp32", np.float32), ([12.0, 11.0], 0, "fp16", np.float16),
             ([0.0, -20.0], 1, "fp16", np.float16), ([12.0, 11.0], 0, "fp32", np.float32)]
    for z, y, prec, dt in cases:
        js = js_calc("cross_entropy_logsumexp", state={"z0": z[0], "z1": z[1], "y": y, "mode": "naive", "precision": prec})
        for idx, shift in ((0, False), (1, True)):
            want = naive_grad(z, y, dt, shift)
            got = js["routes"][idx]["grad"]
            for w, g in zip(want, got):
                if np.isfinite(w):
                    assert g is not None and abs(g - float(w)) < 2e-3, (z, prec, idx, w, g)
                else:
                    assert g is None, (z, prec, idx, w, g)  # NaN/Inf được JSON ghi thành null
        # đường C: luôn hữu hạn và bằng softmax - one-hot
        gC = js["routes"][2]["grad"]
        assert all(g is not None for g in gC)
        assert abs(sum(gC)) < 2e-3
    # điểm hỏng chung: underflow -> p_y = 0 (xuôi) và dL/dp_y = -inf (ngược) ở cùng bước
    js = js_calc("cross_entropy_logsumexp", preset="underflow")
    A = js["routes"][0]["steps"]
    assert A[2]["level"] == "bad" and A[2]["back"]["level"] == "bad"
    assert js["routes"][2]["grad"] == [1, -1]


if __name__ == "__main__":
    main()
    main_backward()
    print("✓ ĐẠT CHUẨN")
