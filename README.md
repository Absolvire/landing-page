# Absolvire — site de prezentare

Site static, în română, realizat pe baza paginilor și fotografiilor publice de la https://www.absolvire.ro/.

## Pornire

`npm run dev` — http://127.0.0.1:4174

`npm run build` — produce folderul `dist/`, pregătit pentru găzduire statică.

## Formular

În `index.html`, înlocuiește valoarea câmpului `access_key` (`test-test-test`) cu cheia publică Web3Forms validă pentru Absolvire. Valoarea actuală este intenționat blocată în JavaScript și afișează datele de contact, fără să pretindă că mesajul a fost trimis. Cu cheia validă, formularul trimite asincron la Web3Forms, concatenează detaliile cererii în mesaj, verifică răspunsul API și păstrează datele în caz de eroare. Trimiterea reală nu a fost testată cu cheia demonstrativă. Nu este folosită cheia altui proiect.

## Conținut și imagini

Fotografiile sunt stocate local în `assets/`; URL-urile sursă sunt în `assets/sources.json`. Au fost consultate paginile Acasă, Despre noi, Robe și eșarfe, Diplome și accesorii, Galerie foto-video, Festivități și baluri, Agenda festivității și Contact. Legătura veche către pagina Albume returna 404; fotografiile de albume provin din galerie. Nu sunt reproduse prețuri sau oferte din 2021.

Paletă: coral #e83d47, negru #191919, alb cald. Fonturile Manrope și DM Sans sunt încărcate prin Google Fonts; există fallback sans-serif.

Canonicalul și sitemapul presupun publicarea la https://www.absolvire.ro/. Actualizează-le dacă folosești alt domeniu. Legăturile juridice duc la site-ul original; verifică politicile înainte de lansare și actualizează-le pentru fluxul Web3Forms. Site-ul nu a fost publicat.

## Pagini de servicii

Sunt disponibile /robe-si-esarfe/, /diplome-si-accesorii/, /albume/ și /festivitati-si-baluri/. Cardurile și navigarea serviciilor leagă aceste pagini. Butoanele de ofertă preselectează serviciul în formularul de pe pagina principală. Galeria principală conține 12 fotografii. Pagina Albume a fost reconstruită folosind conținutul indexat al URL-ului original (accesul direct returnează 404); configurațiile se confirmă la ofertare.

## SEO și acces pentru agenți AI

`npm run build` rulează `scripts/seo.py`: metadate unice, canonical, Open Graph/Twitter, JSON-LD Organization/WebSite/WebPage/Service/BreadcrumbList, imagini responsive, sitemap și exporturi text `index.md`, `llms.txt`, `llms-full.txt`. HTML-ul conține tot conținutul fără JavaScript. `npm run check:seo` verifică distribuția generată. Modificați titlurile și descrierile în `scripts/seo.py`; metadatele generate se rescriu la build.

`llms.txt` este un ajutor de descoperire, nu un standard care garantează indexarea. robots.txt permite crawlerele; accesul real depinde și de hosting/CDN. Nu există garanții de poziționare sau citare AI.

La publicare: serviți dist/ la https://www.absolvire.ro/, configurați redirecționări permanente de la HTTP și domeniul fără www către canonical, evitați blocarea crawlerelor în firewall/CDN, trimiteți sitemap.xml în Google Search Console/Bing Webmaster Tools și verificați URL-urile în instrumentele lor. Verificați Core Web Vitals cu date reale după publicare. Rutele inexistente trebuie să răspundă 404; nu redirecționați orice URL către homepage. Setări recomandate pentru hosting: compresie Brotli/gzip, cache revalidabil pentru HTML și cache pentru assets. Site-ul nu a fost publicat în această sesiune.

## Vizualizator de eșarfe

21 de variante fotografice originale stocate în assets/scarves/; proveniența și paleta sunt în colors.json. Selectorul păstrează ultima imagine validă la eroare și ignoră încărcările vechi la clickuri rapide. Selectorul este doar o previzualizare; culoarea nu se transmite în formular. Inscripția PROMOȚIA afișează automat anul curent în fusul Europe/Bucharest. Fișierul decorativ din 2024 nu este folosit, astfel încât previzualizarea nu afișează o promoție învechită.
