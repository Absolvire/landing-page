#!/usr/bin/env python3
"""Generează site-ul static Absolvire.ro.

- Antetul, subsolul și <head> sunt comune (partials/); fiecare pagină are corpul ei în pages/.
- Paginile de album se generează din pages/_album.html pentru fiecare album din assets/js/data.js.
- Conținutul de catalog (albume, prețuri, servicii, promoții, recomandări) este scris direct în
  HTML, ca să fie citit de motoarele de căutare și de motoarele AI fără JavaScript. app.js îl
  re-randează identic și adaugă interactivitatea.
- SEO / GEO: titluri, descrieri, canonical, Open Graph, date structurate (JSON-LD), întrebări
  frecvente, sitemap.xml, robots.txt și llms.txt — configurate în _src/seo.py.
- Fiecare pagină are și o versiune Markdown (<pagina>.md, din _src/md.py), legată din <head>
  (rel=alternate) și din llms.txt. Se scrie lângă pagina HTML, în rădăcină: site-ul se publică direct
  din ramura main (GitHub Pages, „Deploy from a branch”), deci fișierele generate se păstrează în depozit.

Rulare (din folderul landing-page):  python3 _src/build.py
"""
import datetime as dt
import json
import pathlib
import re
import subprocess
import sys
from html import escape

SRC = pathlib.Path(__file__).resolve().parent
ROOT = SRC.parent
sys.path.insert(0, str(SRC))
import seo  # noqa: E402
from md import page_markdown  # noqa: E402

data = json.loads(subprocess.check_output([
    "node", "-e",
    "global.window={};require(process.argv[1]);process.stdout.write(JSON.stringify(window.ABS))",
    str(ROOT / "assets/js/data.js"),
]))
C = data["config"]
TODAY = dt.date.today().isoformat()
NOW = dt.datetime.now(dt.timezone.utc)

partials = {p.stem: p.read_text(encoding="utf8") for p in (SRC / "partials").glob("*.html")}
META_RE = re.compile(r"\A<!--(.*?)-->\s*", re.S)


def e(s):
    return escape(str(s if s is not None else ""), quote=True)


# Dimensiunile reale ale imaginilor (width/height pe fiecare <img>, ca pagina să nu „sară” la încărcare)
try:
    sys.path.insert(0, str(ROOT / "scripts"))
    from image_info import image_size  # noqa: E402
except ImportError:  # pragma: no cover - fără scripts/, dimensiunile rămân cele din șabloane
    image_size = None
_DIMS = {}


# Imagini responsive: variantele <nume>-480/-800.webp și lățimile afișate (sizes) vin din
# scripts/responsive_images.py; fără ele, <img> rămâne doar cu src.
VARIANT_WIDTHS = (480, 800)
_SIZES_FILE = SRC / "image_sizes.json"
IMAGE_SIZES = json.loads(_SIZES_FILE.read_text(encoding="utf8")) if _SIZES_FILE.is_file() else {}


def srcset(src, natural_w):
    """(srcset, sizes) pentru o imagine din assets/img care are variante mai mici, altfel None."""
    path = ROOT / src
    variants = [(w, f"{src[:-5]}-{w}.webp") for w in VARIANT_WIDTHS
                if src.endswith(".webp") and path.with_name(f"{path.stem}-{w}.webp").is_file()]
    if not variants:
        return None
    candidates = ", ".join(f"{u} {w}w" for w, u in variants) + f", {src} {natural_w}w"
    return candidates, IMAGE_SIZES.get(src, "100vw")


def img_dims(html):
    if not image_size:
        return html

    def repl(m):
        tag = m.group(0)
        src = re.search(r'\ssrc="([^"]+)"', tag)
        if not src or re.match(r"^(https?:|data:|//)", src.group(1)):
            return tag
        path = ROOT / src.group(1)
        if not path.is_file():
            return tag
        if path not in _DIMS:
            _DIMS[path] = image_size(path)
        w, h = _DIMS[path]
        tag = re.sub(r'\s(?:width|height|srcset|sizes)="[^"]*"', "", tag)
        extra = ""
        rs = srcset(src.group(1), w)
        if rs:
            extra = f' srcset="{rs[0]}" sizes="{rs[1]}"'
        return re.sub(r"\s*/?>$", f'{extra} width="{w}" height="{h}">', tag)
    return re.sub(r"<img\b[^>]*>", repl, html)


def fmt(n):
    return f"{int(n):,}".replace(",", ".")


