#!/usr/bin/env python3
"""
tools/checks_common.py
Cầu nối kiểm chứng: chạy logic.js của một bài bằng Node rồi trả kết quả dạng dict,
để kiem_tra.py so sánh trực tiếp với phép tính độc lập bằng numpy (JS <-> Python parity).

Cách dùng trong lessons/<slug>/kiem_tra.py:
    import sys, pathlib
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "tools"))
    from checks_common import js_calc
    r = js_calc("batch_norm_dynamics", preset="training_standard")
"""
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent

_NODE_SNIPPET = """
const url = process.argv[1];
const spec = JSON.parse(process.argv[2]);
import(url).then(m => {
  const l = new m.LessonLogic();
  let r;
  if (spec.preset) {
    const p = m.PRESETS.find(p => p.id === spec.preset);
    if (!p) throw new Error('Không có preset ' + spec.preset);
    r = l.applyPreset(p.state);
  } else if (spec.state) {
    r = l.applyPreset(spec.state);
  } else {
    r = l.calculate();
  }
  for (const call of spec.calls || []) r = l[call]();
  console.log(JSON.stringify(r));
});
"""


def js_calc(slug, preset=None, state=None, calls=None):
    """Áp dụng preset/state rồi (tùy chọn) gọi các phương thức như stepScan; trả về kết quả calculate()."""
    logic = ROOT / "lessons" / slug / "logic.js"
    spec = json.dumps({"preset": preset, "state": state, "calls": calls or []})
    out = subprocess.run(
        ["node", "--input-type=module", "-e", _NODE_SNIPPET, logic.as_uri(), spec],
        capture_output=True, text=True, check=True, cwd=str(ROOT),
    )
    return json.loads(out.stdout)
