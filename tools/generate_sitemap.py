#!/usr/bin/env python3
"""PLAYNOVA sitemap regenerator — reads assets/js/registry.json, writes sitemap.xml.
Usage: python3 tools/generate_sitemap.py   (run from project root)"""
import json, datetime, os
BASE = "https://sakibhtml323-source.github.io/PLAYNOVA"
REG = json.load(open("assets/js/registry.json"))
cats = sorted(set(g["category"] for g in REG))
TODAY = datetime.date.today().isoformat()
urls = [""] + ["games/","categories/","popular/","new/","favorites/","recent/"] + \
       ["category/" + c.lower().replace(" ","-") + "/" for c in cats] + \
       ["about/","contact/","privacy/","terms/","cookies/","disclaimer/"] + \
       ["game/" + g["slug"] + "/" for g in REG]
sm = ['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in urls:
    pr = "1.0" if u=="" else ("0.8" if u.startswith("game/") else "0.7")
    cf = "weekly" if u.startswith("game/") else "monthly"
    sm.append("<url><loc>" + BASE + "/" + u + "</loc><lastmod>" + TODAY + "</lastmod><changefreq>" + cf + "</changefreq><priority>" + pr + "</priority></url>")
sm.append("</urlset>")
open("sitemap.xml","w").write("\n".join(sm))
missing = [u for u in urls if u and not os.path.exists(os.path.join(u.rstrip("/"),"index.html"))]
print("sitemap regenerated:", len(urls), "URLs | missing files:", missing)
