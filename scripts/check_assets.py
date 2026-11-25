"""Fail CI for missing or unused deployed assets, including images chosen in the configurators."""
from pathlib import Path
import json
import re
import subprocess
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from seo import DIST  # noqa: E402

root = DIST
html = list(root.glob('*.html'))
css = root / 'assets/css/style.css'
data_js = root / 'assets/js/data.js'
app_js = root / 'assets/js/app.js'
text = '\n'.join(p.read_text(encoding='utf8') for p in html + [data_js, app_js])

referenced = set(re.findall(r'assets/[A-Za-z0-9_./-]+\.[a-z0-9]+', text))
# url(...) din CSS, relative la assets/css/
for ref in re.findall(r'url\("?([^")]+)"?\)', css.read_text(encoding='utf8')):
    if not re.match(r'^(https?:|data:)', ref):
        referenced.add((css.parent / ref).resolve().relative_to(root.resolve()).as_posix())
# fotografiile cocardei se aleg dinamic în configuratoare: assets/img/cocarda-${culoare}.webp
data = data_js.read_text(encoding='utf8')
if 'cocarda-${id}' in app_js.read_text(encoding='utf8'):
    rosettes = data[data.index('scarves:'):data.index('insignaImg')]
    for rid in re.findall(r'\{ id: "([\w-]+)", name:', rosettes):
        referenced.add(f'assets/img/cocarda-{rid}.webp')
# imaginile albumelor (copertă, opțiuni, interior): app.js le afișează ca miniaturi <nume>-480.webp
albums = json.loads(subprocess.check_output(['node', '-e', 'global.window={};require(process.argv[1]);'
                                             'process.stdout.write(JSON.stringify(window.ABS.albums))', str(data_js)]))
for a in albums:
    for img in [a['img']] + [x['img'] for k in ('options', 'options2', 'interior') for x in a.get(k) or [] if x.get('img')]:
        variant = img[:-5] + '-480.webp'
        assert (root / variant).is_file(), f'Lipsește miniatura {variant} (python3 scripts/responsive_images.py)'
        referenced.add(variant)
# variantele responsive (-480/-800) ale unei imagini folosite contează ca folosite
for img in list(referenced):
    for w in (480, 800):
        variant = re.sub(r'\.webp$', f'-{w}.webp', img)
        if variant != img and (root / variant).is_file() and img.endswith('.webp'):
            referenced.add(variant)
# fișierele de cod sunt incluse de toate paginile
referenced |= {'assets/css/style.css', 'assets/js/data.js', 'assets/js/app.js'}

actual = {p.relative_to(root).as_posix() for p in (root / 'assets').rglob('*') if p.is_file()}
assert not referenced - actual, f'Missing assets: {sorted(referenced - actual)}'
assert not actual - referenced, f'Unused assets: {sorted(actual - referenced)}'
print(f'Asset checks passed: {len(actual)} referenced files, no missing or unused resources.')
