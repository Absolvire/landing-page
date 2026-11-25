"""Date comune pentru scripturile din pipeline-ul GitHub Pages (build.py, check_seo.py, check_assets.py).

Site-ul este generat de _src/build.py (șabloane din _src/, catalog din assets/js/data.js,
configurare SEO/GEO în _src/seo.py). Acest modul expune doar ce le trebuie scripturilor:
căile, adresa de bază și lista paginilor publicate.
"""
from pathlib import Path
import os
import re

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_src'
DIST = ROOT / 'dist'
# Pipeline-ul setează SITE_URL din GitHub Pages (configure-pages → base_url).
BASE = os.environ.get('SITE_URL', 'https://www.absolvire.ro/').rstrip('/') + '/'

# Fișierele publice care ajung în dist/ (pe lângă paginile HTML și assets/).
PUBLIC_FILES = ['sitemap.xml', 'robots.txt', 'llms.txt']


def page_url(name):
    """Adresa canonică a unei pagini (index.html → rădăcina site-ului)."""
    return BASE if name == 'index.html' else BASE + name


def pages(folder=DIST):
    """Paginile HTML publicate, cu indicatorul noindex: [(nume, cale, indexabilă)]."""
    out = []
    for path in sorted(folder.glob('*.html')):
        html = path.read_text(encoding='utf8')
        robots = re.search(r'<meta name="robots" content="([^"]+)"', html)
        out.append((path.name, path, not (robots and 'noindex' in robots.group(1))))
    return out


# Compatibilitate cu scripturile vechi: PAGES = lista paginilor publicate (fără extensie).
PAGES = [(name[:-5] if name != 'index.html' else '',) for name, _, _ in pages(ROOT)]
