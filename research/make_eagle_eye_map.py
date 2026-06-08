#!/usr/bin/env python3
"""
Generate a location map of the Eagle Eye detachment-fault corridor target
(west of Browns Canyon Wash) in the Harquahala Mountains, Arizona.

Data provenance:
  * Mine points  -> USGS MRDS (surveyed lat/long).
  * Landmark points (canyons, summit) -> USGS GNIS (via Wikidata), surveyed.
  * Detachment trace + target corridor -> APPROXIMATE / INTERPRETIVE, sketched
    from the verbal description in USGS Bulletin 1701-C (DeWitt et al., 1988):
    "...the Eagle Eye detachment fault trends north from Arrastre Gulch along
    Browns Canyon Wash to Dushey Canyon", with the prospective detachment-style
    ground lying WEST of Browns Canyon Wash. NOT digitized from the map plate.

Outputs: research/harquahala_eagle_eye_target.png and .kml
"""
import math
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MplPolygon
from matplotlib.lines import Line2D

R = 6378137.0  # Web Mercator sphere radius (m)

def merc(lon, lat):
    x = R * math.radians(lon)
    y = R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    return x, y

# ---------------------------------------------------------------- data
mines = {  # name: (lat, lon, range)
    "Bonanza / Harqua Hala": (33.66756, -113.59077, "little"),
    "Golden Eagle":          (33.68256, -113.58383, "little"),
    "Rio del Monte":         (33.71256, -113.59747, "little"),
    "Hercules":              (33.77028, -113.55000, "margin"),
    "Socorro":               (33.74506, -113.47021, "main"),
    "San Marcos":            (33.78284, -113.47994, "main"),
    "Hidden Treasure":       (33.75006, -113.42966, "main"),
}
landmarks = {  # name: (lat, lon, kind)
    "Arrastre Gulch":     (33.76528, -113.27472, "canyon"),
    "Browns Canyon Wash": (33.78056, -113.22639, "canyon"),
    "Dushey Canyon":      (33.88861, -113.28167, "canyon"),
    "Blue Tank Canyon":   (33.73226, -113.29158, "canyon"),
    "Harquahala Mtn (5,681 ft)": (33.81170, -113.36381, "peak"),
}

# Eagle Eye detachment trace (interpretive N-trending polyline through the
# three GNIS canyon points, smoothed slightly to a continuous fault trace).
detach_trace = [
    (33.755, -113.272),   # just S of Arrastre Gulch
    (33.765, -113.270),   # Arrastre Gulch
    (33.781, -113.258),   # bend toward Browns Canyon Wash
    (33.800, -113.250),
    (33.825, -113.255),
    (33.855, -113.268),
    (33.889, -113.282),   # Dushey Canyon
    (33.905, -113.288),   # continues N
]

# Target corridor polygon: prospective detachment-style ground WEST of Browns
# Canyon Wash (Bull. 1701-C "Area 5/8"). Approximate, ~3-4 km wide, ~12 km long.
target_corridor = [
    (33.770, -113.288),
    (33.770, -113.258),
    (33.800, -113.250),
    (33.835, -113.255),
    (33.870, -113.272),
    (33.870, -113.300),
    (33.835, -113.292),
    (33.800, -113.285),
]

# Field find: gossan-type iron-stained silica rock (user-reported location).
finds = {
    "Gossan float find\n(iron-oxide + silica, vuggy)": (33.78121, -113.27894),
}

# Buried-pluton geophysical footprint (schematic ellipse ~ centered on Blue Tank).
pluton_center = (33.745, -113.300)
pluton_rx, pluton_ry = 0.085, 0.075  # deg (schematic, ~ tens of km^2 footprint)

# ---------------------------------------------------------------- figure
fig, ax = plt.subplots(figsize=(12.5, 10.5))

# pluton ellipse (schematic)
ell = [merc(pluton_center[1] + pluton_rx * math.cos(t),
            pluton_center[0] + pluton_ry * math.sin(t))
       for t in [i * 2 * math.pi / 100 for i in range(101)]]