def lei(n):
    return f"{fmt(n)} lei"


def absu(path):
    """Adresa publică a unei pagini, fără „.html” (GitHub Pages servește /albume din albume.html):
    index.html → /, albume.html → /albume."""
    return f"{seo.SITE_URL}/{'' if path == 'index.html' else path.removesuffix('.html')}"


def md_name(path):
    """Numele versiunii Markdown a unei pagini (albume.html → albume.md)."""
    return path.removesuffix(".html") + ".md"


def mdu(path):
    """Adresa versiunii Markdown a unei pagini (index.html → index.md)."""
    return f"{seo.SITE_URL}/{md_name(path)}"


# ------------------------------------------------------------------ prerandare
def album_cards():
    return "".join(f"""
      <article class="album-card">
        <a class="album-card-img" href="album-{e(a['id'])}" tabindex="-1" aria-hidden="true"><img src="{e(a['img'])}" alt="Album de absolvire {e(a['name'])}" loading="lazy"></a>
        <div class="album-card-body">
          <h3><a href="album-{e(a['id'])}">{e(a['name'])}</a></h3>
          <p class="price"><b>{fmt(a['price'])}</b> lei / elev</p>
          <p class="album-card-text">{e(a['short'])}</p>
          <p class="spec-line">{e(a['size'])} · {e(a['photos'])}</p>
          <a class="btn btn-primary btn-sm" href="album-{e(a['id'])}">Vezi detalii <span aria-hidden="true">→</span></a>
        </div>
      </article>""" for a in data["albums"])


def compare_table():
    albums = data["albums"]
    rows = [
        ("Preț de referință*", lambda a: f"<b>{fmt(a['price'])} lei</b> / elev"),
        ("Dimensiune", lambda a: e(a["size"])), ("Copertă", lambda a: e(a["cover"])),
        ("Pagini", lambda a: e(a["binding"])), ("Fotografii", lambda a: e(a["photos"])),
        ("Distribuția elevilor", lambda a: e(a["layout"])),
        ("", lambda a: f'<a class="btn btn-outline btn-sm" href="album-{e(a["id"])}">Configurează</a>'),
    ]
    head = "<tr><th scope=\"col\"><span class=\"sr\">Caracteristică</span></th>" + "".join(
        f'<th scope="col"><img src="{e((a["options"][0].get("img") if a["options"] else None) or a["img"])}" alt="" loading="lazy">{e(a["name"])}</th>'
        for a in albums) + "</tr>"
    body = "".join(f'<tr><th scope="row">{k}</th>' + "".join(f"<td>{f(a)}</td>" for a in albums) + "</tr>" for k, f in rows)
    body += f'<tr class="foot"><td colspan="{len(albums) + 1}">* Pentru minimum {C["albumMinQty"]} albume contra cost. Sub prag, oferta se personalizează pentru cantitatea cerută.</td></tr>'
    return f"<thead>{head}</thead><tbody>{body}</tbody>"


def price_label(it):
    mode = it.get("mode", "fixed")
    if mode == "from":
        return f"de la {lei(it['price'])} / {it['unit']}"
    if mode == "estimate":
        return f"estimativ {lei(it['price'])} / {it['unit']}"
    if mode == "quote":
        return "Preț la cerere"
    return f"{lei(it['price'])} / {it['unit']}"


def price_list(key, ids=None, cards=False):
    out = []
    for it in data[key]:
        if ids and it["id"] not in ids:
            continue
        mode = it.get("mode", "fixed")
        qty = ""
        if mode in ("fixed", "estimate"):
            qty = f'<input type="number" min="1" value="{25 if mode == "estimate" else 1}" aria-label="Cantitate ({e(it.get("unit"))})" data-pl-qty>'
        desc = f'<span class="pl-desc">{e(it["desc"])}</span>' if it.get("desc") else ""
        out.append(f"""<li class="{'svc' if cards else 'pl'}" data-item="{e(key)}:{e(it['id'])}">
        <div class="pl-main"><span class="pl-name">{e(it['name'])}</span>{desc}<span class="pl-price mode-{mode}">{e(price_label(it))}</span></div>
        <div class="pl-act">{qty}<button type="button" class="btn btn-sm {'btn-outline' if cards else 'btn-ghost'}" data-pl-add>Adaugă</button></div>
      </li>""")
    return "".join(out)


