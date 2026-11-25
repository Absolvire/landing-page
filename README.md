# Absolvire.ro — site static

Construit pe baza `xxx- cezar 2/Brief-site-Absolvire-v1.docx` (rev. 3), a machetelor din anexa A și a imaginilor reale din același folder.
HTML + CSS + JavaScript simplu, fără framework.

## Rulare locală

```bash
python3 -m http.server 8765 --directory landing-page
```

Apoi deschide http://localhost:8765. Rulează site-ul prin server, nu prin dublu-click pe fișier:
eșarfa colorată folosește o mască CSS, iar browserele nu o încarcă de pe `file://`.

## Pagini

| Pagină | Conținut |
|---|---|
| `index.html` | Carusel, avantaje, modelele de albume, „Toca ta. Designul tău.”, selecția foto online, categorii |
| `albume.html` | Toate modelele + tabel comparativ |
| `album-economy/velvet/deluxe/class/elite.html` | Pagina fiecărui album: simulator de copertă, estimare cu pragul de 15, interior, promoții asociate |
| `vestimentatie.html` | Configuratorul ținutei complete (robă, pălărie, eșarfă, insignă/cocardă, diplomă A4, bonus diriginte) |
| `palarie.html`, `esarfa.html`, `insigna-cocarda.html` | Configuratoarele individuale („Nu vreau ținuta completă”) |
| `foto-video.html`, `festivitati.html`, `banchete.html` | Fotografii pentru diplomă, servicii de festivitate și de banchet |
| `premiere.html`, `parade.html` | Diplome, medalii, plachete; steaguri, pancarte și proiecte speciale |
| `pachete.html`, `promotii.html` | Pachete vestimentație + album (fără preț public); oferte active cu filtre |
| `cerere.html` | „Cererea mea”: recapitulare, subtotal calculabil, poziții de confirmat, formular |

## Cum se editează

- **Prețuri, culori, albume, servicii, campanii, contacte**: `assets/js/data.js`. Paginile le citesc de acolo.
- **Texte, antet, subsol**: sursele sunt în `_src/`: `partials/` (antet, subsol, eșarfă, secțiunea foto) și `pages/` (corpul fiecărei pagini; `_album.html` e șablonul paginilor de album). După modificare rulează:

  ```bash
  python3 _src/build.py
  ```

  Scriptul (are nevoie de Python 3 și Node) regenerează fișierele `.html` și `.md` din rădăcină, `sitemap.xml`, `robots.txt` și `llms.txt`. Nu edita direct fișierele generate, pentru că se suprascriu la următorul build.
- **Stiluri**: `assets/css/style.css`. **Logică**: `assets/js/app.js`.
- **Hook la commit**: `.githooks/pre-commit` rulează `_src/build.py` înainte de fiecare commit și adaugă fișierele generate în același commit, ca site-ul publicat din `main` să fie mereu la zi. Se activează o singură dată în fiecare clonă:

  ```bash
  git config core.hooksPath .githooks
  ```

  Pentru un commit fără regenerare: `git commit --no-verify`.

## Imagini

- `assets/img/`: imaginile clientului convertite în WebP.
- `cocarda-<culoare>.webp`: fotografia reală a cocardei, cu rozeta recolorată pentru fiecare culoare din paletă și cu insigna reală (din prototipul `coduri html`) în centru.
- Eșarfa din previzualizare este fotografia reală a eșarfei albe, colorată prin mască CSS.
- **Imagini responsive**: imaginile mari din pagini au variante `<nume>-480.webp` și `<nume>-800.webp`, iar build-ul le pune în `srcset` / `sizes` (lățimile afișate sunt în `_src/image_sizes.json`). După ce adaugi sau schimbi o imagine mare într-o pagină, rulează `python3 _src/build.py`, apoi `python3 scripts/responsive_images.py` (are nevoie de `cwebp` și Google Chrome), apoi din nou `python3 _src/build.py`. `check_assets.py` oprește publicarea dacă rămân variante nefolosite.
- **Fonturi**: Inter, Playfair Display și Manrope sunt găzduite local în `assets/fonts/` (licență OFL), reduse la caracterele folosite pe site, cu declarațiile `@font-face` la începutul `style.css`. Fără cereri către Google Fonts.

## Performanță și accesibilitate (Lighthouse)

