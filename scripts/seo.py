from pathlib import Path
from html.parser import HTMLParser
from html import escape, unescape
import json, re, subprocess, shutil
ROOT = Path(__file__).resolve().parent.parent
BASE = "https://www.absolvire.ro/"
PAGES = [
 ("", "Absolvire.ro | Robe, albume și festivități de absolvire", "Robe, toci și eșarfe personalizate, albume foto, diplome și organizarea festivităților de absolvire. Alături de generații din 2002.", "robe"),
 ("robe-si-esarfe", "Robe, toci și eșarfe de absolvire | Absolvire.ro", "Robe de absolvire în negru, albastru și vișiniu, toci și eșarfe personalizate pentru școala și promoția voastră. Descoperă opțiunile și cere o ofertă.", "hero"),
 ("diplome-si-accesorii", "Diplome și accesorii de absolvire | Absolvire.ro", "Diplome, medalii, trofee, invitații și suveniruri personalizate pentru festivitatea de absolvire. Descoperă opțiunile și solicită o ofertă.", "diploma"),
 ("albume", "Albume foto de absolvire și fotocărți | Absolvire.ro", "Albume de absolvire, mape și fotocărți personalizate. Nouă modele: Elegant, Special, Modern, Muschetar, Rege, Velvet, King, Royal și Premier.", "album"),
 ("festivitati-si-baluri", "Festivități și baluri de absolvire | Absolvire.ro", "Organizarea festivităților și balurilor de absolvire: locație, muzică, catering și foto-video, într-o propunere adaptată promoției voastre.", "party")]
NAMES = ["Absolvire.ro", "Robe și eșarfe", "Diplome și accesorii", "Albume și fotografie", "Festivități și baluri"]
class MainText(HTMLParser):
 def __init__(self):
  super().__init__(); self.main=False; self.skip=0; self.out=[]
 def handle_starttag(self,tag,attrs):
  if tag=='main':self.main=True
  if not self.main:return
  if tag in ('nav','form','script','style','button'):self.skip+=1
  if self.skip:return
  if tag in ('h1','h2','h3'):self.out.append('\n\n'+'#'*int(tag[1])+' ')
  elif tag in ('p','article','section','div','details','summary'):self.out.append('\n\n')
  elif tag in ('br','strong','span'):self.out.append(' ')
  elif tag=='li':self.out.append('\n- ')
 def handle_endtag(self,tag):
  if tag in ('nav','form','script','style','button') and self.skip:self.skip-=1
  if tag=='main':self.main=False
  if self.main and not self.skip and tag in ('h1','h2','h3','p','strong','span','article','section','div','summary'):self.out.append('\n\n')
 def handle_data(self,data):
  if self.main and not self.skip:self.out.append(re.sub(r'\s+',' ',data))
 def text(self):return re.sub(r'\n[ \t]*\n(?:[ \t]*\n)*','\n\n','\n'.join(line.strip() for line in ''.join(self.out).splitlines())).strip()
