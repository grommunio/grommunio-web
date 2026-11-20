#!/usr/bin/env python3
# SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Narrows a monospace font by shrinking both side bearings by D units and
# drops its hinting. FiraMono-Regular.woff2 is the upstream file run as
#   narrow-monospace-font.py FiraMono-Regular.woff2 out.woff2 30
# Needs fonttools and brotli.
import sys
from fontTools.ttLib import TTFont
src, dst, D = sys.argv[1], sys.argv[2], int(sys.argv[3])
f = TTFont(src)
glyf, hmtx = f['glyf'], f['hmtx'].metrics
for table in ('fpgm', 'prep', 'cvt '):
    if table in f:
        del f[table]
for name in f.getGlyphOrder():
    glyf[name].expand(glyf)
    glyf[name].removeHinting()
for name in f.getGlyphOrder():
    g = glyf[name]
    adv, lsb = hmtx[name]
    if g.numberOfContours > 0:  # simple outline; composites follow their (moved) bases
        g.coordinates.translate((-D, 0))
    if g.numberOfContours != 0:
        g.recalcBounds(glyf)
        lsb = g.xMin
    hmtx[name] = (adv - 2 * D if adv > 0 else adv, lsb)
other = set()
def shift(anchor):
    if anchor is not None:
        anchor.XCoordinate -= D
for lookup in f['GPOS'].table.LookupList.Lookup:
    for st in lookup.SubTable:
        t = st.ExtSubTable if lookup.LookupType == 9 else st
        lt = t.LookupType if lookup.LookupType == 9 else lookup.LookupType
        if lt == 4:
            for r in t.MarkArray.MarkRecord: shift(r.MarkAnchor)
            for r in t.BaseArray.BaseRecord: [shift(a) for a in r.BaseAnchor]
        elif lt == 5:
            for r in t.MarkArray.MarkRecord: shift(r.MarkAnchor)
            for lig in t.LigatureArray.LigatureAttach:
                for c in lig.ComponentRecord: [shift(a) for a in c.LigatureAnchor]
        elif lt == 6:
            for r in t.Mark1Array.MarkRecord: shift(r.MarkAnchor)
            for r in t.Mark2Array.Mark2Record: [shift(a) for a in r.Mark2Anchor]
        else:
            other.add(lt)
f['OS/2'].recalcAvgCharWidth(f)
f.flavor = 'woff2'
f.save(dst)
print('other GPOS lookup types left alone:', sorted(other))
