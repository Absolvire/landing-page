"""Build pentru GitHub Pages: generează site-ul din _src/ și pregătește dist/.

1. rulează _src/build.py (pagini HTML, sitemap.xml, robots.txt, llms.txt; SITE_URL din mediu);
2. copiază în dist/ doar fișierele publice (fără _src/, scripts/, README) și adaugă .nojekyll.
"""
from pathlib import Path
import shutil
import subprocess
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from seo import ROOT, SRC, DIST, PUBLIC_FILES  # noqa: E402

if not shutil.which('node'):
    sys.exit('Lipsește Node.js: _src/build.py citește catalogul din assets/js/data.js cu Node.')

subprocess.run([sys.executable, str(SRC / 'build.py')], check=True)

if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()
for page in sorted(ROOT.glob('*.html')):
    shutil.copy2(page, DIST / page.name)
for name in PUBLIC_FILES:
    shutil.copy2(ROOT / name, DIST / name)
shutil.copytree(ROOT / 'assets', DIST / 'assets', ignore=shutil.ignore_patterns('.DS_Store', '*.psd'))
(DIST / '.nojekyll').touch()

files = [p for p in DIST.rglob('*') if p.is_file()]
print(f'Site static pregătit în dist/: {len(files)} fișiere, {sum(p.stat().st_size for p in files) / 1_048_576:.1f} MB')