ax.add_patch(MplPolygon(ell, closed=True, facecolor="#9b59b6", alpha=0.12,
                        edgecolor="#7d3c98", lw=1.4, ls=(0, (5, 3)), zorder=2))
ax.text(*merc(-113.300, 33.700), "buried pluton\n(aeromag+gravity high,\n~50 mi², ≤2.5 mi deep)",
        color="#6c3483", fontsize=8, ha="center", va="top", style="italic", zorder=6)

# target corridor polygon
poly_xy = [merc(lon, lat) for lat, lon in target_corridor]
ax.add_patch(MplPolygon(poly_xy, closed=True, facecolor="#e74c3c", alpha=0.22,
                        edgecolor="#c0392b", lw=2.0, hatch="///", zorder=3))
tc_lat = sum(p[0] for p in target_corridor) / len(target_corridor)
tc_lon = sum(p[1] for p in target_corridor) / len(target_corridor)
ax.annotate("TARGET 2\nEagle Eye detachment corridor\n(W of Browns Canyon Wash)\nAu-Ag-Cu-Mn-Ba, under gravel",
            xy=merc(tc_lon, tc_lat), xytext=merc(-113.175, 33.700),
            color="#922b21", fontsize=9.5, fontweight="bold", ha="right", va="center",
            bbox=dict(boxstyle="round,pad=0.3", fc="white", ec="#922b21", alpha=0.85),
            arrowprops=dict(arrowstyle="->", color="#922b21", lw=1.6), zorder=11)

# detachment fault trace (teeth on hanging-wall/upper-plate side = NE)
tr = [merc(lon, lat) for lat, lon in detach_trace]
ax.plot([p[0] for p in tr], [p[1] for p in tr], color="#1b4f72", lw=3.0, zorder=4)
ax.plot([p[0] for p in tr], [p[1] for p in tr], color="#1b4f72", lw=3.0, zorder=4,
        label="_nolegend_")
ax.text(*merc(-113.243, 33.905), "Eagle Eye\ndetachment fault\n(low-angle normal,\ntop-to-NE, ~21–14 Ma)",
        color="#1b4f72", fontsize=8.5, ha="left", va="top", fontweight="bold", zorder=6)

# field find(s)
for name, (lat, lon) in finds.items():
    x, y = merc(lon, lat)
    ax.scatter(x, y, s=320, marker="*", color="#f1c40f", edgecolor="k",
               linewidth=1.3, zorder=12)
    ax.annotate(name, xy=(x, y), xytext=merc(-113.345, 33.875),
                color="#7d6608", fontsize=9, fontweight="bold", ha="center", va="center",
                bbox=dict(boxstyle="round,pad=0.3", fc="#fef9e7", ec="#b7950b", alpha=0.92),
                arrowprops=dict(arrowstyle="->", color="#7d6608", lw=1.6), zorder=12)

# mines
mcolors = {"main": "#117a65", "little": "#b9770e", "margin": "#566573"}
for name, (lat, lon, rng) in mines.items():
    x, y = merc(lon, lat)
    ax.scatter(x, y, s=70, marker="^", color=mcolors[rng], edgecolor="k",
               linewidth=0.7, zorder=8)
    dx = 1500 if lon > -113.5 else 1500
    ax.text(x + 1400, y + 300, name, fontsize=8, zorder=8, color="k")

# landmarks
for name, (lat, lon, kind) in landmarks.items():
    x, y = merc(lon, lat)
    if kind == "peak":
        ax.scatter(x, y, s=120, marker="*", color="#7b241c", edgecolor="k",
                   linewidth=0.6, zorder=8)
    else:
        ax.scatter(x, y, s=34, marker="o", color="white", edgecolor="#1b2631",
                   linewidth=1.1, zorder=8)
    ax.text(x + 900, y - 1400, name, fontsize=7.5, style="italic",
            color="#2c3e50", zorder=8)