def run():
 # Smaller logo and image sources are generated without altering original assets.
 logo=ROOT/'assets/logo-header.png'
 if not logo.exists() or logo.stat().st_mtime < (ROOT/'assets/logo-v2.png').stat().st_mtime:
  shutil.copy2(ROOT/'assets/logo-v2.png',logo);subprocess.run(['sips','-Z','600',str(logo)],check=True,stdout=subprocess.DEVNULL)
 texts=[]
 for i,(slug,title,desc,photo) in enumerate(PAGES):
  folder=ROOT/slug; file=folder/'index.html'; s=file.read_text(); prefix='../' if slug else ''; url=BASE+(slug+'/' if slug else '')
  s=re.sub(r'<!-- SEO:START -->.*?<!-- SEO:END -->','',s,flags=re.S)
  s=re.sub(r'<title>.*?</title>','',s,flags=re.S)
  s=re.sub(r'<meta\b(?=[^>]*(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+"))[^>]*>','',s,flags=re.S)
  s=re.sub(r'<link\b(?=[^>]*rel="(?:canonical|alternate|preconnect)")[^>]*>','',s,flags=re.S)
  s=re.sub(r'<link\b[^>]*href="https://fonts.googleapis.com/[^>]*>','',s,flags=re.S)
  org={"@type":"Organization","@id":BASE+'#organization',"name":"Absolvire.ro","url":BASE,"logo":{"@type":"ImageObject","url":BASE+'assets/logo-header.png'},"foundingDate":"2002","telephone":"+40723882511","email":"comenzi.scoli@gmail.com","address":{"@type":"PostalAddress","streetAddress":"Str. Vatra Luminoasă nr. 1, Sector 2","addressLocality":"București","addressCountry":"RO"}}
  graph=[org,{"@type":"WebSite","@id":BASE+'#website',"url":BASE,"name":"Absolvire.ro","inLanguage":"ro-RO","publisher":{"@id":BASE+'#organization'}},{"@type":"WebPage","@id":url+'#webpage',"url":url,"name":title,"description":desc,"inLanguage":"ro-RO","isPartOf":{"@id":BASE+'#website'},"about":{"@id":url+'#service' if slug else BASE+'#organization'},"primaryImageOfPage":{"@type":"ImageObject","url":BASE+'assets/'+photo+'.jpg'}}]
  if slug:
   graph += [{"@type":"Service","@id":url+'#service',"name":NAMES[i],"serviceType":NAMES[i],"description":desc,"url":url,"provider":{"@id":BASE+'#organization'}},{"@type":"BreadcrumbList","@id":url+'#breadcrumb',"itemListElement":[{"@type":"ListItem","position":1,"name":"Acasă","item":BASE},{"@type":"ListItem","position":2,"name":NAMES[i],"item":url}]}]
   graph[2]['breadcrumb']={"@id":url+'#breadcrumb'}
  else:
   graph[2]['hasPart']=[{"@id":BASE+x[0]+'/#webpage'} for x in PAGES[1:]]
  metadata=f'<title>{escape(title)}</title><meta name="description" content="{escape(desc,quote=True)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="{url}"><link rel="alternate" type="text/markdown" href="{url}index.md" title="Versiune text">'
  for key,value in {'og:title':title,'og:description':desc,'og:type':'website','og:url':url,'og:site_name':'Absolvire.ro','og:locale':'ro_RO','og:image':BASE+'assets/'+photo+'.jpg','og:image:alt':NAMES[i]+' — Absolvire.ro'}.items():metadata+=f'<meta property="{key}" content="{escape(value,quote=True)}">'
  for key,value in {'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':desc,'twitter:image':BASE+'assets/'+photo+'.jpg'}.items():metadata+=f'<meta name="{key}" content="{escape(value,quote=True)}">'
  metadata+='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&amp;family=Manrope:wght@400;500;600;700;800&amp;display=swap">'
  metadata+='<script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False)+'</script>'
  s=re.sub(r'\n(?:[ \t]*\n){2,}', '\n\n', s)
  s=s.replace('</head>','<!-- SEO:START -->'+metadata+'<!-- SEO:END -->\n</head>').replace('assets/logo-v2.png','assets/logo-header.png')
  def optimize(match):
   tag=match.group();src=re.search(r'src="([^"]+)"',tag)
   if not src:return tag
   image=folder/src[1]
   if image.suffix!='.jpg' or not image.exists():return tag
   small=image.with_name(image.stem+'-640.jpg')
   if not small.exists() or small.stat().st_mtime < image.stat().st_mtime:
    shutil.copy2(image,small);subprocess.run(['sips','-Z','640',str(small)],stdout=subprocess.DEVNULL,check=True)
   dimensions=subprocess.check_output(['sips','-g','pixelWidth','-g','pixelHeight',str(image)],text=True)
   w=int(re.search(r'pixelWidth: (\d+)',dimensions)[1]);h=int(re.search(r'pixelHeight: (\d+)',dimensions)[1])
   tag=re.sub(r'\s(?:srcset|sizes|decoding|width|height)="[^"]*"','',tag)
   small_dimensions=subprocess.check_output(['sips','-g','pixelWidth',str(small)],text=True)
   small_w=int(re.search(r'pixelWidth: (\d+)',small_dimensions)[1])
   attrs=f' width="{w}" height="{h}" decoding="async" srcset="{src[1].replace(image.name,small.name)} {small_w}w, {src[1]} {w}w" sizes="(max-width: 760px) 100vw, 50vw"'
   return re.sub(r'\s*/?>$',attrs+'>',tag)
  s=re.sub(r'<img\b[^>]*>',optimize,s,flags=re.S)
  # Accessible descriptive permanent links in the footer of every page.
  s=re.sub(r'<!-- SERVICES:START -->.*?<!-- SERVICES:END -->','',s,flags=re.S)
  links=''.join(f'<a href="{prefix}{row[0]}/">{NAMES[n]}</a>' for n,row in enumerate(PAGES[1:],1))
  s=s.replace('<div class="footer-bottom">','<!-- SERVICES:START --><nav class="service-navigation" aria-label="Servicii Absolvire">'+links+'</nav><!-- SERVICES:END --><div class="footer-bottom">')
  file.write_text(s)
  text=MainText();text.feed(s)
  md=f'# {NAMES[i]}\n\nSursa canonică: {url}\n\n{desc}\n\n'+text.text()+'\n\n## Contact\n\nAbsolvire.ro — comenzi.scoli@gmail.com — +40 723 88 25 11\nStr. Vatra Luminoasă nr. 1, Sector 2, București.\n'
  (folder/'index.md').write_text(md);texts.append(md)
 (ROOT/'llms.txt').write_text('# Absolvire.ro\n\n> Produse și servicii pentru absolvire, în România. Atelier propriu; activitate din 2002.\n\n## Pagini\n\n'+''.join(f'- [{NAMES[i]}]({BASE+(slug+"/" if slug else "")}index.md): {desc}\n' for i,(slug,title,desc,photo) in enumerate(PAGES))+'\n## Contact\n\ncomenzi.scoli@gmail.com · +40 723 88 25 11\n\nConfigurațiile și disponibilitatea se confirmă în ofertă. Nu sunt publicate prețuri ferme.\n')
 (ROOT/'llms-full.txt').write_text('\n\n---\n\n'.join(texts))
 (ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: '+BASE+'sitemap.xml\n')
 (ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+BASE+(slug+'/' if slug else '')+'</loc></url>' for slug,*_ in PAGES)+'</urlset>\n')
if __name__=='__main__':run()
