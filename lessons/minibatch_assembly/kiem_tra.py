#!/usr/bin/env python3
"""
lessons/minibatch_assembly/kiem_tra.py
Kiểm chứng số học độc lập bằng NumPy theo quy chuẩn AGENTS.md.
"""
def main() -> None:
    t_cpu_per_sample = 2.0 # ms
    workers = 4
    t_gpu_batch = 10.0 # ms
    batch_size = 16
    t_cpu_batch = (batch_size * t_cpu_per_sample) / workers
    assert t_cpu_batch == 8.0 # ms < 10.0 ms -> GPU saturated

if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
