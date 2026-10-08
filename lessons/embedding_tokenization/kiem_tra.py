#!/usr/bin/env python3
"""
lessons/embedding_tokenization/kiem_tra.py
Cài đặt BPE độc lập (collections.Counter) và đối chiếu với logic.js.
"""
from collections import Counter

TEXT = "aaabdaaabac"
D = 4


def bpe(text, merges):
    tokens = list(text)
    vocab = sorted(set(tokens))
    hist = [(list(tokens), len(vocab))]
    for _ in range(merges):
        pairs = Counter(zip(tokens, tokens[1:]))
        best_count = max(pairs.values())
        if best_count < 2:
            break
        first = {}
        for i, p in enumerate(zip(tokens, tokens[1:])):
            first.setdefault(p, i)
        best = min((p for p, c in pairs.items() if c == best_count), key=lambda p: first[p])
        merged = best[0] + best[1]
        out, i = [], 0
        while i < len(tokens):
            if i < len(tokens) - 1 and (tokens[i], tokens[i + 1]) == best:
                out.append(merged)
                i += 2
            else:
                out.append(tokens[i])
                i += 1
        tokens = out
        vocab.append(merged)
        hist.append((list(tokens), len(vocab)))
    return hist, vocab


def main() -> None:
    hist, vocab = bpe(TEXT, 3)
    assert [len(t) for t, _ in hist] == [11, 9, 7, 5]
    assert [v for _, v in hist] == [4, 5, 6, 7]
    assert hist[-1][0] == ["aaab", "d", "aaab", "a", "c"]
    assert all("".join(t) == TEXT for t, _ in hist), "BPE không được làm mất thông tin"

    # Chi phí attention ~ N^2, bảng embedding ~ V*d
    assert [len(t) ** 2 for t, _ in hist] == [121, 81, 49, 25]
    assert [v * D for _, v in hist] == [16, 20, 24, 28]

    # Tra embedding trên bộ nhớ 1D: offset = id * d
    ids = {t: i for i, t in enumerate(vocab)}
    assert ids["aaab"] == 6 and ids["aaab"] * D == 24
    import numpy as np
    E = np.arange(len(vocab) * D).reshape(len(vocab), D)
    assert list(E.reshape(-1)[24:28]) == list(E[6])

    # Số thật: 50 000 x 4096 x 2 byte
    assert 50000 * 4096 == 204_800_000
    assert abs(50000 * 4096 * 2 / 1e6 - 409.6) < 1e-9


if __name__ == "__main__":
    main()
    print("✓ ĐẠT CHUẨN")
