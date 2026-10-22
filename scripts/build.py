from pathlib import Path
import shutil
from seo import run
run()
root = Path(__file__).resolve().parent.parent
out = root / 'dist'
out.mkdir(exist_ok=True)
for name in ['index.html','styles.css','script.js','robots.txt','sitemap.xml','index.md','llms.txt','llms-full.txt']:
    shutil.copy2(root / name, out / name)
shutil.copytree(root / 'assets', out / 'assets', dirs_exist_ok=True)
for name in ['robe-si-esarfe', 'diplome-si-accesorii', 'albume', 'festivitati-si-baluri']:
    shutil.copytree(root / name, out / name, dirs_exist_ok=True)
print('Site static pregătit în dist/')