def recos(set_id):
    out = []
    first_hex = data["outfit"]["scarves"][0]["hex"]
    for rid in data["recoSets"].get(set_id, []):
        r = data["recos"].get(rid)
        if not r:
            continue
        tint = r.get("tint")
        out.append(f"""
      <article class="reco">
        <div class="reco-img{' tint' if tint else ''}" {f'style="--stole:{first_hex}"' if tint else ''}><img src="{e(r['img'])}" alt="{e(r['title'])}" loading="lazy"></div>
        <h3>{e(r['title'])}</h3>
        <p>{e(r['text'])}</p>
        <a class="btn btn-outline btn-sm" href="{e(r['href'])}">{e(r['cta'])} <span aria-hidden="true">→</span></a>
      </article>""")
    return "".join(out)


MONTHS = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august",
          "septembrie", "octombrie", "noiembrie", "decembrie"]


def ro_date(iso):
    d = dt.datetime.fromisoformat(iso)
    return f"{d.day} {MONTHS[d.month - 1]} {d.year}"


def live_campaigns():
    def live(c):
        if not c.get("active"):
            return False
        if c.get("start") and not c.get("showBeforeStart") and dt.datetime.fromisoformat(c["start"]) > NOW:
            return False
        if c.get("end") and dt.datetime.fromisoformat(c["end"]) < NOW:
            return False
        return True
    return sorted([c for c in data["campaigns"] if live(c)], key=lambda c: c.get("priority", 99))


def period(c):
    if c.get("start") and c.get("end"):
        return f"{ro_date(c['start'])} – {ro_date(c['end'])}"
    if c.get("end"):
        return f"până la {ro_date(c['end'])}"
    return "Perioadă de confirmat"


def promo_list():
    items = live_campaigns()
    if not items:
        return '<p class="empty">Momentan nu sunt promoții active în această categorie.</p>'
    out = []
    for c in items:
        cats = " · ".join(x.capitalize() for x in c["categories"])
        btns = "".join(f'<a class="btn {"btn-outline" if i else "btn-primary"} btn-sm" href="{e(b["href"])}">{e(b["label"])} →</a>' for i, b in enumerate(c["buttons"]))
        out.append(f"""
        <article class="promo" id="promo-{e(c['id'])}">
          <div class="promo-img"><img src="{e(c['img'])}" alt="" loading="lazy"></div>
          <div class="promo-body">
            <p class="eyebrow">{e(cats)} · {e(period(c))}</p>
            <h2>{e(c['title'])}</h2>
            <p class="slogan">{e(c['slogan'])}</p>
            <div class="promo-cols">
              <div><h3>Beneficii</h3><ul>{''.join(f'<li>{e(b)}</li>' for b in c['benefits'])}</ul></div>
              <div><h3>Condiții</h3><ul>{''.join(f'<li>{e(b)}</li>' for b in c['conditions'])}</ul></div>
            </div>
            <div class="promo-btns">{btns}</div>
          </div>
        </article>""")
    return "".join(out)


def model_tabs(current):
    on = ' aria-current="page" class="is-on"'
    return "".join(f'<a href="album-{e(a["id"])}"{on if a["id"] == current else ""}>{e(a["name"])}</a>' for a in data["albums"])


def interior(a):
    return "".join(f'<li><button type="button" data-view="{i}"><img src="{e(it["img"])}" alt="{e(a["name"])} — {e(it["title"])}" loading="lazy"></button><span>{e(it["title"])}</span></li>' for i, it in enumerate(a["interior"]))


def prerender(html, album=None):
    html = html.replace("data-album-cards></div>", f"data-album-cards>{album_cards()}</div>")
    html = html.replace("data-compare><thead></thead><tbody></tbody></table>", f"data-compare>{compare_table()}</table>")
    html = html.replace("data-promo-list></div>", f"data-promo-list>{promo_list()}</div>")

    def list_sub(m):
        tag = m.group(1)
        key = re.search(r'data-list="(\w+)"', tag).group(1)
        flt = re.search(r'data-filter="([^"]*)"', tag)
        return tag + price_list(key, flt.group(1).split(",") if flt else None, 'data-style="cards"' in tag) + "</ul>"
    html = re.sub(r'(<ul[^>]*data-list="\w+"[^>]*>)</ul>', list_sub, html)
    html = re.sub(r'(<div class="reco-grid[^"]*" data-recos="([\w-]+)">)</div>', lambda m: m.group(1) + recos(m.group(2)) + "</div>", html)
    if album:
        html = html.replace("data-model-tabs></nav>", f"data-model-tabs>{model_tabs(album['id'])}</nav>")
        html = html.replace("data-interior></ol>", f"data-interior>{interior(album)}</ol>")
    return html


