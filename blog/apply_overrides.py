"""Apply positioning-rule overrides to blog POSTS at build time.

Why this file exists: blog/build.py is pushed to GitHub through the
push_files API, which cannot carry build.py's full ~150KB in one call.
Post bodies/descriptions that carry the founder's positioning rule
("AR (Augmented Reality)" wording, never "3D models" for what ARQR360
delivers) live in overrides_p1.py / overrides_p2.py instead, and this
file splices them into POSTS before build() runs. The new-post queue
(EXTRA_POSTS) also lives there. To add a post, append its dict to
EXTRA_POSTS in the next overrides part file; to fix wording, edit the
override dicts. Never edit generated blog/*/index.html by hand.
"""
import os

_HERE = os.path.dirname(os.path.abspath(__file__))
_BODY = {}
_DESC = {}
_EXTRA = []
_TITLE = {}
_LINKS = {}
for _part in ("overrides_p1", "overrides_p2", "overrides_p3", "overrides_p4", "overrides_p5", "overrides_p6", "overrides_p7", "overrides_p8", "overrides_p9", "overrides_p10", "overrides_p11", "overrides_p12", "overrides_p13", "overrides_p14", "overrides_p15", "overrides_p16", "overrides_p17", "overrides_p18", "overrides_p19", "overrides_p20", "overrides_p21", "overrides_p22", "overrides_p23", "overrides_p24", "overrides_p25", "overrides_p26", "overrides_p27", "overrides_p28", "overrides_p29", "overrides_p30", "overrides_p31", "overrides_p32", "overrides_p33", "overrides_p34", "overrides_p35", "overrides_p36", "overrides_p37", "overrides_p38"):
    _spec_path = os.path.join(_HERE, _part + ".py")
    with open(_spec_path) as _f:
        _ns = {}
        exec(compile(_f.read(), _spec_path, "exec"), _ns)
    _BODY.update(_ns["BODY_OVERRIDES"])
    _DESC.update(_ns["DESC_OVERRIDES"])
    _EXTRA.extend(_ns["EXTRA_POSTS"])
    _TITLE.update(_ns.get("TITLE_OVERRIDES", {}))
    _LINKS.update(_ns.get("LINK_INSERTS", {}))

for _p in POSTS:
    _s = _p.get("slug")
    if _s in _BODY:
        _p["body"] = _BODY[_s]
    if _s in _DESC:
        _p["description"] = _DESC[_s]
    if _s in _TITLE:
        _p["title"] = _TITLE[_s]
POSTS.extend(_EXTRA)

# LINK INSERTS (internal-link retrofit, added 2026-10-22 for the
# rugs-first SEO push): LINK_INSERTS maps a slug to ONE unique paragraph
# that is spliced into the body just before the FAQ, so it reads as part
# of the article. Guarded twice: an article that already links to the
# paragraph's target keeps its existing link, and the same paragraph is
# never inserted twice.
for _p in POSTS:
    _s = _p.get("slug")
    if _s in _LINKS:
        _para = _LINKS[_s]
        _b = _p.get("body", "")
        _href_at = _para.find('href="')
        _target = _para[_href_at + 6:_para.find('"', _href_at + 6)] if _href_at > -1 else ""
        if _para not in _b and (not _target or _target not in _b):
            _at = _b.find('<div class="faq">')
            if _at < 0:
                _at = _b.find('<h2>The cheapest way')
            if _at >= 0:
                _p["body"] = _b[:_at] + _para + "\n" + _b[_at:]
            else:
                _p["body"] = _b + "\n" + _para

# BLOG SITEMAP (added 2026-10-22): robots.txt has pointed at
# /blog/sitemap.xml since the site launched, but nothing ever generated
# it and the URL 404'd. Regenerate it on every build from the final
# POSTS list so it can never drift from the published articles again.
try:
    import datetime as _dt
    def _iso_date(_dstr):
        try:
            return _dt.datetime.strptime(_dstr, "%B %d, %Y").date().isoformat()
        except Exception:
            return _dt.date.today().isoformat()
    _sm = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
           '  <url>\n    <loc>https://arqr360.com/blog</loc>\n    <lastmod>'
           + _dt.date.today().isoformat() + '</lastmod>\n    <priority>0.8</priority>\n  </url>']
    for _p in POSTS:
        _sm.append('  <url>\n    <loc>https://arqr360.com/blog/' + _p["slug"]
                   + '</loc>\n    <lastmod>' + _iso_date(_p.get("date", ""))
                   + '</lastmod>\n    <priority>0.6</priority>\n  </url>')
    _sm.append('</urlset>')
    with open(os.path.join(_HERE, "sitemap.xml"), "w") as _f:
        _f.write("\n".join(_sm) + "\n")
except Exception:
    pass

# BLOG-IMAGES RULE (founder order 2026-10-07): every article carries images.
# build.py is too large to push via the API, so the figure CSS is injected
# here into the article TEMPLATE at build time.
_IMG_CSS = ".postimg{{margin:34px 0}}.postimg img{{width:100%;height:auto;border-radius:14px;border:1px solid var(--line);display:block}}.postimg figcaption{{font-size:14px;color:var(--soft);margin-top:10px;text-align:center}}"
try:
    if "TEMPLATE" in dir() and "</style>" in TEMPLATE and "postimg" not in TEMPLATE:
        TEMPLATE = TEMPLATE.replace("</style>", _IMG_CSS + "</style>", 1)
except NameError:
    pass
