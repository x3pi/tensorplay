#!/usr/bin/env python3
"""
tools/renumber.py
Script cập nhật tự động toàn bộ số thứ tự bài học trong TensorPlay.
Ánh xạ cố định theo `id` của bài, cập nhật:
1. examples/catalog.json (order 1..34, title Bài NN:)
2. <title> trong các file .html
3. Comment đầu các file .logic.js
4. Tham chiếu chéo dạng 'Bài XX' trong các file nội dung (chỉ áp dụng cho 31 bài cũ)
5. index.html và README.md
"""

import os
import re
import json
from pathlib import Path

ROOT = Path("/mnt/2d4726e7-046b-47c7-b9a9-d2a9cc0cfc8d/Work/tensorplay")

# Bảng ánh xạ ID bài học -> Thứ tự mới (1..34)
TARGET_ORDER = [
  # Track 0 (01 - 10)
  ("bai_01_robot_vision", 1),
  ("bai_02_softmax_loss", 2),
  ("bai_03_softmax_regression", 3),
  ("cross_entropy_logsumexp", 4),
  ("bai_04_twolayer_relu_backprop", 5),
  ("bai_05_minibatch_sgd", 6),
  ("bai_06a_cpp_matmul_loops", 7),
  ("bai_03b_memory_leak", 8),
  ("bai_03_cache_locality", 9),
  ("strides_views", 10),
  # Track 1 (11 - 14)
  ("bai_04_autograd_graph", 11),
  ("bai_05_reverse_vs_forward_ad", 12),
  ("broadcast_grad", 13),
  ("gradient_check", 14),
  # Track 2 (15 - 23)
  ("bai_06_activation_valves", 15),
  ("kaiming_init", 16),
  ("optimizers", 17),
  ("adamw_weight_decay", 18),
  ("bai_09_batch_norm_dynamics", 19),
  ("dropout", 20),
  ("layernorm_residual", 21),
  ("bai_08_conv2d_im2col", 22),
  ("bai_07_minibatch_assembly", 23),
  # Track 3 (24 - 28)
  ("bai_10_cuda_threads", 24),
  ("bai_11_shared_memory_tiling", 25),
  ("bai_12_coalescing_and_banks", 26),
  ("mixed_precision", 27),
  ("activation_checkpointing", 28),
  # Track 4 (29 - 34)
  ("rnn_bptt", 29),
  ("bai_13_self_attention", 30),
  ("positional_encoding", 31),
  ("multi_head_attention", 32),
  ("bai_14_kv_cache_anatomy", 33),
  ("bai_15_flash_attention_concept", 34),
]

ID_TO_NEW_ORDER = dict(TARGET_ORDER)
NEW_FILES = {"cross_entropy_logsumexp", "adamw_weight_decay", "activation_checkpointing"}

def pad(n):
    return f"{n:02d}"

def update_catalog():
    cat_path = ROOT / "examples" / "catalog.json"
    with open(cat_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    valid_entries = [e for e in catalog if e["id"] in ID_TO_NEW_ORDER]
    assert len(valid_entries) == len(TARGET_ORDER), f"Thiếu bài trong catalog: {len(valid_entries)} vs {len(TARGET_ORDER)}"

    for entry in valid_entries:
        new_order = ID_TO_NEW_ORDER[entry["id"]]
        entry["order"] = new_order
        entry["title"] = re.sub(r"^Bài\s+\d+:\s*", f"Bài {pad(new_order)}: ", entry["title"])

    valid_entries.sort(key=lambda x: x["order"])

    with open(cat_path, "w", encoding="utf-8") as f:
        json.dump(valid_entries, f, ensure_ascii=False, indent=2)
    print(f"✓ Đã cập nhật examples/catalog.json ({len(valid_entries)} bài, order 1..{len(valid_entries)})")
    return valid_entries

def update_html_and_logic(catalog):
    for entry in catalog:
        new_num = pad(entry["order"])
        rel_path = entry["path"].replace("./", "")
        html_file = ROOT / rel_path
        if not html_file.exists():
            print(f"⚠️ Không tìm thấy file html: {html_file}")
            continue

        # 1. Update <title> in html
        html_content = html_file.read_text(encoding="utf-8")
        new_html = re.sub(r"<title>Bài\s+\d+:\s*(.*?)</title>", f"<title>Bài {new_num}: \\1</title>", html_content)
        if new_html != html_content:
            html_file.write_text(new_html, encoding="utf-8")
            print(f"✓ Updated <title> in {html_file.name} -> Bài {new_num}:")

        # 2. Update logic.js
        logic_path = html_file.with_suffix(".logic.js")
        if logic_path.exists():
            logic_content = logic_path.read_text(encoding="utf-8")
            new_logic = re.sub(r"\*\s+Bài\s+\d+:\s*(.*)", f"* Bài {new_num}: \\1", logic_content)
            if new_logic != logic_content:
                logic_path.write_text(new_logic, encoding="utf-8")
                print(f"✓ Updated comment in {logic_path.name} -> * Bài {new_num}:")

def update_index_and_readme():
    idx_path = ROOT / "index.html"
    if idx_path.exists():
        txt = idx_path.read_text(encoding="utf-8")
        txt = re.sub(r"Bài\s+01\s*→\s*\d+", "Bài 01 → 34", txt)
        txt = re.sub(r"\b\d+\s+bài\b", "34 bài", txt)
        idx_path.write_text(txt, encoding="utf-8")
        print("✓ Đã cập nhật index.html (Bài 01 → 34)")

    readme_path = ROOT / "README.md"
    if readme_path.exists():
        txt = readme_path.read_text(encoding="utf-8")
        txt = re.sub(r"Bài\s+01\s*→\s*\d+", "Bài 01 → 34", txt)
        txt = re.sub(r"\b31\s+bài\b", "34 bài", txt)
        txt = re.sub(r"Track\s+0:.*Bài\s+01.*", "Track 0: Nền Tảng Tensor & Bộ Nhớ C++ (Bài 01 → 10)", txt)
        txt = re.sub(r"Track\s+1:.*Bài\s+\d+.*", "Track 1: Autograd Engine & Đạo Hàm (Bài 11 → 14)", txt)
        txt = re.sub(r"Track\s+2:.*Bài\s+\d+.*", "Track 2: Khối Mạng & Tối Ưu Hóa (Bài 15 → 23)", txt)
        txt = re.sub(r"Track\s+3:.*Bài\s+\d+.*", "Track 3: GPU & CUDA Architecture (Bài 24 → 28)", txt)
        txt = re.sub(r"Track\s+4:.*Bài\s+\d+.*", "Track 4: Transformer & Hệ Thống LLM (Bài 29 → 34)", txt)
        readme_path.write_text(txt, encoding="utf-8")
        print("✓ Đã cập nhật README.md (34 bài)")

def main():
    print("=== BẮT ĐẦU ĐÁNH SỐ LẠI TENSORPLAY (34 BÀI) ===")
    catalog = update_catalog()
    update_html_and_logic(catalog)
    update_index_and_readme()
    print("=== HOÀN TẤT ĐÁNH SỐ LẠI TOÀN BỘ ===")

if __name__ == "__main__":
    main()
