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
    s = size
    g0, g1 = hex_rgb("#1e3a8a"), hex_rgb("#2563eb")
    white = hex_rgb("#ffffff")
    grey = hex_rgb("#cbd5e1")
    green = hex_rgb("#16a34a")
    blue = hex_rgb("#2563eb")
    line_grey = hex_rgb("#94a3b8")

    px = [[(255, 255, 255) for _ in range(s)] for _ in range(s)]
    U = s / 64.0  # design units -> pixels

    # clipboard geometry (design units)
    body = (16 * U, 12 * U, 48 * U, 52 * U, 4 * U)
    clip = (24 * U, 8 * U, 40 * U, 16 * U, 2 * U)
    checks = [
        # (ax,ay,bx,by, midx,midy, color) two-segment check
        (22, 26, 26, 30, 34, 21, green),
        (22, 38, 26, 42, 34, 33, blue),
    ]
    lines = [(37, 24, 42, 24), (37, 36, 42, 36)]

    for y in range(s):
        for x in range(s):
            # background rounded gradient
            if rounded_rect_contains(x, y, 0, 0, s - 1, s - 1, 14 * U):
                t = (x + y) / (2.0 * s)
                col = tuple(int(round(lerp(g0[i], g1[i], t))) for i in range(3))
            else:
                continue  # leave transparent-ish white (icons are on square anyway)

            # clipboard body
            if rounded_rect_contains(x, y, *body):
                col = white
            # clip tab
            if rounded_rect_contains(x, y, *clip):
                col = grey

            # check marks (only over white body)
            aa = 1.6 * U
            for ax, ay, mx, my, en_x, en_y, color in [
                (c[0] * U, c[1] * U, c[2] * U, c[3] * U, c[4] * U, c[5] * U, c[6]) for c in checks
            ]:
                d = min(seg_dist(x, y, ax, ay, mx, my), seg_dist(x, y, mx, my, en_x, en_y))
                if d <= aa:
                    a = max(0.0, min(1.0, (aa - d) / (0.9 * U)))
                    col = blend(col, color, a)
            for lx0, ly0, lx1, ly1 in lines:
                d = seg_dist(x, y, lx0 * U, ly0 * U, lx1 * U, ly1 * U)
                if d <= 1.5 * U:
                    a = max(0.0, min(1.0, (1.5 * U - d) / (0.9 * U)))
                    col = blend(col, line_grey, a)

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