# ---------------------------------------------------------------- extent
lons = [-113.62, -113.16]
lats = [33.655, 33.915]
x0, y0 = merc(lons[0], lats[0])
x1, y1 = merc(lons[1], lats[1])
ax.set_xlim(x0, x1)
ax.set_ylim(y0, y1)
ax.set_aspect("equal")

# basemap (terrain); fall back gracefully if tiles unreachable
basemap_ok = False
try:
    import contextily as cx
    cx.add_basemap(ax, source=cx.providers.OpenTopoMap, zoom=11,
                   attribution_size=6)
    basemap_ok = True
except Exception as e:
    print("basemap failed, using plain background:", e)
    ax.set_facecolor("#f4f1ea")

# lat/long graticule
import numpy as np
for lon in np.arange(-113.6, -113.15, 0.1):
    xx, _ = merc(lon, lats[0])
    ax.axvline(xx, color="0.6", lw=0.4, ls=":", zorder=1)
    ax.text(xx, y0 + 400, f"{abs(lon):.1f}°W", fontsize=6.5, color="0.35",
            ha="center", va="bottom", zorder=9)
for lat in np.arange(33.7, 33.92, 0.05):
    _, yy = merc(lons[0], lat)
    ax.axhline(yy, color="0.6", lw=0.4, ls=":", zorder=1)
    ax.text(x0 + 400, yy, f"{lat:.2f}°N", fontsize=6.5, color="0.35",
            ha="left", va="bottom", zorder=9)

# scale bar (10 km)
km = 10000.0
sx = x0 + (x1 - x0) * 0.06
sy = y0 + (y1 - y0) * 0.06
# Web Mercator scale distortion ~ 1/cos(lat); correct at map mid-lat
scale_corr = math.cos(math.radians(33.78))
bar = km / scale_corr
ax.plot([sx, sx + bar], [sy, sy], color="k", lw=3, zorder=10)
ax.text(sx + bar / 2, sy + 700, "10 km", fontsize=8, ha="center", fontweight="bold", zorder=10)

# north arrow
nx = x1 - (x1 - x0) * 0.05
ny = y0 + (y1 - y0) * 0.12
ax.annotate("N", xy=(nx, ny), xytext=(nx, ny - (y1 - y0) * 0.06),
            arrowprops=dict(arrowstyle="->", lw=2, color="k"),
            ha="center", fontsize=12, fontweight="bold", zorder=10)

# legend
leg = [
    Line2D([0], [0], color="#1b4f72", lw=3, label="Eagle Eye detachment (approx. trace)"),
    MplPolygon([(0, 0)], facecolor="#e74c3c", alpha=0.25, edgecolor="#c0392b",
               hatch="///", label="Detachment-corridor target (approx.)"),
    MplPolygon([(0, 0)], facecolor="#9b59b6", alpha=0.15, edgecolor="#7d3c98",
               ls="--", label="Buried pluton geophys. footprint (schematic)"),
    Line2D([0], [0], marker="^", color="w", markerfacecolor="#117a65",
           markeredgecolor="k", markersize=10, label="Mine – main Harquahala range"),
    Line2D([0], [0], marker="^", color="w", markerfacecolor="#b9770e",
           markeredgecolor="k", markersize=10, label="Mine – Little Harquahala range"),
    Line2D([0], [0], marker="^", color="w", markerfacecolor="#566573",
           markeredgecolor="k", markersize=10, label="Mine – range margin"),
    Line2D([0], [0], marker="o", color="w", markerfacecolor="white",
           markeredgecolor="#1b2631", markersize=8, label="GNIS landmark (surveyed)"),
    Line2D([0], [0], marker="*", color="w", markerfacecolor="#7b241c",
           markeredgecolor="k", markersize=13, label="Range high point"),
    Line2D([0], [0], marker="*", color="w", markerfacecolor="#f1c40f",
           markeredgecolor="k", markersize=15, label="Gossan float find (field)"),
]
ax.legend(handles=leg, loc="lower right", fontsize=7.8, framealpha=0.92,
          title="Legend", title_fontsize=8.5)

