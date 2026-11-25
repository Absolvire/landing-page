"""Verificări SEO / GEO pe site-ul din dist/ (rulează după scripts/build.py; oprește publicarea la erori)."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
import re
import sys
import xml.etree.ElementTree as ET

sys.path.insert(0, str(Path(__file__).resolve().parent))
from seo import DIST, BASE, page_url, pages  # noqa: E402
from image_info import image_size  # noqa: E402


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.ids = set()

    def handle_starttag(self, t, a):
        a = dict(a)
        self.tags.append((t, a))
        if 'id' in a:
            self.ids.add(a['id'])


def meta(p, attr, key):
    return [a.get('content') for t, a in p.tags if t == 'meta' and a.get(attr) == key]


def check():
    parsed, titles, descriptions = {}, [], []
    site = pages(DIST)
    assert site, 'dist/ nu conține pagini — a rulat scripts/build.py?'
    for name, f, indexable in site:
        s = f.read_text(encoding='utf8')
        p = Page()
        p.feed(s)
        parsed[f.resolve()] = p
        assert '{{' not in s, (f, 'variabile necompletate')
        assert '<html lang="ro">' in s, f
        assert len(re.findall(r'<h1[\s>]', s)) == 1, (f, 'trebuie exact un <h1>')
        title = re.findall(r'<title>(.*?)</title>', s, re.S)
        assert len(title) == 1 and 0 < len(title[0]) <= 60, (f, 'title lipsă sau > 60 caractere')
        titles += title
        desc = meta(p, 'name', 'description')
        assert len(desc) == 1 and desc[0] and len(desc[0]) <= 160, (f, 'descriere lipsă sau > 160 caractere')
        descriptions += desc
        canonical = [a['href'] for t, a in p.tags if t == 'link' and a.get('rel') == 'canonical']
        assert canonical == [page_url(name)], (f, canonical, page_url(name))
        if not indexable:
            assert name == 'cerere.html', (f, 'noindex permis doar pe cerere.html')
        listed = indexable and name != '404.html'  # 404.html: fără sitemap, llms.txt și Markdown
        if name == '404.html':
            assert 'document.createElement("base")' in s, (f, '404.html trebuie să își calculeze <base> spre rădăcina site-ului')
        md = f.with_suffix('.md')
        alternate = [a.get('href') for t, a in p.tags if t == 'link' and a.get('type') == 'text/markdown']
        if listed:
            assert alternate == [md.name] and md.is_file(), (f, 'lipsește versiunea Markdown')
            text = md.read_text(encoding='utf8')
            assert text.startswith('# ') and f'Pagina: {page_url(name)}' in text, (md, 'Markdown invalid')
            assert len(text) > 400, (md, 'Markdown prea scurt')
        else:
            assert not alternate and not md.exists(), (f, 'pagina nelistată nu are versiune Markdown')
        for key in ('og:title', 'og:description', 'og:url', 'og:image'):
            values = meta(p, 'property', key)
            assert len(values) == 1 and values[0], (f, key)
        assert meta(p, 'property', 'og:url') == canonical, f
        schema = re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)
        assert len(schema) == 1, (f, 'trebuie un singur bloc JSON-LD')
        graph = json.loads(schema[0].replace('<\\/', '</'))['@graph']
        types = {x['@type'] for x in graph}
        assert 'Organization' in types, f
        assert ('WebSite' in types) if name == 'index.html' else ('BreadcrumbList' in types), (f, types)
        if '<details><summary>' in s:
            assert 'FAQPage' in types, (f, 'întrebările frecvente trebuie să aibă FAQPage')
        for t, a in p.tags:
            if t == 'img' and a.get('src'):
                assert 'alt' in a and a.get('width') and a.get('height'), (f, a.get('src'), 'img fără alt/width/height')
                src = urlsplit(a['src'])
                if not src.scheme:
                    image = (f.parent / unquote(src.path)).resolve()
                    assert image.is_file(), (f, a['src'])
                    w, h = image_size(image)
                    assert abs(int(a['width']) / int(a['height']) - w / h) < 0.02, (f, a['src'], 'width/height nu respectă proporția imaginii')

    for f, p in parsed.items():
        for t, a in p.tags:
            for k in ('href', 'src'):
                u = urlsplit(a.get(k, ''))
                if not a.get(k) or u.scheme or u.netloc:
                    continue
                target = (f.parent / unquote(u.path)).resolve() if u.path else f
                assert target.exists(), (f, a[k])
                if u.fragment and target in parsed and not u.fragment.startswith('promo-'):
                    assert u.fragment in parsed[target].ids, (f, a[k])

    assert len(set(titles)) == len(site) and len(set(descriptions)) == len(site), 'titluri sau descrieri duplicate'
    urls = [x.text for x in ET.parse(DIST / 'sitemap.xml').findall('.//{*}loc')]
    assert set(urls) == {page_url(name) for name, _, idx in site if idx and name != '404.html'}, 'sitemap.xml nu corespunde paginilor indexabile'
    robots = (DIST / 'robots.txt').read_text(encoding='utf8')
    assert 'Allow: /' in robots and 'Sitemap: ' + BASE + 'sitemap.xml' in robots, 'robots.txt'
    llms = (DIST / 'llms.txt').read_text(encoding='utf8')
    for name, _, idx in site:
        if idx and name not in ('index.html', '404.html') and not name.startswith(('termeni', 'politica')):
            assert f'({BASE}{name[:-5]}.md)' in llms, (name, 'lipsește din llms.txt')
    print(f'SEO checks passed: {len(site)} pages, unique metadata, canonical/Open Graph, schema, links, images, sitemap, robots, llms.txt and Markdown pages.')


if __name__ == '__main__':
    check()