# ------------------------------------------------------------------ FAQ + JSON-LD
def faq_section(qa):
    if not qa:
        return ""
    items = "".join(f"<details><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in qa)
    return f"""
<section class="section section-alt faq" aria-labelledby="faq-title">
  <div class="wrap">
    <div class="section-head"><div><p class="eyebrow">Întrebări frecvente</p><h2 id="faq-title">Pe scurt, ce trebuie să știți</h2></div></div>
    <div class="faq-list">{items}</div>
  </div>
</section>"""


ORG = {
    "@type": "Organization", "@id": f"{seo.SITE_URL}/#org", "name": seo.SITE_NAME, "url": f"{seo.SITE_URL}/",
    "logo": f"{seo.SITE_URL}/assets/img/logo-black.webp",
    "foundingDate": str(seo.FOUNDED),
    "areaServed": {"@type": "Country", "name": "România"},
    "description": f"Din {seo.FOUNDED}: albume de absolvire, vestimentație și servicii pentru festivitatea și balul de absolvire.",
}
def tel(p):
    return re.sub(r"[^\d+]", "", p or "")


def contact_html():
    c = C["contact"]
    parts = []
    if c.get("phone"):
        parts.append(f'<a href="tel:{e(tel(c["phone"]))}">{e(c["phone"])}</a>')
    if c.get("email"):
        parts.append(f'<a href="mailto:{e(c["email"])}">{e(c["email"])}</a>')
    if c.get("whatsapp"):
        parts.append(f'<a href="https://wa.me/{e(re.sub(r"[^0-9]", "", c["whatsapp"]))}" rel="noopener">WhatsApp</a>')
    return "<br>".join(parts) or "Datele de contact se completează în <code>assets/js/data.js</code>."


if C["contact"].get("phone") or C["contact"].get("email"):
    ORG["contactPoint"] = {"@type": "ContactPoint", "contactType": "customer service", "areaServed": "RO", "availableLanguage": "ro"}
    if C["contact"].get("phone"):
        ORG["contactPoint"]["telephone"] = tel(C["contact"]["phone"])
    if C["contact"].get("email"):
        ORG["contactPoint"]["email"] = C["contact"]["email"]
if C["contact"].get("email"):
    ORG["email"] = C["contact"]["email"]
_co = C.get("company") or {}
if _co.get("name"):
    ORG["legalName"] = _co["name"]
    ORG["taxID"] = _co.get("cif", "")
    ORG["address"] = {"@type": "PostalAddress", "streetAddress": _co.get("street", ""), "addressLocality": _co.get("city", ""),
                      "addressRegion": _co.get("region", ""), "addressCountry": "RO"}
if C["contact"].get("phone"):
    ORG["telephone"] = tel(C["contact"]["phone"])


def offer(price, unit=None, min_qty=None):
    o = {"@type": "Offer", "price": price, "priceCurrency": "RON", "seller": {"@id": f"{seo.SITE_URL}/#org"}}
    if unit:
        o["priceSpecification"] = {"@type": "UnitPriceSpecification", "price": price, "priceCurrency": "RON", "unitText": unit}
    if min_qty:
        o["eligibleQuantity"] = {"@type": "QuantitativeValue", "minValue": min_qty}
    return o


def product(name, desc, img, url, off, extra=None):
    p = {"@type": "Product", "name": name, "description": desc, "image": f"{seo.SITE_URL}/{img}",
         "url": absu(url), "brand": {"@type": "Brand", "name": seo.SITE_NAME}, "offers": off}
    if extra:
        p.update(extra)
    return p


def item_list(products):
    return {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "item": p} for i, p in enumerate(products)]}


