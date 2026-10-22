from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json, re, xml.etree.ElementTree as ET
from seo import PAGES, BASE, MainText
from image_info import image_size
ROOT=Path(__file__).resolve().parent.parent/'dist'
class Page(HTMLParser):
 def __init__(self):super().__init__();self.tags=[];self.ids=set()
 def handle_starttag(self,t,a):
  a=dict(a);self.tags.append((t,a))
  if 'id' in a:self.ids.add(a['id'])
def check():
 parsed={}; titles=[]; descriptions=[]
 for slug,*_ in PAGES:
  f=ROOT/slug/'index.html';s=f.read_text();p=Page();p.feed(s);parsed[f.resolve()]=p
  assert len(re.findall('<h1[ >]',s))==1,f
  title=re.findall(r'<title>(.*?)</title>',s,re.S);assert len(title)==1,f;titles+=title
  desc=[a['content'] for t,a in p.tags if t=='meta' and a.get('name')=='description'];assert len(desc)==1,f;descriptions+=desc
  canonical=[a['href'] for t,a in p.tags if t=='link' and a.get('rel')=='canonical'];assert canonical==[BASE+(slug+'/' if slug else '')],f
  assert '<html lang="ro">' in s,f
  assert 'noindex' not in s
  for key in ('og:title','og:description','og:url','og:image'):
   values=[a.get('content') for t,a in p.tags if t=='meta' and a.get('property')==key]
   assert len(values)==1 and values[0],(f,key)
  assert [a['content'] for t,a in p.tags if t=='meta' and a.get('property')=='og:url']==canonical,f
  schema=re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S);assert len(schema)==1,f
  graph=json.loads(schema[0])['@graph'];types={x['@type'] for x in graph};assert {'Organization','WebSite','WebPage'}<=types
  if slug:assert 'BreadcrumbList' in types
  if slug and slug not in ('termeni-si-conditii','prelucrarea-datelor-cu-caracter-personal'):assert 'Service' in types
  if slug=='termeni-si-conditii':assert 'Service' not in types
  for t,a in p.tags:
   if t=='img' and a.get('src'):
    assert 'alt' in a and a.get('width') and a.get('height'),(f,a)
    if a.get('src','').endswith('.jpg'):assert a.get('srcset'),(f,a)
  md=(f.parent/'index.md').read_text()
  text=MainText();text.feed(s)
  assert text.text() in md,(f,'Stale Markdown export')
  assert md in (ROOT/'llms-full.txt').read_text(),(f,'Stale full export')
  assert canonical[0]+'index.md' in (ROOT/'llms.txt').read_text(),f
  for t,a in p.tags:
   if t=='img' and a.get('srcset'):
    for candidate in a['srcset'].split(','):
     path,width=candidate.strip().rsplit(' ',1)
     image=(f.parent/path).resolve();assert image.is_file(),image
     actual=image_size(image)[0]
     assert width==f'{actual}w',(image,width,actual)

 for f,p in parsed.items():
  for t,a in p.tags:
   for k in ('href','src'):
    u=urlsplit(a.get(k,''))
    if not a.get(k) or u.scheme or u.netloc:continue
    target=(f.parent/unquote(u.path)).resolve() if u.path else f
    if target.is_dir():target=target/'index.html'
    assert target.exists(),(f,a[k])
    if u.fragment and target in parsed:assert u.fragment in parsed[target].ids,(f,a[k])
 assert len(set(titles))==len(PAGES) and len(set(descriptions))==len(PAGES)
 xml=ET.parse(ROOT/'sitemap.xml');urls=[x.text for x in xml.findall('.//{*}loc')];assert set(urls)=={BASE+(slug+'/' if slug else '') for slug,*_ in PAGES}
 for name in ('robots.txt','llms.txt','llms-full.txt'):assert (ROOT/name).exists()
 assert (ROOT/'index.html').read_text().count('class="gallery-item"')==12
 assert (ROOT/'llms-full.txt').stat().st_size>0
 assert 'Allow: /' in (ROOT/'robots.txt').read_text()
 assert 'Sitemap: '+BASE+'sitemap.xml' in (ROOT/'robots.txt').read_text()
 print(f'SEO checks passed: {len(PAGES)} pages, unique metadata, schema, sitemap, links, responsive images and AI text exports.')
if __name__=='__main__':check()
