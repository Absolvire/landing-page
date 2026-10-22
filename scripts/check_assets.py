"""Fail CI for missing or unused deployed assets, including selector images."""
from pathlib import Path
import re
from seo import PAGES

root = Path(__file__).resolve().parent.parent / 'dist'
files = [root / 'styles.css', root / 'script.js'] + [root / slug / 'index.html' for slug, *_ in PAGES]
text = '\n'.join(p.read_text() for p in files)
referenced = set(re.findall(r'assets/[A-Za-z0-9_./-]+', text))
actual = {p.relative_to(root).as_posix() for p in (root / 'assets').rglob('*') if p.is_file()}
assert not referenced - actual, f'Missing assets: {sorted(referenced - actual)}'
assert not actual - referenced, f'Unused assets: {sorted(actual - referenced)}'
print(f'Asset checks passed: {len(actual)} referenced files, no missing or unused resources.')
