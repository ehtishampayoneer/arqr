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
for _part in ("overrides_p1", "overrides_p2"):
    _spec_path = os.path.join(_HERE, _part + ".py")
    with open(_spec_path) as _f:
        _ns = {}
        exec(compile(_f.read(), _spec_path, "exec"), _ns)
    _BODY.update(_ns["BODY_OVERRIDES"])
    _DESC.update(_ns["DESC_OVERRIDES"])
    _EXTRA.extend(_ns["EXTRA_POSTS"])

for _p in POSTS:
    _s = _p.get("slug")
    if _s in _BODY:
        _p["body"] = _BODY[_s]
    if _s in _DESC:
        _p["description"] = _DESC[_s]
POSTS.extend(_EXTRA)