def page_graph(page, url, meta, qa, album=None):
    g = [ORG]
    if page == "index":
        g.append({"@type": "WebSite", "@id": f"{seo.SITE_URL}/#site", "url": f"{seo.SITE_URL}/", "name": seo.SITE_NAME,
                  "inLanguage": "ro-RO", "publisher": {"@id": f"{seo.SITE_URL}/#org"}})
    crumbs = [seo.HOME] + meta.get("crumbs", [])
    if len(crumbs) > 1:
        g.append({"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": absu(u)} for i, (n, u) in enumerate(crumbs)]})
    o = data["outfit"]
    s = data["singles"]
    if page == "album" and album:
        a = album
        g.append(product(f"Album de absolvire {a['name']}", f"{a['short']} {a['size']}, {a['cover'].lower()}, {a['binding'].lower()}, {a['photos'].lower()}.",
                         a["img"], url, offer(a["price"], "elev", C["albumMinQty"]),
                         {"additionalProperty": [{"@type": "PropertyValue", "name": k, "value": v} for k, v in
                                                 (("Dimensiune", a["size"]), ("Copertă", a["cover"]), ("Pagini", a["binding"]), ("Fotografii", a["photos"]))]}))
    if page == "albume":
        g.append(item_list([product(f"Album de absolvire {a['name']}", a["short"], a["img"], f"album-{a['id']}.html", offer(a["price"], "elev", C["albumMinQty"])) for a in data["albums"]]))
    if page == "vestimentatie":
        g.append(product("Ținuta completă de absolvire", "Robă închiriată, pălărie, eșarfă personalizată, insignă sau cocardă și diplomă A4 inclusă.",
                         "assets/img/roba-visiniu-pack.webp", url,
                         {"@type": "AggregateOffer", "lowPrice": o["basePriceInsigna"], "highPrice": o["basePriceCocarda"], "priceCurrency": "RON", "offerCount": 2}))
    if page == "palarie":
        g.append(product("Pălărie de absolvire cu bentiță și ciucure cu anul", "Pălărie de absolvire; panglica și personalizarea capacului se aleg separat.",
                         "assets/img/palarie-visiniu.webp", url, offer(s["palarie"], "buc.")))
    if page == "esarfa":
        g.append(product("Eșarfă de absolvire personalizată", "Eșarfă cu denumirea instituției și anul promoției, imprimare albă sau neagră după nuanță.",
                         "assets/img/esarfa-alba.webp", url, offer(s["esarfa"], "buc.")))
    if page == "insigna-cocarda":
        g.append(item_list([
            product("Insignă de absolvire personalizată, Ø 6 cm", "Denumirea și sigla instituției, anul promoției.", o["insignaImg"], url, offer(s["insigna"], "buc.")),
            product("Cocardă de absolvire", "Insignă centrală decorată cu rozetă și panglici textile.", "assets/img/cocarda-visiniu.webp", url, offer(s["cocarda"], "buc.")),
        ]))
    if page in ("premiere", "parade", "foto-video"):
        key = {"premiere": "awards", "parade": "parade", "foto-video": "idPhotos"}[page]
        img = {"premiere": "assets/img/diploma-a4.webp", "parade": "assets/img/photo-wall-2.webp", "foto-video": "assets/img/photo-wall.webp"}[page]
        g.append(item_list([product(x["name"], x["name"], img, url, offer(x["price"], x["unit"])) for x in data[key]]))
    if page in ("festivitati", "banchete", "foto-video"):
        key = "banquetServices" if page == "banchete" else "festivalServices"
        items = data[key] if page != "foto-video" else [x for x in data[key] if x["id"] in ("foto-fest", "video-fest")]
        offers = []
        for x in items:
            of = {"@type": "Offer", "itemOffered": {"@type": "Service", "name": x["name"]}}
            if x.get("mode") == "from":
                of["priceSpecification"] = {"@type": "PriceSpecification", "minPrice": x["price"], "priceCurrency": "RON", "unitText": x["unit"]}
            elif x.get("mode") == "estimate":
                of["priceSpecification"] = {"@type": "UnitPriceSpecification", "price": x["price"], "priceCurrency": "RON", "unitText": x["unit"]}
            offers.append(of)
        g.append({"@type": "Service", "name": meta["h"], "provider": {"@id": f"{seo.SITE_URL}/#org"}, "areaServed": "RO",
                  "hasOfferCatalog": {"@type": "OfferCatalog", "name": meta["h"], "itemListElement": offers}})
    if qa:
        g.append({"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in qa]})
    doc = json.dumps({"@context": "https://schema.org", "@graph": g}, ensure_ascii=False, indent=1)
    return '<script type="application/ld+json">\n' + doc.replace("</", "<\\/") + "\n</script>"


BASE_SCRIPT = ('<script>(function(){var p=location.pathname.split("/"),b=document.createElement("base");'
               'b.href=/\\.github\\.io$/.test(location.hostname)&&p.length>2?"/"+p[1]+"/":"/";'
               'document.head.appendChild(b)})();</script>')


def seo_head(page_key, url, meta, title, desc, robots_noindex):
    img = f"{seo.SITE_URL}/{meta['img']}"
    # 404.html poate fi afișată la orice adresă (și în subfoldere): <base> spre rădăcina site-ului,
    # calculată în browser — pe github.io e /<depozit>/, pe domeniul propriu e /.
    tags = [BASE_SCRIPT] if meta.get("base") else []
    tags += [
        f'<link rel="canonical" href="{e(absu(url))}">',
        f'<meta name="robots" content="{"noindex, follow" if robots_noindex else "index, follow, max-image-preview:large"}">',
        f'<meta property="og:type" content="{"product" if page_key in ("album", "palarie", "esarfa") else "website"}">',
        f'<meta property="og:site_name" content="{seo.SITE_NAME}">',
        f'<meta property="og:locale" content="{seo.LOCALE}">',
        f'<meta property="og:title" content="{e(title)}">',
        f'<meta property="og:description" content="{e(desc)}">',
        f'<meta property="og:url" content="{e(absu(url))}">',
        f'<meta property="og:image" content="{e(img)}">',
        f'<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{e(title)}">',
        f'<meta name="twitter:description" content="{e(desc)}">',
        f'<meta name="twitter:image" content="{e(img)}">',
    ]
    if not robots_noindex and not meta.get("unlisted"):
        tags.append(f'<link rel="alternate" type="text/markdown" href="{e(md_name(url))}" title="Versiunea Markdown">')
    if page_key == "index":
        hero = "assets/img/photo-wall.webp"
        rs = srcset(hero, image_size(ROOT / hero)[0]) if image_size else None
        tags.append(f'<link rel="preload" as="image" href="{hero}" fetchpriority="high"'
                    + (f' imagesrcset="{rs[0]}" imagesizes="{rs[1]}"' if rs else "") + ">")
    return "\n  ".join(tags)


# ------------------------------------------------------------------ randare pagini
def inline_css():
    """assets/css/style.css, fără comentarii și spații de început de rând, cu căile relative la pagină."""
    css = (ROOT / "assets/css/style.css").read_text(encoding="utf8")
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r'url\((["\']?)\.\./', r'url(\1assets/', css)  # ../img/x → assets/img/x
    css = " ".join(line.strip() for line in css.splitlines() if line.strip())
    assert "</style" not in css
    return css


INLINE_CSS = inline_css()


def parse(text):
    meta = {}
    m = META_RE.match(text)
    if m:
        for line in m.group(1).strip().splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        text = text[m.end():]
    return meta, text


def fill(text, values):
    return re.sub(r"\{\{(\w+)\}\}", lambda m: str(values.get(m.group(1), m.group(0))), text)


def render(front, body, values, page_name, album=None):
    smeta = seo.album_page(album) if album else seo.PAGES[page_name]
    title = smeta["title"]
    desc = fill(front.get("description", ""), values)
    url = f"album-{album['id']}.html" if album else f"{page_name}.html"
    qa = seo.faq("album" if album else page_name, data, album)
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", body, re.S)
    smeta = dict(smeta, h=re.sub(r"<[^>]+>", "", h1.group(1)).strip() if h1 else title)

    values = dict(values)
    values.setdefault("album", "")
    values.update({k: escape(v, quote=True) for k, v in front.items()})
    values["title"] = escape(title, quote=True)
    values["description"] = escape(desc, quote=True)
    values["year"] = C["promoYear"]
    values["contact_html"] = contact_html()
    co = C.get("company", {})
    values.update({
        "company_name": e(co.get("name", seo.SITE_NAME)), "company_cif": e(co.get("cif", "")), "company_reg": e(co.get("regCom", "")),
        "company_address": e(", ".join(x for x in (co.get("city"), co.get("region", "").lower() if co.get("region") else "", co.get("street")) if x)),
        "company_site": e(co.get("site", "absolvire.ro")),
        "contact_email": e(C["contact"].get("email", "")), "contact_phone": e(C["contact"].get("phone", "")),
        "contact_tel": e(tel(C["contact"].get("phone", ""))), "legal_updated": seo.LEGAL_UPDATED,
    })
    values["seo_head"] = seo_head("album" if album else page_name, url, smeta, title, desc, smeta.get("noindex"))
    values["jsonld"] = page_graph("album" if album else page_name, url, smeta, qa, album)

    header = partials["header"]
    nav = front.get("nav", "")
    if nav:
        header = header.replace(f'data-nav="{nav}"', f'data-nav="{nav}" aria-current="page"')
    page = partials["layout"].replace("{{header}}", header).replace("{{footer}}", partials["footer"])
    # CSS-ul e scris direct în pagină: prima afișare nu mai așteaptă o cerere separată pentru style.css
    page = page.replace('<link rel="stylesheet" href="assets/css/style.css">', f"<style>{INLINE_CSS}</style>")
    page = page.replace("{{body}}", body + faq_section(qa))
    for name, html in partials.items():
        if name not in ("layout", "header", "footer"):
            values.setdefault(name, html)
    page = fill(fill(page, values), values)
    return img_dims(prerender(page, album)), url, title, desc, smeta, qa


def write_md(html, url, title, desc, smeta):
    """Versiunea Markdown, doar pentru paginile listate (nu și 404.html)."""
    target = ROOT / md_name(url)
    if smeta.get("noindex") or smeta.get("unlisted"):
        target.unlink(missing_ok=True)
        return
    target.write_text(page_markdown(html, absu(url), title, desc, TODAY), encoding="utf8")


written, index_entries = [], []
for path in sorted((SRC / "pages").glob("*.html")):
    front, body = parse(path.read_text(encoding="utf8"))
    if path.name == "_album.html":
        for a in data["albums"]:
            values = {
                "album_id": a["id"], "album_name": e(a["name"]), "album_short": e(a["short"]),
                "album_price": a["price"], "album_size": e(a["size"]), "album_cover": e(a["cover"]),
                "album_binding": e(a["binding"]), "album_photos": e(a["photos"]),
                "album_layout": e(a["layout"]), "album_tagline": e(a["tagline"]),
                "album_img": a["img"], "min_qty": C["albumMinQty"],
                # imaginea cu care pornește studioul (prima opțiune de copertă), aceeași ca în app.js
                "studio_img": (a["options"][0].get("img") if a["options"] else None) or a["img"],
            }
            fm = {k: fill(v, values) for k, v in front.items()}
            html, url, title, desc, smeta, qa = render(fm, fill(body, values), values, "album", a)
            (ROOT / url).write_text(html, encoding="utf8")
            write_md(html, url, title, desc, smeta)
            written.append(url)
            index_entries.append((url, title, desc, smeta, qa))
        continue
    name = path.stem
    html, url, title, desc, smeta, qa = render(front, body, {"min_qty": C["albumMinQty"]}, name)
    (ROOT / url).write_text(html, encoding="utf8")
    write_md(html, url, title, desc, smeta)
    written.append(url)
    index_entries.append((url, title, desc, smeta, qa))

# ------------------------------------------------------------------ sitemap, robots, llms.txt
order = ["index.html", "albume.html"] + [f"album-{a['id']}.html" for a in data["albums"]] + [
    "vestimentatie.html", "palarie.html", "esarfa.html", "insigna-cocarda.html", "pachete.html",
    "foto-video.html", "festivitati.html", "banchete.html", "premiere.html", "parade.html", "promotii.html",
    "termeni-si-conditii.html", "politica-de-confidentialitate.html"]
indexable = {u: (t, d, m, q) for u, t, d, m, q in index_entries if not m.get("noindex") and not m.get("unlisted")}
urls = [u for u in order if u in indexable] + sorted(u for u in indexable if u not in order)

(ROOT / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{absu(u)}</loc><lastmod>{TODAY}</lastmod><priority>{'1.0' if u == 'index.html' else '0.8' if u.startswith(('album', 'vestim')) else '0.6'}</priority></url>\n" for u in urls)
    + "</urlset>\n", encoding="utf8")

(ROOT / "robots.txt").write_text(
    "# Absolvire.ro — acces permis motoarelor de căutare și asistenților AI\n"
    "User-agent: *\nAllow: /\nDisallow: /_src/\n\n"
    + "".join(f"User-agent: {bot}\nAllow: /\n\n" for bot in ("GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended"))
    + f"Sitemap: {seo.SITE_URL}/sitemap.xml\n", encoding="utf8")

s = data["singles"]
o = data["outfit"]
llms = [
    f"# {seo.SITE_NAME}",
    "",
    f"> Absolvire.ro activează din {seo.FOUNDED}. Albume de absolvire cu selecție online a fotografiilor, vestimentație de absolvire (robă închiriată, pălărie, eșarfă, insignă sau cocardă, diplomă A4), fotografii pentru diplomă, servicii pentru festivitate și bal, diplome, medalii și decoruri. Clienții configurează produsele pe site și trimit o cerere de ofertă și disponibilitate; echipa confirmă oferta finală.",
    "",
    "Toate prețurile sunt în lei (RON) și sunt prețuri de referință; transportul, disponibilitatea și programarea se confirmă în oferta personalizată. Trimiterea cererii nu este comandă fermă.",
    "",
    f"Linkurile de mai jos duc la versiunea Markdown a fiecărei pagini; pagina HTML are aceeași adresă fără „.md” (ex. {absu('albume.html')}; prima pagină: {absu('index.html')}).",
    "",
    "## Albume de absolvire",
    f"Prețuri per elev pentru minimum {C['albumMinQty']} albume contra cost, cu ședința foto inclusă; sub prag, ofertă personalizată. De la {C['albumBonusMinQty']} albume plătite, 1 album gratuit pentru diriginte.",
]
for a in data["albums"]:
    llms.append(f"- [{a['name']}]({mdu('album-' + a['id'] + '.html')}): {lei(a['price'])}/elev — {a['size']}, {a['cover'].lower()}, {a['binding'].lower()}, {a['photos'].lower()}.")
llms += [
    f"- [Comparație modele]({mdu('albume.html')})",
    "",
    "## Vestimentație",
    f"- [Ținuta completă]({mdu('vestimentatie.html')}): robă închiriată + pălărie + eșarfă + insignă + diplomă A4, {lei(o['basePriceInsigna'])}/elev; cu cocardă {lei(o['basePriceCocarda'])}. Design comun pe capac +{lei(o['capCommonDesign'])}. De la {C['outfitBonusMinQty']} pachete plătite, 1 pachet gratuit pentru diriginte.",
    f"- [Pălărie]({mdu('palarie.html')}): {lei(s['palarie'])}/buc.",
    f"- [Eșarfă personalizată]({mdu('esarfa.html')}): {lei(s['esarfa'])}/buc.",
    f"- [Insignă / cocardă]({mdu('insigna-cocarda.html')}): insignă {lei(s['insigna'])}/buc., cocardă {lei(s['cocarda'])}/buc.",
    f"- [Pachete vestimentație + album]({mdu('pachete.html')}): ofertă personalizată, fără preț public.",
    "",
    "## Evenimente și alte produse",
    f"- [Foto și video]({mdu('foto-video.html')}): " + "; ".join(f"{x['name']} {lei(x['price'])}/{x['unit']}" for x in data["idPhotos"]) + ".",
    f"- [Festivități]({mdu('festivitati.html')}): " + "; ".join(f"{x['name']} ({price_label(x).lower()})" for x in data["festivalServices"]) + ".",
    f"- [Banchete]({mdu('banchete.html')}): " + ", ".join(x["name"] for x in data["banquetServices"]) + " — preț la cerere.",
    f"- [Premiere și diplome]({mdu('premiere.html')}): " + "; ".join(f"{x['name']} {lei(x['price'])}" for x in data["awards"]) + ".",
    f"- [Parade și decoruri]({mdu('parade.html')}): " + "; ".join(f"{x['name']} {lei(x['price'])}" for x in data["parade"]) + "; proiecte speciale la cerere.",
    f"- [Promoții]({mdu('promotii.html')})",
    "",
    "## Contact",
    f"Cererile de ofertă se trimit din site (pagina [Cererea mea]({mdu('cerere.html')})) sau direct:",
] + ([f"- Firma: {C['company']['name']}, {C['company']['city']}, {C['company']['region']}, {C['company']['street']} · CIF {C['company']['cif']} · {C['company']['regCom']}"] if C.get("company") else []) + ([f"- Telefon: {C['contact']['phone']}"] if C["contact"].get("phone") else []) + (
    [f"- Email: {C['contact']['email']}"] if C["contact"].get("email") else []) + [
    "",
    "## Întrebări frecvente",
]
seen = set()
for u in urls:
    for q, a in indexable[u][3]:
        if q not in seen:
            seen.add(q)
            llms.append(f"- **{q}** {a}")
llms += ["", "## Optional", f"- [Prima pagină]({mdu('index.html')})"] + [
    f"- [{t}]({mdu(u)})" for u, t in (("termeni-si-conditii.html", "Termeni și condiții"), ("politica-de-confidentialitate.html", "Politica de confidențialitate")) if u in indexable]
(ROOT / "llms.txt").write_text("\n".join(llms) + "\n", encoding="utf8")

print("Pagini generate:", ", ".join(written))
print("Plus: versiunile .md ale paginilor, sitemap.xml, robots.txt, llms.txt")