Toate paginile sunt verificate cu Lighthouse pe mobil și desktop (performanță, accesibilitate, bune practici, SEO). Ce le ține la 100:
- fonturi locale preîncărcate, fără CSS extern care blochează afișarea;
- imagini responsive, cu `width`/`height` pe fiecare `<img>` (fără salturi de pagină) și `fetchpriority="high"` pe imaginea principală;
- conținutul de catalog e scris în HTML de build, iar `app.js` nu îl mai re-randează la încărcare;
- auriul pentru text e `--gold-text` (contrast ≥ 4.5:1); `--gold` rămâne pentru linii și borduri;
- butoanele doar cu pictogramă au nume accesibil, zonele de atingere au minimum 24 × 24 px, titlurile respectă ordinea h1 → h2 → h3.

## De completat înainte de publicare

- **Campanii**: brief-ul cere ca ele să fie inactive la lansare. Pentru demo, 3 sunt activate în `data.js`; pune `active: false` ca să le ascunzi.
- **Contacte** (`config.contact`) și linkurile către platforma foto și cea de diplome.
- **Trimiterea cererii**: dacă `config.submitEndpoint` e gol, cererea se salvează doar în browser. Setează un endpoint ca să ajungă efectiv la echipă.
- **Paleta de eșarfe** (nume, coduri, imprimare albă/neagră) e preluată din prototipul clientului și trebuie confirmată cu catalogul oficial. La fel numele nuanțelor de catifea și ale funditelor pentru Velvet.
- Clipurile video ale albumelor, fotografii pentru medalii și plachete, pagini „Despre noi” / „Contact” / „Portofoliu”.

## SEO și GEO (motoare de căutare și motoare AI)

Totul se generează la `python3 _src/build.py`, din aceleași date (`assets/js/data.js` + `_src/seo.py`), deci prețurile din text, din întrebările frecvente și din datele structurate rămân sincronizate.

- **Conținut în HTML, nu doar în JavaScript**: albumele, prețurile, serviciile, promoțiile și recomandările sunt scrise direct în pagină (crawlerele AI de regulă nu rulează JavaScript).
- **Pe fiecare pagină**: titlu ≤ 60 caractere, descriere ≤ 160, `canonical`, Open Graph / Twitter, date structurate JSON-LD (Organization, BreadcrumbList, Product/Offer în lei, Service, FAQPage) și o secțiune vizibilă „Întrebări frecvente”.
- **`sitemap.xml`**, **`robots.txt`** (permite explicit GPTBot, ClaudeBot, PerplexityBot, Google-Extended etc.) și **`llms.txt`** (rezumatul site-ului cu prețuri și răspunsuri, pentru asistenții AI; linkurile duc la versiunile Markdown).
- **Versiuni Markdown**: fiecare pagină are o copie `<pagina>.md` (ex. `albume.md`, `index.md`), generată din conținutul paginii (`_src/md.py`), fără meniuri și controale interactive. E legată din `<head>` (`<link rel="alternate" type="text/markdown">`) și din `llms.txt`. Fișierele `.md` se generează în rădăcină, lângă paginile HTML, și se păstrează în depozit (site-ul se publică direct din ramura `main`).
- Toate paginile sunt indexabile (inclusiv `cerere.html`), ca toate să obțină 100 la Lighthouse SEO.

De verificat înainte de publicare: domeniul din `_src/seo.py` (`SITE_URL = "https://www.absolvire.ro"`). Dacă site-ul se publică pe alt domeniu, schimbă-l și rulează din nou build-ul. Când există contacte aprobate în `data.js`, ele apar automat și în datele structurate.

## Publicare (GitHub Pages)

La fiecare push pe `main`, workflow-ul `.github/workflows/pages.yml` rulează:

1. `python3 scripts/build.py` — rulează generatorul `_src/build.py` (cu `SITE_URL` setat automat la adresa reală a site-ului din GitHub Pages; cu domeniu propriu configurat în Pages devine `https://www.absolvire.ro`) și copiază în `dist/` doar fișierele publice, plus `.nojekyll`;
2. `python3 scripts/check_seo.py` — verifică fiecare pagină: un singur H1, titluri ≤ 60 și descrieri ≤ 160 caractere unice, canonical și Open Graph, JSON-LD (Organization, WebSite / BreadcrumbList, FAQPage), `alt` și `width`/`height` corecte pe imagini, linkuri și ancore interne, `sitemap.xml`, `robots.txt`, `llms.txt` și versiunile Markdown ale paginilor;
3. `python3 scripts/check_assets.py` — oprește publicarea dacă în `dist/assets` lipsește un fișier folosit sau există un fișier nefolosit;

apoi publică `dist/` pe GitHub Pages. Local, aceleași comenzi: `npm run build`, `npm run check:seo`, `npm run check:assets`.

Generatorul are nevoie de Python 3 și Node.js (citește catalogul din `assets/js/data.js`); ambele sunt disponibile pe runner-ul GitHub `ubuntu-latest`.