ax.set_title("Eagle Eye Detachment Corridor Target — Harquahala Mountains, Arizona\n"
             "west of Browns Canyon Wash (USGS Bull. 1701-C 'Area 5/8')",
             fontsize=13, fontweight="bold")
ax.set_xticks([]); ax.set_yticks([])

cap = ("Mine points: USGS MRDS (surveyed). Canyon/summit points: USGS GNIS (surveyed). "
       "Detachment trace, target corridor and pluton footprint are APPROXIMATE / "
       "INTERPRETIVE — sketched from the verbal description in USGS Bulletin 1701-C "
       "(DeWitt et al., 1988), NOT digitized from the map plate. For orientation only; "
       "verify against the published geologic map plate and field mapping before use.")
fig.text(0.5, 0.012, cap, ha="center", va="bottom", fontsize=7, color="0.25", wrap=True)

fig.subplots_adjust(left=0.03, right=0.985, top=0.93, bottom=0.06)
fig.savefig("research/harquahala_eagle_eye_target.png", dpi=170)
print("wrote research/harquahala_eagle_eye_target.png  (basemap:", basemap_ok, ")")

# ---------------------------------------------------------------- KML
def kml_coords(seq):  # seq of (lat,lon) -> lon,lat,0
    return " ".join(f"{lon},{lat},0" for lat, lon in seq)

kml = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>',
       '<name>Harquahala - Eagle Eye detachment corridor target</name>',
       '<Style id="trace"><LineStyle><color>ff724f1b</color><width>4</width></LineStyle></Style>',
       '<Style id="target"><LineStyle><color>ff3b27c0</color><width>3</width></LineStyle>'
       '<PolyStyle><color>3a3b27c0</color></PolyStyle></Style>',
       '<Style id="pluton"><LineStyle><color>ff983c7d</color><width>2</width></LineStyle>'
       '<PolyStyle><color>20983c7d</color></PolyStyle></Style>']
kml.append(f'<Placemark><name>Eagle Eye detachment fault (approx. trace)</name>'
           f'<styleUrl>#trace</styleUrl><LineString><tessellate>1</tessellate>'
           f'<coordinates>{kml_coords(detach_trace)}</coordinates></LineString></Placemark>')
kml.append(f'<Placemark><name>Detachment-corridor target (approx., W of Browns Canyon Wash)</name>'
           f'<styleUrl>#target</styleUrl><Polygon><outerBoundaryIs><LinearRing>'
           f'<coordinates>{kml_coords(target_corridor + [target_corridor[0]])}</coordinates>'
           f'</LinearRing></outerBoundaryIs></Polygon></Placemark>')
ell_ll = [(pluton_center[0] + pluton_ry * math.sin(t),
           pluton_center[1] + pluton_rx * math.cos(t))
          for t in [i * 2 * math.pi / 72 for i in range(73)]]
kml.append(f'<Placemark><name>Buried pluton geophysical footprint (schematic)</name>'
           f'<styleUrl>#pluton</styleUrl><Polygon><outerBoundaryIs><LinearRing>'
           f'<coordinates>{kml_coords(ell_ll)}</coordinates></LinearRing></outerBoundaryIs>'
           f'</Polygon></Placemark>')
for name, (lat, lon, _r) in mines.items():
    kml.append(f'<Placemark><name>{name} (mine, MRDS)</name>'
               f'<Point><coordinates>{lon},{lat},0</coordinates></Point></Placemark>')
for name, (lat, lon, _k) in landmarks.items():
    kml.append(f'<Placemark><name>{name} (GNIS)</name>'
               f'<Point><coordinates>{lon},{lat},0</coordinates></Point></Placemark>')
for name, (lat, lon) in finds.items():
    label = name.replace("\n", " ")
    kml.append(f'<Placemark><name>FIELD FIND: {label}</name>'
               f'<Point><coordinates>{lon},{lat},0</coordinates></Point></Placemark>')
kml.append('</Document></kml>')
with open("research/harquahala_eagle_eye_target.kml", "w") as f:
    f.write("\n".join(kml))
print("wrote research/harquahala_eagle_eye_target.kml")
