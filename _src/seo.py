"""Configurare SEO / GEO pentru build.

- SITE_URL: domeniul public (schimbă-l dacă site-ul se publică pe alt domeniu).
- PAGES: titlu scurt (≤ 60 caractere), breadcrumb, imaginea de share, tipul paginii.
- faq(page, data): întrebări frecvente vizibile pe pagină + același conținut în FAQPage (JSON-LD).
  Răspunsurile folosesc valorile din assets/js/data.js, ca să nu rămână prețuri vechi în text.
  Conținutul respectă brief-ul: fără afirmații de exclusivitate, fără prețuri inventate.
"""

import os

# Pipeline-ul GitHub Pages setează SITE_URL din adresa reală a site-ului publicat
# (cu domeniu propriu configurat în Pages, devine automat https://www.absolvire.ro).
SITE_URL = (os.environ.get("SITE_URL") or "https://www.absolvire.ro").rstrip("/")
SITE_NAME = "Absolvire.ro"
LOCALE = "ro_RO"
LEGAL_UPDATED = "25 noiembrie 2026"  # data afișată pe paginile legale; schimb-o când modifici textele

HOME = ("Acasă", "index.html")
VEST = ("Vestimentație", "vestimentatie.html")

PAGES = {
    "index": {"title": "Albume de absolvire, robe și festivități | Absolvire.ro", "img": "assets/img/photo-wall.webp", "crumbs": []},
    "albume": {"title": "Albume de absolvire: modele și prețuri | Absolvire.ro", "img": "assets/img/velvet-cover-wide.webp", "crumbs": [("Albume", "albume.html")]},
    "vestimentatie": {"title": "Ținuta completă de absolvire, 100 lei | Absolvire.ro", "img": "assets/img/roba-visiniu-pack.webp", "crumbs": [VEST]},
    "palarie": {"title": "Pălărie de absolvire personalizată | Absolvire.ro", "img": "assets/img/palarie-visiniu-pers.webp", "crumbs": [VEST, ("Pălărie", "palarie.html")]},
    "esarfa": {"title": "Eșarfă de absolvire personalizată | Absolvire.ro", "img": "assets/img/esarfa-alba.webp", "crumbs": [VEST, ("Eșarfă", "esarfa.html")]},
    "insigna-cocarda": {"title": "Insignă și cocardă de absolvire | Absolvire.ro", "img": "assets/img/cocarda-visiniu.webp", "crumbs": [VEST, ("Insignă / cocardă", "insigna-cocarda.html")]},
    "foto-video": {"title": "Foto pentru diplomă și foto-video eveniment | Absolvire.ro", "img": "assets/img/photo-wall.webp", "crumbs": [("Foto și video", "foto-video.html")]},
    "festivitati": {"title": "Festivitatea de absolvire: servicii | Absolvire.ro", "img": "assets/img/photo-wall-2.webp", "crumbs": [("Festivități", "festivitati.html")]},
    "banchete": {"title": "Balul de absolvire: foto, DJ, decor | Absolvire.ro", "img": "assets/img/elite-int-5.webp", "crumbs": [("Banchete", "banchete.html")]},
    "premiere": {"title": "Diplome, medalii și plachete de absolvire | Absolvire.ro", "img": "assets/img/diploma-a4.webp", "crumbs": [("Premiere și diplome", "premiere.html")]},
    "parade": {"title": "Steaguri, pancarte și decoruri de absolvire | Absolvire.ro", "img": "assets/img/photo-wall-2.webp", "crumbs": [("Parade și decoruri", "parade.html")]},
    "pachete": {"title": "Pachete vestimentație + album | Absolvire.ro", "img": "assets/img/roba-negru-pack.webp", "crumbs": [VEST, ("Pachete vestimentație + album", "pachete.html")]},
    "promotii": {"title": "Promoții pentru absolvenți | Absolvire.ro", "img": "assets/img/velvet-int-3.webp", "crumbs": [("Promoții", "promotii.html")]},
    "termeni-si-conditii": {"title": "Termeni și condiții | Absolvire.ro", "img": "assets/img/photo-wall.webp", "crumbs": [("Termeni și condiții", "termeni-si-conditii.html")]},
    "politica-de-confidentialitate": {"title": "Politica de confidențialitate | Absolvire.ro", "img": "assets/img/photo-wall.webp", "crumbs": [("Politica de confidențialitate", "politica-de-confidentialitate.html")]},
    "cerere": {"title": "Cererea mea | Absolvire.ro", "img": "assets/img/photo-wall.webp", "crumbs": [("Cererea mea", "cerere.html")]},
    # GitHub Pages o afișează pentru orice adresă inexistentă, inclusiv în subfoldere: <base> ține
    # linkurile și resursele relative la rădăcina site-ului. Nu apare în sitemap, llms.txt sau Markdown.
    "404": {"title": "Pagina nu a fost găsită | Absolvire.ro", "img": "assets/img/photo-wall.webp",
            "crumbs": [("Pagina nu a fost găsită", "404.html")], "unlisted": True, "base": True},
}


