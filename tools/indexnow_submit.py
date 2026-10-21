#!/usr/bin/env python3
"""Submit URLs to IndexNow (Bing/Yandex instant indexing).

Usage:
    python3 tools/indexnow_submit.py https://arqr360.com/terra https://arqr360.com/blog
    INDEXNOW_KEY=xxxx python3 tools/indexnow_submit.py <url> [<url> ...]

The key is read from the INDEXNOW_KEY env var first, otherwise from the
single *.txt key file at the repo root (a 32-char hex filename).
Prints the HTTP status code for the submission.
"""
import glob
import json
import os
import sys
import urllib.request

ENDPOINT = "https://api.indexnow.org/indexnow"
HOST = "arqr360.com"


def find_key():
    key = os.environ.get("INDEXNOW_KEY", "").strip()
    if key:
        return key
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for path in sorted(glob.glob(os.path.join(root, "*.txt"))):
        name = os.path.basename(path)[:-4]
        if len(name) == 32 and all(c in "0123456789abcdef" for c in name):
            return name
    raise SystemExit("No IndexNow key found (set INDEXNOW_KEY or add the key file at repo root).")


def main():
    urls = sys.argv[1:]
    if not urls:
        raise SystemExit("Usage: indexnow_submit.py <url> [<url> ...]")
    key = find_key()
    payload = {
        "host": HOST,
        "key": key,
        "keyLocation": f"https://{HOST}/{key}.txt",
        "urlList": urls,
    }
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"IndexNow: HTTP {resp.status} for {len(urls)} URL(s)")
            return 0 if resp.status in (200, 202) else 1
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:300]
        print(f"IndexNow: HTTP {e.code} for {len(urls)} URL(s): {body}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
