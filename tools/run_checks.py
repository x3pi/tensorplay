#!/usr/bin/env python3
"""
tools/run_checks.py
Chạy kiểm chứng toán học cho tất cả hoặc một tập hợp bài học.

Usage:
  python3 tools/run_checks.py
  python3 tools/run_checks.py --lesson robot_vision
  python3 tools/run_checks.py --path main
  python3 tools/run_checks.py --strict
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
LESSONS_DIR = ROOT_DIR / "lessons"
CURRICULUM_DIR = ROOT_DIR / "curriculum"


def get_all_lesson_slugs():
    """Lấy danh sách slug từ các thư mục con trong lessons/ có kiem_tra.py"""
    if not LESSONS_DIR.exists():
        return []
    slugs = []
    for entry in sorted(LESSONS_DIR.iterdir()):
        if entry.is_dir() and (entry / "kiem_tra.py").exists():
            slugs.append(entry.name)
    return slugs


def get_slugs_for_path(path_id: str):
    """Đọc path từ curriculum/paths/<path_id>.json"""
    path_file = CURRICULUM_DIR / "paths" / f"{path_id}.json"
    if not path_file.exists():
        print(f"Lỗi: Không tìm thấy path {path_file}")
        sys.exit(1)
    with open(path_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("lessons", [])


def run_check_for_lesson(slug: str):
    """Chạy kiem_tra.py của 1 bài học cụ thể"""
    script_path = LESSONS_DIR / slug / "kiem_tra.py"
    if not script_path.exists():
        return False, f"Không tìm thấy {script_path}"

    try:
        res = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=str(LESSONS_DIR / slug),
            capture_output=True,
            text=True,
            check=False,
        )
        return res.returncode == 0, res.stdout + res.stderr
    except Exception as e:
        return False, str(e)


def main():
    parser = argparse.ArgumentParser(description="Chạy kiểm chứng toán học TensorPlay")
    parser.add_argument("--lesson", type=str, help="Slug của bài học cần kiểm tra")
    parser.add_argument("--path", type=str, help="ID của lộ trình cần kiểm tra (ví dụ: main)")
    parser.add_argument("--strict", action="store_true", help="Thoát với mã lỗi nếu có bài thất bại")
    args = parser.parse_args()

    if args.lesson:
        target_slugs = [args.lesson]
    elif args.path:
        target_slugs = get_slugs_for_path(args.path)
    else:
        target_slugs = get_all_lesson_slugs()

    print(f"=== CHẠY KIỂM CHỨNG TOÁN HỌC ({len(target_slugs)} BÀI HỌC) ===")
    passed = 0
    failed = []

    for slug in target_slugs:
        ok, out = run_check_for_lesson(slug)
        if ok:
            passed += 1
            print(f"  ✓ [{slug}] PASS")
        else:
            failed.append((slug, out))
            print(f"  ✗ [{slug}] FAIL")
            if out.strip():
                for line in out.strip().splitlines()[-5:]:
                    print(f"      {line}")

    print("\n" + "=" * 50)
    print(f"KẾT QUẢ: {passed}/{len(target_slugs)} bài đạt yêu cầu.")

    if failed:
        print(f"Thất bại {len(failed)} bài:")
        for slug, _ in failed:
            print(f"  - {slug}")
        if args.strict:
            sys.exit(1)
    else:
        print("Tất cả kiểm chứng toán học đều THÀNH CÔNG! 🎉")


if __name__ == "__main__":
    main()