def album_page(a):
    return {
        "title": f"Album de absolvire {a['name']}, {a['price']} lei/elev | Absolvire.ro",
        "img": a["img"],
        "crumbs": [("Albume", "albume.html"), (a["name"], f"album-{a['id']}.html")],
    }


def lei(n):
    return f"{n:,}".replace(",", ".") + " lei"


def faq(page, data, album=None):
    c = data["config"]
    o = data["outfit"]
    s = data["singles"]
    albums = data["albums"]
    min_q = c["albumMinQty"]
    bonus_q = c["outfitBonusMinQty"]
    price_list = ", ".join(f"{a['name']} {lei(a['price'])}" for a in albums)
    fest = {x["id"]: x for x in data["festivalServices"]}

    common = {
        "ferm": ("Trimiterea cererii este o comandă fermă?",
                 "Nu. Cererea de ofertă și disponibilitate nu constituie comandă fermă sau rezervare. Echipa Absolvire.ro analizează solicitarea și confirmă oferta, disponibilitatea, programarea și livrarea."),
        "transport": ("Transportul este inclus în preț?",
                      "Transportul nu este calculat automat pe site; se confirmă în oferta personalizată trimisă de echipă."),
    }

    if page == "index":
        return [
            ("Ce oferă Absolvire.ro?",
             "Albume de absolvire cu selecție online a fotografiilor, vestimentație de absolvire (robă închiriată, pălărie, eșarfă, insignă sau cocardă, diplomă), fotografii pentru diplomă, servicii pentru festivitate și bal, diplome, medalii și decoruri pentru parade — toate într-o singură cerere de ofertă."),
            ("Cât costă un album de absolvire?",
             f"Prețurile de referință sunt per elev, pentru minimum {min_q} albume contra cost: {price_list}. Ședința foto aferentă modelului este inclusă."),
            ("Cât costă ținuta completă de absolvire?",
             f"Ținuta completă (robă închiriată, pălărie, eșarfă, insignă și diplomă A4) costă {lei(o['basePriceInsigna'])} per elev; cu cocardă în loc de insignă, {lei(o['basePriceCocarda'])}."),
            ("Cum își aleg elevii fotografiile pentru album?",
             "După ședința foto, fiecare elev primește acces individual la platforma online cu fotografiile sale și își alege imaginile pentru pagina sa din album, de pe telefon sau calculator."),
            common["ferm"],
        ]
    if page == "albume":
        return [
            ("Cât costă un album de absolvire?",
             f"Prețurile de referință per elev sunt: {price_list}. Ele se aplică pentru minimum {min_q} albume contra cost și includ ședința foto aferentă modelului."),
            (f"Ce se întâmplă dacă clasa comandă mai puțin de {min_q} albume?",
             "Modelul și opțiunile alese se păstrează, iar cererea se trimite normal; prețul se stabilește printr-o ofertă personalizată pentru cantitatea respectivă."),
            ("Exemplarele gratuite intră în pragul minim?",
             f"Nu. Exemplarele gratuite apar separat și nu contribuie la pragul de {min_q} albume contra cost."),
            ("Fiecare elev are un album diferit?",
             "Nu. Toate exemplarele albumului clasei au același conținut; fiecare elev își alege fotografiile pentru pagina sa, iar paginile tuturor elevilor sunt reunite în albumul comun."),
            ("Primim și o variantă electronică a albumului?",
             "Da. Pe lângă albumul fizic, prezentarea ofertei include și varianta electronică (PDF) a albumului."),
        ]
    if page == "album" and album:
        a = album
        qa = [
            (f"Cât costă albumul {a['name']}?",
             f"Prețul de referință este {lei(a['price'])} per elev, pentru minimum {min_q} albume contra cost, cu ședința foto aferentă modelului inclusă. Sub prag, oferta se personalizează."),
            (f"Ce caracteristici are albumul {a['name']}?",
             f"Format {a['size']}, {a['cover'].lower()}, {a['binding'].lower()}, {a['photos'].lower()}. {a['layout']}"),
        ]
        if a.get("options"):
            names = ", ".join(x["name"] for x in a["options"])
            qa.append((f"Ce variante de copertă are albumul {a['name']}?",
                       f"{a['optionLabel']}: {names}. Previzualizarea din simulator este orientativă; macheta de producție urmează fluxul de aprobare."))
        return qa
    if page == "vestimentatie":
        return [
            ("Ce include ținuta completă de absolvire?",
             "Robă închiriată, pălărie cu panglică în culoarea eșarfei și ciucure cu medalionul anului, eșarfă personalizată cu instituția și promoția, insignă sau cocardă personalizată și diplomă A4 inclusă în preț."),
            ("Cât costă ținuta completă?",
             f"{lei(o['basePriceInsigna'])} per elev cu insignă și {lei(o['basePriceCocarda'])} cu cocardă. Designul comun pe capacul pălăriei costă +{lei(o['capCommonDesign'])}, iar diploma pe suport de catifea +{lei(o['diplomaVelvetUpgrade'])} per elev."),
            ("Dirigintele primește ținuta gratuit?",
             f"De la {bonus_q} pachete plătite, clasa primește 1 pachet gratuit pentru diriginte. Pachetul gratuit este evidențiat separat și nu contribuie la prag."),
            ("Roba se cumpără sau se închiriază?",
             "Roba se închiriază și se returnează; pălăria, eșarfa, insigna sau cocarda și diploma rămân amintire."),
            ("Pot cumpăra doar pălăria sau doar eșarfa?",
             f"Da. Pălăria ({lei(s['palarie'])}), eșarfa ({lei(s['esarfa'])}), insigna ({lei(s['insigna'])}) și cocarda ({lei(s['cocarda'])}) se pot comanda separat, cu cantități independente."),
        ]
    if page == "palarie":
        return [
            ("Cât costă o pălărie de absolvire?",
             f"{lei(s['palarie'])} bucata, cu bentiță colorată și ciucure cu anul promoției. De exemplu, 25 de pălării fără imprimare pe capac costă {lei(25 * s['palarie'])}."),
            ("Cum se personalizează capacul pălăriei?",
             f"Cu un design comun pentru toată clasa (+{lei(o['capCommonDesign'])} pe pălărie) sau cu un design individual încărcat de fiecare elev în platforma online (preț de confirmat)."),
            ("Pot alege culoarea panglicii separat?",
             "Da. La pălăria cumpărată separat, panglica se alege independent de culoarea pălăriei."),
        ]
    if page == "esarfa":
        return [
            ("Cât costă o eșarfă de absolvire personalizată?",
             f"{lei(s['esarfa'])} bucata, cu denumirea instituției și anul promoției incluse. De exemplu, 25 de eșarfe costă {lei(25 * s['esarfa'])}."),
            ("Ce culoare are imprimarea pe eșarfă?",
             "Imprimarea este albă sau neagră, stabilită pentru fiecare nuanță: neagră pe culorile deschise (de exemplu bej), albă pe cele închise (de exemplu vișiniu)."),
            ("Ce culori de eșarfă sunt disponibile?",
             ", ".join(f"{x['name']} (cod {x['code']})" for x in o["scarves"]) + "."),
        ]
    if page == "insigna-cocarda":
        return [
            ("Care este diferența dintre insignă și cocardă?",
             "Cocarda are aceeași insignă centrală, decorată cu o rozetă și panglici textile. Culoarea rozetei se alege separat."),
            ("Cât costă insigna și cocarda?",
             f"Insigna personalizată (Ø 6 cm) costă {lei(s['insigna'])} bucata, iar cocarda {lei(s['cocarda'])} bucata. De exemplu, 25 de cocarde costă {lei(25 * s['cocarda'])}."),
            ("Ce se personalizează pe insignă?",
             "Denumirea instituției, sigla instituției și anul promoției. Sigla se poate trimite și după cererea inițială."),
        ]
    if page == "foto-video":
        ff = fest.get("foto-fest", {})
        return [
            ("Cât costă fotografiile pentru diplomă?",
             "; ".join(f"{x['name']}: {lei(x['price'])}/{x['unit']}" for x in data["idPhotos"]) + "."),
            ("Cum se organizează fotografierea pentru diplomă?",
             "Prin reunirea mai multor clase interesate. Cererea transmite numărul participanților, clasele și localitatea, iar echipa confirmă data și locația."),
            ("Cât costă fotografierea festivității?",
             f"Fotografierea și filmarea festivității pornesc fiecare de la {lei(ff.get('price', 1500))} pe eveniment; prețul final se confirmă după disponibilitate și oraș."),
        ]
    if page == "festivitati":
        return [
            ("Ce servicii sunt disponibile pentru festivitatea de absolvire?",
             ", ".join(x["name"] for x in data["festivalServices"]) + "."),
            ("Cum se stabilește prețul pentru festivitate?",
             "Oferta se personalizează după locație, numărul participanților și serviciile dorite. Unele servicii au preț de pornire sau estimativ, celelalte sunt la cerere."),
            common["transport"],
        ]
    if page == "banchete":
        return [
            ("Ce servicii sunt disponibile pentru balul de absolvire?",
             ", ".join(x["name"] for x in data["banquetServices"]) + "."),
            ("Serviciile de banchet au aceleași tarife ca la festivitate?",
             "Nu. Serviciile pentru banchet au tarife proprii, separate de cele ale festivității, și se pot solicita individual sau reunite într-o ofertă de banchet."),
        ]
    if page == "premiere":
        return [
            ("Ce produse de premiere oferă Absolvire.ro?",
             "; ".join(f"{x['name']}: {lei(x['price'])}" for x in data["awards"]) + "."),
            ("Se pot completa listele de elevi după cerere?",
             "Da. Listele de elevi, mesajele și fotografiile se pot completa după solicitarea inițială; macheta se aprobă înainte de producție."),
        ]
    if page == "parade":
        return [
            ("Ce produse pentru parada de absolvire sunt disponibile?",
             "; ".join(f"{x['name']}: {lei(x['price'])}" for x in data["parade"]) + "."),
            ("Pot cere un decor sau un proiect special?",
             "Da. Descrieți ideea, dimensiunile aproximative și locul utilizării; echipa propune soluția de realizare după evaluare, cu preț de confirmat."),
        ]
    if page == "pachete":
        return [
            ("Ce conține pachetul vestimentație + album?",
             "Ținuta completă de absolvire și albumul clasei ales dintre modelele Economy, Velvet, Deluxe, Class sau Elite, cu ședința foto aferentă."),
            ("Pachetul are preț public?",
             "Nu. Pachetele complete se ofertează personalizat, după numărul de elevi și configurația aleasă."),
        ]
    if page == "promotii":
        return [
            ("Cum se acordă beneficiile unei promoții?",
             "Site-ul afișează beneficiul posibil pe baza informațiilor introduse. Eligibilitatea și beneficiul final se confirmă de echipa Absolvire.ro în oferta transmisă."),
        ]
    return []
