"""Server local care se comportă ca GitHub Pages: /albume servește albume.html, / servește index.html,
iar adresele inexistente primesc 404.html. Linkurile site-ului nu au „.html”, deci http.server simplu
nu le-ar găsi.

Rulare:  python3 scripts/serve.py [port]      (implicit 4174; servește rădăcina depozitului)
"""
import functools
import http.server
import pathlib
import sys
from urllib.parse import urlsplit, unquote

ROOT = pathlib.Path(__file__).resolve().parent.parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        parts = urlsplit(self.path)
        rel = unquote(parts.path).lstrip("/")
        target = ROOT / rel
        if rel and not target.exists() and (ROOT / (rel + ".html")).is_file():
            self.path = "/" + rel + ".html" + (f"?{parts.query}" if parts.query else "")
        elif not target.exists():
            body = (ROOT / "404.html").read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return None
        return super().send_head()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4174
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), functools.partial(Handler, directory=str(ROOT)))
    print(f"Absolvire.ro local: http://127.0.0.1:{port}/")
    server.serve_forever()
