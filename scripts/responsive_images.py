"""Imagini responsive (unealtă de dezvoltare, nu rulează în pipeline).

Pentru fiecare imagine mare folosită direct în paginile generate:
1. creează variantele mai mici <nume>-480.webp și <nume>-800.webp (cu `cwebp`);
2. măsoară în Chrome (fără interfață) lățimea afișată pe telefon (412 px) și pe desktop (1350 și 1920 px)
   și scrie rezultatul în _src/image_sizes.json.

_src/build.py adaugă apoi `srcset` și `sizes` pe toate <img> care au variante, ca fiecare ecran să
descarce doar imaginea de care are nevoie.

Rulare (după python3 _src/build.py), apoi build-ul din nou:
    python3 scripts/responsive_images.py [--chrome /cale/spre/chrome]
"""
from pathlib import Path
import argparse
import functools
import http.server
import json
import re
import shutil
import subprocess
import sys
import threading

sys.path.insert(0, str(Path(__file__).resolve().parent))
from image_info import image_size  # noqa: E402
from seo import ROOT, SRC  # noqa: E402

WIDTHS = (480, 800)          # lățimile variantelor
MIN_WIDTH = 600              # imaginile mai înguste nu primesc variante
VIEWPORTS = {"m": 412, "d": 1350, "w": 1920}
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
VARIANT = re.compile(r"-(?:%s)\.webp$" % "|".join(map(str, WIDTHS)))

MEASURE = """<!doctype html><meta charset="utf-8"><body style="margin:0">
<pre id="out"></pre><script>
const vps = %s, page = new URLSearchParams(location.search).get("p"), res = {};
let left = Object.keys(vps).length;
for (const [k, w] of Object.entries(vps)) {
  const f = document.createElement("iframe");
  f.style.cssText = `width:${w}px;height:1000px;border:0;display:block`;
  f.src = page;
  f.onload = () => setTimeout(() => {
    for (const img of f.contentDocument.querySelectorAll("img[src^='assets/img/']")) {
      const src = img.getAttribute("src"), x = img.getBoundingClientRect().width;
      if (!x) continue;
      res[src] = res[src] || {};
      res[src][k] = Math.max(res[src][k] || 0, Math.ceil(x));
    }
    if (!--left) document.getElementById("out").textContent = JSON.stringify(res);
  }, 300);
  document.body.appendChild(f);
}
</script>"""


def used_images():
    """Imaginile din <img src> ale paginilor generate (nu și cele adăugate doar de scripturi)."""
    out = set()
    for page in ROOT.glob("*.html"):
        out |= set(re.findall(r'<img [^>]*src="(assets/img/[^"]+\.webp)"', page.read_text(encoding="utf8")))
    return sorted(x for x in out if not VARIANT.search(x))


def make_variants(images):
    if not shutil.which("cwebp"):
        sys.exit("Lipsește cwebp (brew install webp).")
    made = 0
    for src in images:
        path = ROOT / src
        w, _ = image_size(path)
        if w < MIN_WIDTH:
            continue
        for vw in WIDTHS:
            target = path.with_name(f"{path.stem}-{vw}.webp")
            if vw < w * 0.9 and not target.exists():
                subprocess.run(["cwebp", "-quiet", "-q", "78", "-m", "6", "-alpha_q", "100", "-resize", str(vw), "0",
                                str(path), "-o", str(target)], check=True)
                made += 1
    print(f"Variante noi: {made}")


def measure(chrome):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def do_GET(self):
            if self.path.startswith("/__measure.html"):
                body = (MEASURE % json.dumps(VIEWPORTS)).encode()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            super().do_GET()

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    port = server.server_address[1]
    sizes = {}
    try:
        for page in sorted(ROOT.glob("*.html")):
            dom = subprocess.run([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=2000,1100",
                                  "--virtual-time-budget=8000", "--dump-dom",
                                  f"http://127.0.0.1:{port}/__measure.html?p={page.name}"],
                                 capture_output=True, text=True, timeout=120).stdout
            m = re.search(r'<pre id="out">(.*?)</pre>', dom, re.S)
            if not m or not m.group(1).strip():
                print("  fără măsurători:", page.name)
                continue
            for src, v in json.loads(m.group(1).replace("&quot;", '"').replace("&amp;", "&")).items():
                cur = sizes.setdefault(src, {})
                for k, x in v.items():
                    cur[k] = max(cur.get(k, 0), x)
    finally:
        server.shutdown()
    out = {}
    for src, v in sorted(sizes.items()):
        mob = min(100, -(-v.get("m", VIEWPORTS["m"]) * 100 // VIEWPORTS["m"]))   # % din lățimea ecranului
        desk = max(v.get("d", 0), v.get("w", 0)) or VIEWPORTS["w"]              # px pe desktop
        out[src] = f"(max-width: 760px) {mob}vw, {desk}px"
    (SRC / "image_sizes.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf8")
    print(f"Dimensiuni măsurate pentru {len(out)} imagini → _src/image_sizes.json")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--chrome", default=CHROME)
    args = ap.parse_args()
    make_variants(used_images())
    measure(args.chrome)
