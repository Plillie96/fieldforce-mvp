#!/usr/bin/env python3
"""Generate PWA PNG icons without third-party deps (pure stdlib)."""
import math
import os
import struct
import zlib


def lerp(a, b, t):
    return a + (b - a) * t


def hex_rgb(h):
    return (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16))


def rounded_rect_contains(x, y, x0, y0, x1, y1, r):
    if x < x0 or x > x1 or y < y0 or y > y1:
        return False
    # corners
    cx = min(max(x, x0 + r), x1 - r)
    cy = min(max(y, y0 + r), y1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def blend(dst, src, a):
    return tuple(int(round(lerp(dst[i], src[i], a))) for i in range(3))


def render(size):
    """Navy tile with a yellow hard hat and a navy check on the dome."""
    s = size
    navy = hex_rgb("#0b2739")
    yellow = hex_rgb("#ffb700")

    px = [[navy for _ in range(s)] for _ in range(s)]
    U = s / 64.0  # design units -> pixels

    dome_cx, dome_cy, dome_r = 32 * U, 42 * U, 15 * U
    ridge = (29 * U, 21 * U, 35 * U, 31 * U, 3 * U)
    brim = (11 * U, 42 * U, 53 * U, 49 * U, 3.5 * U)
    # check: (26,37) -> (30,41) -> (38,33)
    check = (26 * U, 37 * U, 30 * U, 41 * U, 38 * U, 33 * U)
    check_w = 1.8 * U

    for y in range(s):
        for x in range(s):
            col = navy
            in_dome = y <= dome_cy and (x - dome_cx) ** 2 + (y - dome_cy) ** 2 <= dome_r**2
            if in_dome or rounded_rect_contains(x, y, *ridge) or rounded_rect_contains(x, y, *brim):
                col = yellow
                if in_dome:
                    ax, ay, mx, my, bx, by = check
                    d = min(seg_dist(x, y, ax, ay, mx, my), seg_dist(x, y, mx, my, bx, by))
                    if d <= check_w:
                        a = max(0.0, min(1.0, (check_w - d) / (0.9 * U)))
                        col = blend(col, navy, a)
            px[y][x] = col

    return px


def write_png(path, px):
    s = len(px)
    raw = bytearray()
    for y in range(s):
        raw.append(0)
        for x in range(s):
            r, g, b = px[y][x]
            raw += bytes((r, g, b))

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        c += struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        return c

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", s, s, 8, 2, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))


def main():
    out = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
    os.makedirs(out, exist_ok=True)
    for size in (192, 512):
        write_png(os.path.join(out, f"icon-{size}.png"), render(size))
        print("wrote", f"icon-{size}.png")


if __name__ == "__main__":
    main()
