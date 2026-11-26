/* Absolvire.ro — logica paginilor (vanilla JS, fără dependențe).
   Fiecare funcție init* rulează doar dacă pagina conține elementele ei. */
(function () {
  "use strict";
  const D = window.ABS;
  const C = D.config;
  const O = D.outfit;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fmt = (n) => Number(n).toLocaleString("ro-RO", { maximumFractionDigits: 0 });
  const lei = (n) => `${fmt(n)} lei`;
  // Schimbă imaginea unui <img>. Paginile au srcset/sizes (variante -480/-800 ale imaginii inițiale),
  // care au prioritate față de src: la altă imagine le scoatem, altfel browserul ar afișa tot varianta veche.
  const setSrc = (img, src) => {
    if (!img || img.getAttribute("src") === src) return;
    img.removeAttribute("srcset"); img.removeAttribute("sizes");
    img.src = src;
  };
  // Varianta mică (480 px) a unei imagini de album, pentru miniaturi; scripts/responsive_images.py o
  // generează pentru toate imaginile albumelor, iar scripts/check_assets.py verifică existența ei.
  const small = (src) => String(src).replace(/\.webp$/, "-480.webp");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clampInt = (v, min) => Math.max(min, parseInt(v, 10) || 0);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scarfById = (id) => O.scarves.find((s) => s.id === id);
  const rosettes = O.scarves.concat(O.extraRosettes);
  const rosetteById = (id) => rosettes.find((s) => s.id === id);
  const cocardaImg = (id) => `assets/img/cocarda-${id}.webp`;
  const yearOf = (input) => clampInt(input && input.value, 0) || C.promoYear;
  const printWord = (s) => (s.print === "alb" ? "albă" : "neagră");

  /* ================= Comun ================= */
  $$("[data-year]").forEach((el) => (el.textContent = C.promoYear));
  $$("[data-now-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  $$("[data-album-min]").forEach((el) => (el.textContent = C.albumMinQty));

  const contactEl = $("[data-contact]");
  if (contactEl && (C.contact.phone || C.contact.email)) {
    contactEl.innerHTML = [
      C.contact.phone && `<a href="tel:${esc(C.contact.phone.replace(/\s/g, ""))}">${esc(C.contact.phone)}</a>`,
      C.contact.email && `<a href="mailto:${esc(C.contact.email)}">${esc(C.contact.email)}</a>`,
      C.contact.whatsapp && `<a href="https://wa.me/${esc(C.contact.whatsapp.replace(/\D/g, ""))}?text=${encodeURIComponent("Bună ziua! Aș dori o ofertă pentru absolvire.")}" rel="noopener">WhatsApp</a>`,
    ].filter(Boolean).join("<br>");
  }

  // Meniu mobil
  const menuBtn = $(".menu-toggle");
  const nav = $("#main-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = menuBtn.getAttribute("aria-expanded") !== "true";
      menuBtn.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("is-open")) menuBtn.click(); });
  }
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Steppere numerice (− / +)
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".stepper [data-step]");
    if (!b) return;
    const input = b.parentElement.querySelector("input");
    const min = parseInt(input.min, 10) || 0;
    input.value = Math.max(min, (parseInt(input.value, 10) || 0) + parseInt(b.dataset.step, 10));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  function swatchHtml(o, selected, group) {
    const bg = o.hex ? `style="--sw:${esc(o.hex)}"` : "";
    const hasImg = !o.hex && o.img;
    const code = o.code && o.code !== "—" ? o.code : "";
    return `<button type="button" class="sw${hasImg ? " has-img" : ""}${selected ? " is-on" : ""}" ${bg} data-sw="${esc(group)}" data-id="${esc(o.id)}" aria-pressed="${selected}" title="${esc(o.name)}${code ? " · cod " + esc(code) : ""}">
      <span class="sw-chip">${hasImg ? `<img src="${esc(o.img)}" alt="">` : ""}</span><span class="sw-name">${esc(o.name)}${code ? `<small>cod ${esc(code)}</small>` : ""}</span></button>`;
  }
  function markSwatches(root, group, id) {
    $$(`[data-sw='${group}']`, root).forEach((b) => { const on = b.dataset.id === id; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); });
  }

  // Eșarfa (componentă comună: ținuta completă + pagina eșarfei)
  function paintStole(root, scarf, inst, year) {
    const st = $("[data-stole]", root);
    if (!st) return;
    st.style.setProperty("--stole", scarf.hex);
    st.classList.toggle("print-white", scarf.print === "alb");
    $("[data-stole-inst]", st).textContent = inst || "Instituția voastră";
    $("[data-stole-year]", st).textContent = year;
  }

  // Bentița pălăriei: stratul extras din fotografie, colorat în culoarea aleasă
  function paintBand(el, robe, hex) {
    if (!el || !robe.band) return;
    const url = `url("${new URL(robe.band, location.href).href}")`;
    el.style.webkitMaskImage = url;
    el.style.maskImage = url;
    el.style.setProperty("--band", hex);
    const shade = $("img", el);
    setSrc(shade, robe.band);
  }

  function priceBox(lines, totalLabel, qtyLabel, unitLabel, total) {
    return `<div class="pb-lines">${lines.map(([a, b]) => `<div><span>${a}</span><span>${b}</span></div>`).join("")}</div>
      <div class="pb-total"><span>${totalLabel} <small>(${qtyLabel})</small></span><span>${unitLabel ? `<em>${unitLabel}</em>` : ""}<b>${total}</b></span></div>`;
  }

  /* ---------- Campanii active (datele includ offset-ul Europe/Bucharest) ---------- */
  const now = Date.now();
  const isLive = (c) => c.active && (!c.start || Date.parse(c.start) <= now) && (!c.end || Date.parse(c.end) >= now);
  const byPriority = (a, b) => (a.priority || 99) - (b.priority || 99);
  const liveCampaigns = D.campaigns.filter(isLive).sort(byPriority);
  // Campanii încheiate păstrate doar pe pagina de promoții, cu mențiunea „s-a încheiat”.
  const endedCampaigns = D.campaigns.filter((c) => c.active && c.showEnded && c.end && Date.parse(c.end) < now).sort(byPriority);
  const fmtDate = (d) => new Date(d).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" });
  const period = (c) => {
    const f = fmtDate;
    if (c.schoolYear) return `Anul școlar ${c.schoolYear}`;
    if (c.start && c.end) return `${f(c.start)} – ${f(c.end)}`;
    if (c.end) return `până la ${f(c.end)}`;
    return "Perioadă de confirmat";
  };
  function promoLines(box, list) {
    if (!box) return;
    box.hidden = !list.length;
    $("ul", box).innerHTML = list.map((c) => `<li><strong>${esc(c.title)}</strong> — ${esc(c.short)} <a href="promotii#promo-${esc(c.id)}">Vezi detalii →</a></li>`).join("");
  }
  $$("[data-promo-lines]").forEach((box) => promoLines(box, liveCampaigns.filter((c) => c.categories.includes(box.dataset.promoLines))));

  /* ================= Cererea mea: stocare ================= */
  const KEY = "absolvire-cerere-v1";
  let cart = [];
  let renderCart = null;
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) { cart = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (_) {} updateBadge(); };
  function updateBadge() { $$("[data-cart-count]").forEach((b) => { b.textContent = cart.length; b.hidden = !cart.length; }); }
  function addToCart(item) {
    item.uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    item.addedAt = new Date().toISOString();
    cart.push(item); save();
    if (renderCart) renderCart();
    toast(`„${item.title}” a fost adăugat în cerere.`, true);
  }
  function lineState(it) {
    if (it.mode === "album") {
      const ok = it.qty >= it.threshold;
      const free = it.qty >= (it.bonusMin || C.albumBonusMinQty) ? 1 : 0; // 1 album gratuit pentru diriginte, calculat din cantitatea plătită
      return { calc: ok ? it.qty * it.unitPrice : null, free, label: ok ? lei(it.qty * it.unitPrice) : "Ofertă personalizată pentru această cantitate" };
    }
    if (it.mode === "fixed") {
      const free = it.bonusMin && it.qty >= it.bonusMin ? 1 : 0;
      return { calc: it.qty * it.unitPrice, free, label: lei(it.qty * it.unitPrice) };
    }
    if (it.mode === "from") return { calc: null, label: `de la ${lei(it.unitPrice)} / ${it.unit}` };
    if (it.mode === "estimate") return { calc: null, label: `estimativ ${lei(it.unitPrice)} / ${it.unit} (≈ ${lei(it.unitPrice * it.qty)})` };
    return { calc: null, label: "Preț de confirmat" };
  }
  // Caseta „Bonus pentru diriginte” (ținută și albume): 1 bucată gratuită de la pragul de bucăți plătite.
  const bonusBox = (title, sub) => `<div class="pb-bonus"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2-4-6-4-6-1s6 1 6 1Zm0 0c2-4 6-4 6-1s-6 1-6 1Z"/></svg><div><b>${title}</b><small>${sub}</small></div><span>0 lei</span></div>`;
  function freeLabel(it, n) {
    if (it.kind === "album") return "album pentru diriginte";
    return it.freeLabel || "gratuit";
  }

  const toastEl = $("[data-toast]");
  let toastT;
  function toast(msg, withLink) {
    toastEl.innerHTML = `<span>${esc(msg)}</span>${withLink ? `<a href="cerere">Vezi cererea</a>` : ""}`;
    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add("is-on"));
    clearTimeout(toastT);
    toastT = setTimeout(() => { toastEl.classList.remove("is-on"); setTimeout(() => (toastEl.hidden = true), 300); }, 3800);
  }
  updateBadge();

  /* ================= Acord cookie-uri (Google Analytics prin GTM) =================
     GTM se încarcă mereu din <head> (layout.html), cu Consent Mode; aici doar banner-ul, „Setări cookie” și actualizarea acordului. */
  (function initConsent() {
    const box = $("[data-consent]");
    if (!box) return;
    const CKEY = "absolvire-consent";
    const MAX_AGE = 365 * 864e5; // alegerea e cerută din nou după 12 luni
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(CKEY) || "null"); } catch (_) {}
    const decided = stored && (stored.v === "granted" || stored.v === "denied") && Date.now() - stored.t < MAX_AGE;
    const open = (focus) => { box.hidden = false; if (focus) $("[data-consent-choice]", box).focus(); };
    if (!decided) open(false);

    // Șterge cookie-urile Google Analytics (_ga, _ga_XXXX, _gid) de pe domeniul curent și de pe domeniul părinte.
    function clearGaCookies() {
      const host = location.hostname;
      const domains = ["", host, "." + host.replace(/^www\./, "")];
      document.cookie.split(";").map((c) => c.split("=")[0].trim())
        .filter((n) => /^(_ga|_gid|_gat)/.test(n))
        .forEach((n) => domains.forEach((d) => {
          document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ""}`;
        }));
    }

    $$("[data-consent-choice]", box).forEach((b) => b.addEventListener("click", () => {
      const v = b.dataset.consentChoice;
      try { localStorage.setItem(CKEY, JSON.stringify({ v, t: Date.now() })); } catch (_) {}
      if (v === "granted") {
        if (window.gtag) window.gtag("consent", "update", { analytics_storage: "granted" });
      } else {
        if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied" });
        clearGaCookies();
      }
      box.hidden = true;
      toast(v === "granted" ? "Mulțumim! Am activat cookie-urile de analiză." : "Am reținut: doar cookie-urile necesare.");
    }));
    $$("[data-consent-open]").forEach((b) => b.addEventListener("click", () => open(true)));
  })();

  /* ================= Carusel (prima pagină) ================= */
  (function initHero() {
    const track = $("[data-hero-track]");
    if (!track) return;
    liveCampaigns.filter((c) => c.homepage).forEach((c) => {
      const art = document.createElement("article");
      art.className = "slide slide-promo";
      art.dataset.slide = "";
      art.setAttribute("aria-roledescription", "slide");
      art.innerHTML = `
        <div class="slide-media"><img data-src="${esc(c.img)}" alt=""></div>
        <div class="wrap slide-body">
          <p class="eyebrow">Promoție · ${esc(c.categories.map(cap).join(" · "))}</p>
          <h2 class="slide-title">${esc(c.title)}<em>${esc(c.slogan)}</em></h2>
          <p class="slide-lead">${esc(c.short)}</p>
          <div class="slide-cta"><a class="btn btn-primary" href="promotii#promo-${esc(c.id)}">Descoperă promoția <span aria-hidden="true">→</span></a></div>
        </div>`;
      track.appendChild(art);
    });
    const slides = $$("[data-slide]", track);
    if (slides.length < 2) return; // doar slide-ul general → fără comenzi
    $("[data-hero-controls]").hidden = false;
    const dots = $("[data-hero-dots]"), count = $("[data-hero-count]"), pauseBtn = $("[data-hero-pause]");
    slides.forEach((s, i) => {
      s.setAttribute("aria-label", `${i + 1} din ${slides.length}`);
      const d = document.createElement("button");
      d.type = "button"; d.setAttribute("role", "tab"); d.setAttribute("aria-label", `Slide ${i + 1}`);
      d.addEventListener("click", () => { go(i); restart(); });
      dots.appendChild(d);
    });
    let idx = 0, timer = null, userPaused = reduceMotion, hoverPaused = false;
    const reveal = (s) => { const img = s && $("img[data-src]", s); if (img) { img.src = img.dataset.src; img.removeAttribute("data-src"); } };
    function go(i) {
      idx = (i + slides.length) % slides.length;
      reveal(slides[idx]); if (document.readyState === "complete") reveal(slides[(idx + 1) % slides.length]); // curent + următorul
      slides.forEach((s, k) => { s.classList.toggle("is-active", k === idx); s.setAttribute("aria-hidden", String(k !== idx)); s.inert = k !== idx; });
      $$("button", dots).forEach((d, k) => d.setAttribute("aria-selected", String(k === idx)));
      count.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    }
    function restart() { clearInterval(timer); if (!userPaused && !hoverPaused) timer = setInterval(() => go(idx + 1), C.carouselInterval); }
    function setPaused(p) { userPaused = p; pauseBtn.setAttribute("aria-pressed", String(p)); pauseBtn.setAttribute("aria-label", p ? "Pornește rotația" : "Oprește rotația"); pauseBtn.classList.toggle("is-paused", p); restart(); }
    $("[data-hero-prev]").addEventListener("click", () => { go(idx - 1); restart(); });
    $("[data-hero-next]").addEventListener("click", () => { go(idx + 1); restart(); });
    pauseBtn.addEventListener("click", () => setPaused(!userPaused));
    const hero = $(".hero");
    hero.addEventListener("mouseenter", () => { hoverPaused = true; restart(); });
    hero.addEventListener("mouseleave", () => { hoverPaused = false; restart(); });
    hero.addEventListener("focusin", () => { hoverPaused = true; restart(); });
    hero.addEventListener("focusout", () => { hoverPaused = false; restart(); });
    let x0 = null;
    hero.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    hero.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) { go(idx + (dx < 0 ? 1 : -1)); restart(); }
    });
    go(0); setPaused(userPaused);
    // după încărcarea paginii: imaginea slide-ului următor, ca să fie gata la prima rotație
    if (document.readyState === "complete") reveal(slides[1]); else window.addEventListener("load", () => reveal(slides[1]), { once: true });
  })();

  /* ================= „Toca ta. Designul tău.” (prima pagină) ================= */
  (function initCapModes() {
    const box = $("[data-cap-modes]"), visual = $("[data-cap-visual]");
    if (!box || !visual) return;
    const KEY = { none: "hat", common: "hatPers", individual: "hatIndividual" };
    const LABEL = { none: "fără personalizare", common: "cu design comun al clasei", individual: "cu design individual (exemplu)" };
    // Preîncarc variantele când vizitatorul ajunge la carduri (nu la încărcarea paginii), ca schimbarea să fie instantanee.
    const preload = () => O.robes.forEach((r) => Object.values(KEY).forEach((k) => { if (r[k]) new Image().src = r[k]; }));
    ["pointerenter", "focusin", "touchstart"].forEach((ev) => box.addEventListener(ev, preload, { once: true, passive: true }));
    function set(mode) {
      $$("[data-cap-mode]", box).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.capMode === mode)));
      $$("[data-cap-robe]", visual).forEach((img) => {
        const r = O.robes.find((x) => x.id === img.dataset.capRobe);
        if (!r || !r[KEY[mode]]) return;
        setSrc(img, r[KEY[mode]]);
        img.alt = `Pălărie ${r.name.toLowerCase()} ${LABEL[mode]}`;
      });
      $("[data-cap-note]", visual).hidden = mode !== "individual";
      visual.dataset.mode = mode;
    }
    box.addEventListener("click", (e) => { const b = e.target.closest("[data-cap-mode]"); if (b) set(b.dataset.capMode); });
  })();

  /* ================= Albume ================= */
  // Blocurile de catalog sunt scrise direct în HTML de _src/build.py, identic cu randarea de mai jos;
  // scriptul le randează doar dacă lipsesc (fără muncă dublă și fără elemente noi la încărcare).
  const prerendered = (el) => el.firstElementChild !== null;
  const albums = D.albums;
  const albumUrl = (a) => `album-${a.id}.html`;

  $$("[data-album-cards]").forEach((box) => {
    if (prerendered(box)) return;
    box.innerHTML = albums.map((a) => `
      <article class="album-card">
        <a class="album-card-img" href="${albumUrl(a)}" tabindex="-1" aria-hidden="true"><img src="${esc(a.img)}" alt="Album de absolvire ${esc(a.name)}" loading="lazy"></a>
        <div class="album-card-body">
          <h3><a href="${albumUrl(a)}">${esc(a.name)}</a></h3>
          <p class="price"><b>${fmt(a.price)}</b> lei / elev</p>
          <p class="album-card-text">${esc(a.short)}</p>
          <p class="spec-line">${esc(a.size)} · ${esc(a.photos)}</p>
          <a class="btn btn-primary btn-sm" href="${albumUrl(a)}">Vezi detalii <span aria-hidden="true">→</span></a>
        </div>
      </article>`).join("");
  });

  (function initCompare() {
    const t = $("[data-compare]");
    if (!t || prerendered($("tbody", t))) return;
    const rows = [["Preț de referință*", (a) => `<b>${fmt(a.price)} lei</b> / elev`], ["Dimensiune", (a) => esc(a.size)], ["Copertă", (a) => esc(a.cover)], ["Pagini", (a) => esc(a.binding)], ["Fotografii", (a) => esc(a.photos)], ["Distribuția elevilor", (a) => esc(a.layout)], ["", (a) => `<a class="btn btn-outline btn-sm" href="${albumUrl(a)}">Configurează</a>`]];
    $("thead", t).innerHTML = `<tr><th scope="col"><span class="sr">Caracteristică</span></th>${albums.map((a) => `<th scope="col"><img src="${esc((a.options[0] && a.options[0].img) || a.img)}" alt="" loading="lazy">${esc(a.name)}</th>`).join("")}</tr>`;
    $("tbody", t).innerHTML = rows.map(([k, f]) => `<tr><th scope="row">${k}</th>${albums.map((a) => `<td>${f(a)}</td>`).join("")}</tr>`).join("")
      + `<tr class="foot"><td colspan="${albums.length + 1}">* Pentru minimum ${C.albumMinQty} albume contra cost. Sub prag, oferta se personalizează pentru cantitatea cerută.</td></tr>`;
  })();

  (function initStudio() {
    const root = $("[data-album-studio]");
    if (!root) return;
    const m = albums.find((a) => a.id === document.body.dataset.album) || albums[0];
    const st = { opt1: m.options[0] || null, opt2: (m.options2 || [])[0] || null, view: -1 };

    if (!prerendered($("[data-model-tabs]"))) $("[data-model-tabs]").innerHTML = albums.map((a) => `<a href="${albumUrl(a)}"${a.id === m.id ? ' aria-current="page" class="is-on"' : ""}>${esc(a.name)}</a>`).join("");
    const f1 = $("[data-studio-opt1]"), f2 = $("[data-studio-opt2]");
    f1.hidden = !m.options.length;
    f2.hidden = !(m.options2 && m.options2.length);
    if (!f1.hidden) { $("[data-opt1-label]").textContent = m.optionLabel; $("[data-opt1-list]").innerHTML = m.options.map((o) => swatchHtml(o, false, "opt1")).join(""); }
    if (!f2.hidden) { $("[data-opt2-label]").textContent = m.option2Label; $("[data-opt2-list]").innerHTML = m.options2.map((o) => swatchHtml(o, false, "opt2")).join(""); }
    $("[data-qty-step]").textContent = 1 + (!f1.hidden) + (!f2.hidden);
    if (!prerendered($("[data-interior]"))) $("[data-interior]").innerHTML = m.interior.map((it, i) => `<li><button type="button" data-view="${i}"><img src="${esc(small(it.img))}" alt="${esc(m.name)} — ${esc(it.title)}" loading="lazy"></button><span>${esc(it.title)}</span></li>`).join("");
    promoLines($("[data-album-promos]"), liveCampaigns.filter((c) => (c.albums || []).includes(m.id)));

    // Modele cu o singură fotografie (Velvet): straturile extrase din fotografie (catifea, fundiță)
    // se colorează în nuanțele alese — atât în imaginea mare, cât și în miniatura copertei.
    const recolor = m.recolor ? Object.entries(m.recolor) : [];
    const layersHtml = () => recolor.map(([opt, img]) => `<span class="recolor-layer" data-recolor="${esc(opt)}" style="--c:${esc(st[opt] ? st[opt].hex : "transparent")};-webkit-mask-image:url('${esc(new URL(img, location.href).href)}');mask-image:url('${esc(new URL(img, location.href).href)}')"><img src="${esc(img)}" alt=""></span>`).join("");
    if (recolor.length) $("[data-studio-img]").insertAdjacentHTML("afterend", layersHtml());

    function render() {
      if (st.opt1) { $("[data-opt1-name]").textContent = st.opt1.name; markSwatches(root, "opt1", st.opt1.id); }
      if (st.opt2) { $("[data-opt2-name]").textContent = st.opt2.name; markSwatches(root, "opt2", st.opt2.id); }
      const coverImg = (st.opt1 && st.opt1.img) || m.img;
      const thumbs = [{ img: coverImg, title: "Coperta" }].concat(m.interior);
      $("[data-studio-thumbs]").innerHTML = thumbs.map((t, i) => `<button type="button" class="${i - 1 === st.view ? "is-on" : ""}" data-view="${i - 1}" aria-label="${esc(t.title)}"><img src="${esc(small(t.img))}" alt="" loading="lazy">${i === 0 ? layersHtml() : ""}</button>`).join("");
      const cur = st.view < 0 ? { img: coverImg, title: "Coperta" } : m.interior[st.view];
      const stage = $("[data-studio-img]");
      setSrc(stage, cur.img); stage.alt = `Album ${m.name} — ${cur.title}`;
      stage.parentElement.classList.toggle("is-spread", st.view >= 0);
      $$(".studio-stage [data-recolor]", root).forEach((el) => { el.hidden = st.view >= 0; el.style.setProperty("--c", st[el.dataset.recolor].hex); });
      const badge = $("[data-studio-badge]"), capEl = $("[data-studio-caption]");
      if (st.view < 0 && recolor.length) {
        badge.hidden = true;
        capEl.textContent = `Previzualizare orientativă pe fotografia reală a albumului: ${m.optionLabel.toLowerCase()} ${st.opt1.name.toLowerCase()}${st.opt2 ? `, ${m.option2Label.toLowerCase()} ${st.opt2.name.toLowerCase()}` : ""}. Nuanța finală se confirmă pe mostra de material.`;
      } else if (st.view < 0 && m.photographed && st.opt1) {
        const sel = `catifea ${st.opt1.name.toLowerCase()}${st.opt2 ? ` cu fundă ${st.opt2.name.toLowerCase()}` : ""}`;
        badge.hidden = false;
        badge.innerHTML = `<i style="--a:${esc(st.opt1.hex)};--b:${esc(st.opt2 ? st.opt2.hex : st.opt1.hex)}"></i>Selecția ta: ${esc(sel)}`;
        capEl.textContent = sel === m.photographed ? "Fotografia prezintă exact combinația aleasă." : `Fotografia prezintă exemplarul real cu ${m.photographed}; culorile alese apar în mostră.`;
      } else {
        badge.hidden = true;
        capEl.textContent = st.view < 0 ? (st.opt1 ? `${m.optionLabel}: ${st.opt1.name}${st.opt1.code ? " (cod " + st.opt1.code + ")" : ""}` : "Model cu aspect unic — se prezintă produsul exact.") : cur.title;
      }
      renderEstimate();
    }
    root.addEventListener("click", (e) => {
      const sw = e.target.closest("[data-sw]");
      if (sw) { st[sw.dataset.sw] = (sw.dataset.sw === "opt1" ? m.options : m.options2).find((o) => o.id === sw.dataset.id); st.view = -1; render(); }
      const v = e.target.closest("[data-view]");
      if (v) { st.view = parseInt(v.dataset.view, 10); render(); }
    });
    $("[data-interior]").addEventListener("click", (e) => {
      const v = e.target.closest("[data-view]"); if (!v) return;
      st.view = parseInt(v.dataset.view, 10); render();
      root.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
    const qtyIn = $("[data-album-qty]");
    qtyIn.addEventListener("input", renderEstimate);
    function renderEstimate() {
      const qty = clampInt(qtyIn.value, 1), free = qty >= C.albumBonusMinQty ? 1 : 0;
      const ok = qty >= C.albumMinQty;
      $("[data-album-estimate]").innerHTML = (ok
        ? `<div class="est-row"><span>${qty} albume × ${lei(m.price)}</span><b>${lei(qty * m.price)}</b></div><p class="micro">Valoare estimată, cu ședința foto aferentă modelului inclusă.</p>`
        : `<div class="est-row quote"><span>Ofertă personalizată pentru această cantitate</span><b>Preț de confirmat</b></div><p class="micro">Modelul și opțiunile se păstrează; cererea se trimite normal.</p>`)
        + (free
          ? bonusBox("Bonus: 1 album pentru diriginte", `${qty} albume plătite + 1 album gratuit`)
          : `<p class="pb-hint">Bonus pentru diriginte de la ${C.albumBonusMinQty} albume plătite.</p>`);
    }
    $("[data-album-add]").addEventListener("click", () => {
      const qty = clampInt(qtyIn.value, 1);
      const cls = $("[data-album-class]").value.trim();
      const details = [`${m.size} · ${m.cover.toLowerCase()} · ${m.photos}`];
      if (st.opt1) details.push(`${m.optionLabel}: ${st.opt1.name}${st.opt1.code ? " (cod " + st.opt1.code + ")" : ""}`);
      if (st.opt2) details.push(`${m.option2Label}: ${st.opt2.name}`);
      if (cls) details.push(`Clasa: ${cls}`);
      addToCart({ kind: "album", cat: "Albume", title: `Album ${m.name}`, details, qty, unitPrice: m.price, unit: "album", mode: "album", threshold: C.albumMinQty, bonusMin: C.albumBonusMinQty });
    });
    render();
  })();

  /* ================= Ținuta completă ================= */
  (function initOutfit() {
    const root = $("[data-outfit]");
    if (!root) return;
    const st = { robe: O.robes.find((r) => r.id === "visiniu") || O.robes[0], scarf: scarfById("bej") || O.scarves[0], badge: "insigna", rosette: null, rosetteManual: false, cap: "none", diploma: "a4" };
    const yearIn = $("[data-o-year]"); yearIn.value = C.promoYear;
    $("[data-o-robes]").innerHTML = O.robes.map((r) => `<button type="button" class="robe-pick" data-robe="${esc(r.id)}" aria-pressed="false"><img src="${esc(r.img)}" alt="" loading="lazy"><span>${esc(r.name)}</span></button>`).join("");
    $("[data-o-scarves]").innerHTML = O.scarves.map((s) => swatchHtml(s, false, "scarf")).join("");
    $("[data-o-rosettes]").innerHTML = rosettes.map((s) => swatchHtml(s, false, "rosette")).join("");

    // Robă neagră → recomandare în culoarea eșarfei; robă colorată → culoarea robei.
    const recommended = () => (st.robe.id === "negru" ? st.scarf : rosetteById(st.robe.id) || st.scarf);

    function render() {
      if (!st.rosetteManual) st.rosette = recommended();
      const rec = recommended();
      $$("[data-robe]", root).forEach((b) => { const on = b.dataset.robe === st.robe.id; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); });
      markSwatches(root, "scarf", st.scarf.id);
      markSwatches(root, "rosette", st.rosette.id);
      $("[data-o-robe-name]").textContent = st.robe.name;
      $("[data-o-scarf-name]").textContent = `${st.scarf.name} · cod ${st.scarf.code}`;
      $("[data-o-print]").innerHTML = `<i style="--sw:${esc(st.scarf.hex)}"></i>Imprimare <b>${printWord(st.scarf)}</b> pe eșarfa ${esc(st.scarf.name.toLowerCase())}. Panglica pălăriei preia culoarea eșarfei.`;
      $("[data-o-rosette]").hidden = st.badge !== "cocarda";
      $("[data-o-rosette-name]").textContent = st.rosette.name;
      $("[data-o-rosette-rec]").textContent = st.rosette.id === rec.id ? "recomandat" : `recomandat: ${rec.name}`;
      setSrc($("[data-o-cocarda-thumb]"), cocardaImg(st.rosette.id));

      setSrc($("[data-o-robe]"), st.robe.img);
      setSrc($("[data-o-hat]"), st.cap === "none" ? st.robe.hat : st.robe.hatPers);
      paintBand($("[data-o-band]"), st.robe, st.scarf.hex);
      $$("[data-o-cap-thumb]", root).forEach((img) => (setSrc(img, img.dataset.oCapThumb === "plain" ? st.robe.hat : st.robe.hatPers)));
      $("[data-o-cap-name]").textContent = { none: "fără personalizare", common: "design comun", individual: "design individual" }[st.cap];
      $("[data-o-cap-common]").hidden = st.cap !== "common";
      $("[data-o-cap-individual]").hidden = st.cap !== "individual";
      paintStole(root, st.scarf, $("[data-o-inst]").value.trim(), yearOf(yearIn));
      const badge = $("[data-o-badge]");
      badge.classList.toggle("is-cocarda", st.badge === "cocarda");
      setSrc($("img", badge), st.badge === "cocarda" ? cocardaImg(st.rosette.id) : O.insignaImg);

      const qty = clampInt($("[data-o-qty]").value, 1);
      const base = st.badge === "cocarda" ? O.basePriceCocarda : O.basePriceInsigna;
      const capAdd = st.cap === "common" ? O.capCommonDesign : 0;
      const dipAdd = st.diploma === "catifea" ? O.diplomaVelvetUpgrade : 0;
      const unit = base + capAdd + dipAdd;
      const bonus = qty >= C.outfitBonusMinQty;
      const lines = [
        [`Pachet de bază <small>(robă + pălărie + eșarfă + insignă + diplomă A4)</small>`, `${O.basePriceInsigna} lei / pachet`],
        st.badge === "cocarda" && ["Cocardă în loc de insignă", `+${O.basePriceCocarda - O.basePriceInsigna} lei / pachet`],
        capAdd && ["Design comun pe capacul pălăriei", `+${capAdd} lei / pachet`],
        dipAdd && ["Diplomă pe suport de catifea", `+${dipAdd} lei / elev`],
      ].filter(Boolean);
      $("[data-o-price]").innerHTML = priceBox(lines, st.cap === "individual" ? "Subtotal cunoscut" : "Total estimat", `${qty} pachete plătite`, `${unit} lei / pachet`, lei(unit * qty))
        + (st.cap === "individual" ? `<p class="pb-pending">Design individual pe pălărie: <b>preț de confirmat</b> — se adaugă separat în ofertă.</p>` : "")
        + `<p class="pb-dip">Diploma A4 este inclusă în preț.</p>`
        + (bonus ? bonusBox("Bonus: 1 pachet pentru diriginte", `${qty} pachete plătite + 1 pachet gratuit`)
          : `<p class="pb-hint">Bonus pentru diriginte de la ${C.outfitBonusMinQty} pachete plătite.</p>`);
      $("[data-o-summary]").innerHTML = `<b>Alegerea voastră:</b> Robă ${esc(st.robe.name.toLowerCase())} · Eșarfă ${esc(st.scarf.name.toLowerCase())} (imprimare ${printWord(st.scarf)}) · ${st.badge === "cocarda" ? `Cocardă cu rozetă ${esc(st.rosette.name.toLowerCase())}` : "Insignă"} · Pălărie ${esc(st.robe.name.toLowerCase())} cu panglică ${esc(st.scarf.name.toLowerCase())}${st.cap === "common" ? ", design comun" : st.cap === "individual" ? ", design individual" : ""} · ${st.diploma === "catifea" ? "Diplomă pe catifea" : "Diplomă A4 inclusă"}`;
      return { qty, unit };
    }
    root.addEventListener("click", (e) => {
      const r = e.target.closest("[data-robe]");
      if (r) { st.robe = O.robes.find((x) => x.id === r.dataset.robe); render(); return; }
      const sw = e.target.closest("[data-sw]"); if (!sw) return;
      if (sw.dataset.sw === "scarf") st.scarf = scarfById(sw.dataset.id);
      if (sw.dataset.sw === "rosette") { st.rosette = rosetteById(sw.dataset.id); st.rosetteManual = true; }
      render();
    });
    const form = $("[data-outfit-form]");
    form.addEventListener("change", (e) => {
      if (e.target.name === "badge") st.badge = e.target.value;
      if (e.target.name === "cap") st.cap = e.target.value;
      if (e.target.name === "diploma") st.diploma = e.target.value;
      render();
    });
    form.addEventListener("input", render);
    $("[data-o-add]").addEventListener("click", () => {
      const r = render();
      const inst = $("[data-o-inst]").value.trim(), cls = $("[data-o-class]").value.trim();
      const details = [
        `Robă ${st.robe.name.toLowerCase()}, pălărie ${st.robe.name.toLowerCase()} cu panglică ${st.scarf.name.toLowerCase()}`,
        `Eșarfă ${st.scarf.name} (cod ${st.scarf.code}), imprimare ${printWord(st.scarf)}`,
        st.badge === "cocarda" ? `Cocardă, rozetă ${st.rosette.name.toLowerCase()}` : "Insignă",
        st.cap === "common" ? "Design comun pe capac (+20 lei)" : st.cap === "individual" ? "Design individual pe capac — încărcat de fiecare elev în platformă" : "Pălărie fără personalizare",
        st.cap === "common" && ($("[data-o-cap-email]").checked ? "Designul capacului: va fi trimis pe email" : "Designul capacului se trimite ulterior"),
        st.cap === "common" && $("[data-o-cap-text]").value.trim() && `Text pe capac: ${$("[data-o-cap-text]").value.trim()}`,
        st.diploma === "catifea" ? "Diplomă pe suport de catifea (+25 lei)" : "Diplomă A4 inclusă",
        [inst, cls, `Promoția ${yearOf(yearIn)}`].filter(Boolean).join(" · "),
      ].filter(Boolean);
      addToCart({ kind: "outfit", cat: "Vestimentație", title: `Ținută completă${st.badge === "cocarda" ? " cu cocardă" : " cu insignă"}`, details, qty: r.qty, unitPrice: r.unit, unit: "pachet", mode: "fixed",
        bonusMin: C.outfitBonusMinQty, freeLabel: "pachet pentru diriginte", pending: st.cap === "individual" ? "Design individual pe pălărie — tarif de confirmat" : "" });
    });
    render();
  })();

  /* ================= Pălărie (cumpărată separat) ================= */
  (function initHat() {
    const root = $("[data-hat]");
    if (!root) return;
    const st = { color: O.robes.find((r) => r.id === "visiniu") || O.robes[0], ribbon: scarfById("bej") || O.scarves[0], cap: "none" };
    const yearIn = $("[data-h-year]"); yearIn.value = C.promoYear;
    $("[data-h-colors]").innerHTML = O.robes.map((r) => `<button type="button" class="robe-pick" data-hcolor="${esc(r.id)}" aria-pressed="false"><img src="${esc(r.hat)}" alt="" loading="lazy"><span>${esc(r.name)}</span></button>`).join("");
    $("[data-h-ribbons]").innerHTML = O.scarves.map((s) => swatchHtml(s, false, "ribbon")).join("");
    function render() {
      $$("[data-hcolor]", root).forEach((b) => { const on = b.dataset.hcolor === st.color.id; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); });
      markSwatches(root, "ribbon", st.ribbon.id);
      $("[data-h-color-name]").textContent = st.color.name;
      $("[data-h-ribbon-name]").textContent = `${st.ribbon.name} · cod ${st.ribbon.code}`;
      setSrc($("[data-h-img]"), st.cap === "none" ? st.color.hat : st.color.hatPers);
      paintBand($("[data-h-band]"), st.color, st.ribbon.hex);
      $("[data-h-ribbon]").innerHTML = `<i style="--a:${esc(st.ribbon.hex)};--b:${esc(st.ribbon.hex)}"></i>Panglică ${esc(st.ribbon.name.toLowerCase())} · medalion ${yearOf(yearIn)}`;
      $("[data-h-cap-hint]").hidden = st.cap !== "individual";
      const qty = clampInt($("[data-h-qty]").value, 1);
      const add = st.cap === "common" ? O.capCommonDesign : 0;
      const unit = D.singles.palarie + add;
      const lines = [["Pălărie cu bentiță și ciucure cu anul", `${D.singles.palarie} lei / buc.`], add && ["Design comun pe capac", `+${add} lei / buc.`]].filter(Boolean);
      $("[data-h-price]").innerHTML = priceBox(lines, st.cap === "individual" ? "Subtotal cunoscut" : "Total estimat", `${qty} bucăți`, `${qty} × ${unit} lei`, lei(unit * qty))
        + (st.cap === "individual" ? `<p class="pb-pending">Design individual: <b>preț de confirmat</b> — se adaugă separat în ofertă.</p>` : "");
      return { qty, unit };
    }
    root.addEventListener("click", (e) => {
      const c = e.target.closest("[data-hcolor]"); if (c) { st.color = O.robes.find((r) => r.id === c.dataset.hcolor); render(); }
      const sw = e.target.closest("[data-sw='ribbon']"); if (sw) { st.ribbon = scarfById(sw.dataset.id); render(); }
    });
    root.addEventListener("change", (e) => { if (e.target.name === "hcap") st.cap = e.target.value; render(); });
    root.addEventListener("input", render);
    $("[data-h-add]").addEventListener("click", () => {
      const r = render();
      addToCart({ kind: "single", cat: "Vestimentație — produse separate", title: "Pălărie de absolvire", unit: "buc.", mode: "fixed", qty: r.qty, unitPrice: r.unit,
        details: [`Pălărie ${st.color.name.toLowerCase()}, panglică ${st.ribbon.name.toLowerCase()} (cod ${st.ribbon.code})`, `Medalion ${yearOf(yearIn)}`, st.cap === "common" ? "Design comun pe capac (+20 lei)" : st.cap === "individual" ? "Design individual pe capac" : "Fără personalizare pe capac"],
        pending: st.cap === "individual" ? "Design individual pe capac — tarif de confirmat" : "" });
    });
    render();
  })();

  /* ================= Eșarfă (cumpărată separat) ================= */
  (function initScarf() {
    const root = $("[data-scarf]");
    if (!root) return;
    let scarf = scarfById("bej") || O.scarves[0];
    const yearIn = $("[data-s-year]"); yearIn.value = C.promoYear;
    $("[data-s-colors]").innerHTML = O.scarves.map((s) => swatchHtml(s, false, "scarf")).join("");
    function render() {
      markSwatches(root, "scarf", scarf.id);
      $("[data-s-name]").textContent = `${scarf.name} · cod ${scarf.code}`;
      $("[data-s-print]").innerHTML = `<i style="--sw:${esc(scarf.hex)}"></i><b>${esc(scarf.name)} · cod ${esc(scarf.code)}</b> — personalizare cu ${scarf.print === "alb" ? "alb" : "negru"}`;
      paintStole(root, scarf, $("[data-s-inst]").value.trim(), yearOf(yearIn));
      const qty = clampInt($("[data-s-qty]").value, 1);
      $("[data-s-price]").innerHTML = priceBox([["Preț unitar", `${D.singles.esarfa} lei / bucată`], ["Cantitate", `${qty} bucăți`]], "Total estimat", `${qty} × ${D.singles.esarfa} lei`, "", lei(qty * D.singles.esarfa));
      return qty;
    }
    root.addEventListener("click", (e) => { const sw = e.target.closest("[data-sw='scarf']"); if (sw) { scarf = scarfById(sw.dataset.id); render(); } });
    root.addEventListener("input", render);
    $("[data-s-add]").addEventListener("click", () => {
      const qty = render();
      const inst = $("[data-s-inst]").value.trim();
      addToCart({ kind: "single", cat: "Vestimentație — produse separate", title: "Eșarfă personalizată", unit: "buc.", mode: "fixed", qty, unitPrice: D.singles.esarfa,
        details: [`Eșarfă ${scarf.name} (cod ${scarf.code}), imprimare ${printWord(scarf)}`, [inst, `Promoția ${yearOf(yearIn)}`].filter(Boolean).join(" · ")] });
    });
    const tips = $("[data-print-tips]");
    if (tips) tips.innerHTML = ["bej", "visiniu"].map(scarfById).filter(Boolean).map((s) => `
      <figure class="tip${s.print === "alb" ? " print-white" : ""}" style="--stole:${esc(s.hex)}">
        <div class="tip-cloth"><span class="stole-print"><svg viewBox="0 0 64 40" class="stole-cap"><path d="M32 2 2 14l30 12 30-12L32 2Z"/><path d="M14 19v10c0 4 8 8 18 8s18-4 18-8V19L32 26 14 19Z"/></svg><span class="stole-inst">Instituția voastră</span><span class="stole-promo">Promoția</span><span class="stole-year">${C.promoYear}</span><img class="stole-laurel" src="assets/img/lauri.webp" alt=""></span></div>
        <figcaption>${esc(s.name)} · imprimare ${printWord(s)}</figcaption>
      </figure>`).join("");
    render();
  })();

  /* ================= Insignă / cocardă ================= */
  (function initBadge() {
    const root = $("[data-badge-config]");
    if (!root) return;
    let prod = "cocarda", ros = rosetteById("visiniu") || rosettes[0];
    const yearIn = $("[data-b-year]"); yearIn.value = C.promoYear;
    $("[data-b-rosettes]").innerHTML = rosettes.map((s) => swatchHtml(s, false, "rosette")).join("");
    function render() {
      const isC = prod === "cocarda";
      markSwatches(root, "rosette", ros.id);
      $("[data-b-rosette]").hidden = !isC;
      $("[data-b-step]").textContent = isC ? 3 : 2;
      $("[data-b-step2]").textContent = isC ? 4 : 3;
      $("[data-b-rosette-name]").textContent = ros.name;
      setSrc($("[data-b-thumb]"), cocardaImg(ros.id));
      const img = $("[data-b-img]");
      setSrc(img, isC ? cocardaImg(ros.id) : O.insignaImg);
      img.alt = isC ? `Cocardă cu rozetă ${ros.name.toLowerCase()}` : "Insignă personalizată";
      img.classList.toggle("is-insigna", !isC);
      const qty = clampInt($("[data-b-qty]").value, 1);
      const unit = D.singles[prod];
      $("[data-b-price]").innerHTML = priceBox([[isC ? "Cocardă" : "Insignă personalizată, Ø 6 cm", `${unit} lei / buc.`], ["Cantitate", `${qty} bucăți`]], "Total estimat", `${qty} × ${unit} lei`, "", lei(unit * qty));
      return { qty, unit, isC };
    }
    root.addEventListener("click", (e) => { const sw = e.target.closest("[data-sw='rosette']"); if (sw) { ros = rosetteById(sw.dataset.id); render(); } });
    root.addEventListener("change", (e) => { if (e.target.name === "bprod") prod = e.target.value; render(); });
    root.addEventListener("input", render);
    $("[data-b-add]").addEventListener("click", () => {
      const r = render();
      const inst = $("[data-b-inst]").value.trim();
      const logoByEmail = $("[data-b-logo-email]").checked;
      addToCart({ kind: "single", cat: "Vestimentație — produse separate", title: r.isC ? "Cocardă" : "Insignă personalizată", unit: "buc.", mode: "fixed", qty: r.qty, unitPrice: r.unit,
        details: [r.isC && `Rozetă ${ros.name.toLowerCase()}`, [inst, `Promoția ${yearOf(yearIn)}`].filter(Boolean).join(" · "), logoByEmail ? "Sigla: va fi trimisă pe email" : "Sigla se trimite ulterior"].filter(Boolean) });
    });
    render();
  })();

  /* ================= Recomandări ================= */
  $$("[data-recos]").forEach((box) => {
    if (prerendered(box)) return;
    const ids = D.recoSets[box.dataset.recos] || [];
    box.innerHTML = ids.map((id) => D.recos[id]).filter(Boolean).map((r) => `
      <article class="reco">
        <div class="reco-img${r.tint ? " tint" : ""}" ${r.tint ? `style="--stole:${esc(O.scarves[0].hex)}"` : ""}><img src="${esc(r.img)}" alt="${esc(r.title)}" loading="lazy"></div>
        <h3>${esc(r.title)}</h3>
        <p>${esc(r.text)}</p>
        <a class="btn btn-outline btn-sm" href="${esc(r.href)}">${esc(r.cta)} <span aria-hidden="true">→</span></a>
      </article>`).join("");
  });

  /* ================= Liste de prețuri și servicii ================= */
  function priceLabel(it) {
    if (it.mode === "from") return `de la ${lei(it.price)} / ${it.unit}`;
    if (it.mode === "estimate") return `estimativ ${lei(it.price)} / ${it.unit}`;
    if (it.mode === "quote") return "Preț la cerere";
    return `${lei(it.price)} / ${it.unit}`;
  }
  const catNames = { idPhotos: "Foto pentru diplomă", awards: "Premiere și diplome", parade: "Parade și decoruri", festivalServices: "Servicii festivitate", banquetServices: "Servicii banchet" };
  $$("[data-list]").forEach((ul) => {
    if (prerendered(ul)) return;
    const key = ul.dataset.list;
    let items = D[key].map((x) => Object.assign({ mode: "fixed" }, x));
    if (ul.dataset.filter) { const ids = ul.dataset.filter.split(","); items = items.filter((x) => ids.includes(x.id)); }
    const cards = ul.dataset.style === "cards";
    ul.innerHTML = items.map((it) => {
      const needsQty = it.mode === "fixed" || it.mode === "estimate";
      return `<li class="${cards ? "svc" : "pl"}" data-item="${esc(key)}:${esc(it.id)}">
        <div class="pl-main"><span class="pl-name">${esc(it.name)}</span>${it.desc ? `<span class="pl-desc">${esc(it.desc)}</span>` : ""}<span class="pl-price mode-${it.mode}">${priceLabel(it)}</span></div>
        <div class="pl-act">${needsQty ? `<input type="number" min="1" value="${it.mode === "estimate" ? 25 : 1}" aria-label="Cantitate (${esc(it.unit)})" data-pl-qty>` : ""}<button type="button" class="btn btn-sm ${cards ? "btn-outline" : "btn-ghost"}" data-pl-add>Adaugă</button></div>
      </li>`;
    }).join("");
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pl-add]"); if (!b) return;
    const li = b.closest("[data-item]");
    const [key, id] = li.dataset.item.split(":");
    const it = Object.assign({ mode: "fixed" }, D[key].find((x) => x.id === id));
    const q = $("[data-pl-qty]", li);
    const eventType = key === "banquetServices" ? "banchet" : key === "festivalServices" ? "festivitate" : "";
    addToCart({ kind: key, cat: catNames[key], title: it.name, details: eventType ? [`Tip eveniment: ${eventType}`, it.desc].filter(Boolean) : [], qty: q ? clampInt(q.value, 1) : 1, unitPrice: it.price ?? null, unit: it.unit || "serviciu", mode: it.mode });
  });

  $$("[data-add-quote]").forEach((b) => b.addEventListener("click", () => {
    addToCart({ kind: "quote", cat: b.dataset.quoteCat, title: b.dataset.quoteName, details: ["Ofertă personalizată — fără preț public"], qty: 1, unitPrice: null, unit: "pachet", mode: "quote" });
  }));

  const special = $("[data-special]");
  if (special) special.addEventListener("submit", () => {
    const desc = $("[data-sp-desc]", special).value.trim();
    if (!desc) { $("[data-sp-desc]", special).focus(); toast("Descrieți pe scurt ideea proiectului."); return; }
    const photoByEmail = $("[data-sp-email]", special).checked;
    const size = $("[data-sp-size]", special).value.trim(), place = $("[data-sp-place]", special).value.trim();
    addToCart({ kind: "special", cat: "Proiecte speciale", title: "Proiect special", details: [desc, size && `Dimensiuni: ${size}`, place && `Loc: ${place}`, photoByEmail && "Imagine de referință: va fi trimisă pe email"].filter(Boolean), qty: 1, unitPrice: null, unit: "proiect", mode: "quote" });
    special.reset();
  });

  /* ================= Promoții ================= */
  (function initPromos() {
    const list = $("[data-promo-list]");
    if (!list) return;
    const shown = [...liveCampaigns, ...endedCampaigns];
    const isEnded = (c) => endedCampaigns.includes(c);
    const endedBadge = `<div class="promo-expired"><span>Oferta a expirat</span></div>`;
    function render(filter) {
      const items = shown.filter((c) => filter === "all" || c.categories.includes(filter));
      const hashId = location.hash.startsWith("#promo-") ? location.hash.slice(7) : "";
      const ended = hashId && !shown.some((c) => c.id === hashId) ? D.campaigns.find((c) => c.id === hashId) : null;
      list.innerHTML = (ended ? `<div class="promo-ended" role="status"><b>Oferta „${esc(ended.title)}” s-a încheiat.</b> Mai jos găsiți ofertele active.</div>` : "")
        + (items.length ? items.map((c) => `
        <article class="promo${isEnded(c) ? " is-ended" : ""}" id="promo-${esc(c.id)}">
          ${isEnded(c) ? endedBadge : ""}
          <div class="promo-img"><img src="${esc(c.img)}" alt="" loading="lazy"></div>
          <div class="promo-body">
            <p class="eyebrow">${esc(c.categories.map(cap).join(" · "))} · ${esc(period(c))}</p>
            <h2>${esc(c.title)}</h2>
            <p class="slogan">${esc(c.slogan)}</p>
            <div class="promo-cols">
              <div><h3>Beneficii</h3><ul>${c.benefits.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>
              <div><h3>Condiții</h3><ul>${c.conditions.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>
            </div>
            <div class="promo-btns">${c.buttons.map((b, i) => `<a class="btn ${i ? "btn-outline" : "btn-primary"} btn-sm" href="${esc(b.href)}">${esc(b.label)} →</a>`).join("")}</div>
          </div>
        </article>`).join("") : `<p class="empty">Momentan nu sunt promoții active în această categorie.</p>`);
    }
    $("[data-promo-filters]").addEventListener("click", (e) => {
      const b = e.target.closest("[data-filter]"); if (!b) return;
      $$("[data-filter]", e.currentTarget).forEach((x) => { const on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", String(on)); });
      render(b.dataset.filter);
    });
    const hashId = location.hash.startsWith("#promo-") ? location.hash.slice(7) : "";
    const sameAsHtml = $$(".promo", list).map((x) => x.id).join() === shown.map((c) => "promo-" + c.id).join();
    if (!sameAsHtml || (hashId && !shown.some((c) => c.id === hashId))) render("all");
    const jump = () => { if (location.hash.startsWith("#promo-")) { const el = document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); } };
    window.addEventListener("hashchange", () => { render("all"); jump(); });
    jump();
  })();

  /* ================= Pagina „Cererea mea” ================= */
  (function initCartPage() {
    const root = $("[data-cart-page]");
    if (!root) return;
    const box = $("[data-cart-items]"), form = $("[data-request-form]"), grid = $(".request-grid", root);
    renderCart = function () {
      if (!cart.length) {
        if (!$(".cart-empty", box)) box.innerHTML = `<div class="cart-empty card"><img src="assets/img/lauri.webp" alt=""><h2>Cererea ta este goală.</h2><p>Adaugă albume, vestimentație sau servicii — selecțiile se păstrează în acest browser, fără cont.</p><div class="btn-row center"><a class="btn btn-primary" href="albume">Vezi albumele</a><a class="btn btn-outline" href="vestimentatie">Configurează vestimentația</a></div></div>`;
        $(".request-side", root).hidden = true;
        grid.classList.add("is-empty");
        return;
      }
      $(".request-side", root).hidden = false;
      grid.classList.remove("is-empty");
      box.innerHTML = cart.map((it) => {
        const s = lineState(it);
        return `<article class="ci${s.calc === null ? " is-pending" : ""}" data-uid="${esc(it.uid)}">
          <div class="ci-top"><div><small>${esc(it.cat)}</small><h3>${esc(it.title)}</h3></div>
            <div class="ci-price">${s.calc !== null ? `<b>${s.label}</b><small>${it.qty} × ${lei(it.unitPrice)}</small>` : `<b class="tbc">${esc(s.label)}</b>`}</div></div>
          ${it.details && it.details.length ? `<ul>${it.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>` : ""}
          ${s.free ? `<p class="ci-free">+ ${s.free} ${esc(freeLabel(it, s.free))} — 0 lei <small>(nu contribuie la prag)</small></p>` : ""}
          ${it.pending ? `<p class="ci-pend">${esc(it.pending)}</p>` : ""}
          <div class="ci-actions">
            <span class="stepper sm"><button type="button" data-ci="dec" aria-label="Mai puțin">−</button><input type="number" min="1" value="${it.qty}" data-ci-qty aria-label="Cantitate"><button type="button" data-ci="inc" aria-label="Mai mult">+</button></span>
            <button type="button" class="link" data-ci="dup">Duplică</button>
            <button type="button" class="link danger" data-ci="del">Elimină</button>
          </div>
        </article>`;
      }).join("");
      let subtotal = 0; const toConfirm = [], freebies = [];
      cart.forEach((it) => {
        const s = lineState(it);
        if (s.calc !== null) subtotal += s.calc; else toConfirm.push(`${it.title}: ${s.label}`);
        if (s.free) freebies.push(`${s.free} ${freeLabel(it, s.free)} — ${it.title}`);
        if (it.pending) toConfirm.push(it.pending);
      });
      $("[data-cart-summary]").innerHTML = `
        <div class="sum-row main"><span>Subtotal produse calculabile</span><b>${lei(subtotal)}</b></div>
        ${freebies.length ? `<div class="sum-block"><h3>Gratuități (evidențiate separat)</h3><ul>${freebies.map((f) => `<li>${esc(f)} · 0 lei</li>`).join("")}</ul></div>` : ""}
        ${toConfirm.length ? `<div class="sum-block"><h3>Poziții cu disponibilitate de confirmat</h3><ul>${toConfirm.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>` : ""}
        <div class="sum-row"><span>Transport</span><span>Se confirmă în oferta personalizată</span></div>
        <div class="sum-row"><span>Disponibilitate, programare și condiții finale</span><span>Se confirmă de echipa Absolvire.ro</span></div>`;
    };
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ci]"); if (!b) return;
      const i = cart.findIndex((x) => x.uid === b.closest("[data-uid]").dataset.uid); if (i < 0) return;
      const a = b.dataset.ci;
      if (a === "inc") cart[i].qty++;
      if (a === "dec") cart[i].qty = Math.max(1, cart[i].qty - 1);
      if (a === "del") cart.splice(i, 1);
      if (a === "dup") cart.splice(i + 1, 0, Object.assign({}, cart[i], { uid: Date.now().toString(36) + "d" }));
      save(); renderCart();
    });
    box.addEventListener("change", (e) => {
      if (!e.target.matches("[data-ci-qty]")) return;
      const it = cart.find((x) => x.uid === e.target.closest("[data-uid]").dataset.uid);
      it.qty = clampInt(e.target.value, 1); save(); renderCart();
    });
    $("[data-individual]").addEventListener("change", (e) => {
      $$("[data-school-fields] input").forEach((i) => (i.required = !e.target.checked));
      $("[data-school-fields]").classList.toggle("optional", e.target.checked);
    });

    /* ---------- Conținutul emailului (Web3Forms) ----------
       Web3Forms afișează fiecare câmp ca titlu + valoare, cu font proporțional; de aceea
       fiecare poziție din comandă este un câmp separat, pe rânduri, nu un tabel aliniat. */
    function unitLabel(it) {
      if (it.mode === "quote" || it.unitPrice == null) return "—";
      if (it.mode === "from") return `de la ${lei(it.unitPrice)} / ${it.unit}`;
      if (it.mode === "estimate") return `≈ ${lei(it.unitPrice)} / ${it.unit}`;
      return `${lei(it.unitPrice)} / ${it.unit}`;
    }
    const FIELD_LABELS = [["phone", "Telefon"], ["individual", "Solicitare individuală"],
      ["school", "Instituție"], ["classes", "Clasă / grup de clase"], ["city", "Localitate"], ["people", "Nr. elevi / participanți"],
      ["date", "Data / intervalul evenimentului"], ["venue", "Locația exactă"], ["budget", "Buget orientativ"], ["notes", "Observații"], ["gdpr", "Acord prelucrare date"]];
    function orderFields(number, when, data, items) {
      const f = {};
      f["Număr cerere"] = number;
      f["Trimisă"] = `${when.toLocaleString("ro-RO", { timeZone: "Europe/Bucharest", dateStyle: "long", timeStyle: "short" })} (ora României)`;
      FIELD_LABELS.forEach(([k, l]) => { if (data[k] && String(data[k]).trim()) f[l] = k === "individual" || k === "gdpr" ? "Da" : String(data[k]).trim(); });
      let subtotal = 0; const toConfirm = [], freebies = [];
      items.forEach((it, i) => {
        const s = lineState(it);
        const out = [it.cat];
        if (s.calc !== null) {
          subtotal += s.calc;
          out.push(`Cantitate: ${it.qty} × ${unitLabel(it)}`, `Total: ${lei(s.calc)}`);
        } else {
          toConfirm.push(`${it.title}: ${s.label}`);
          const needsNote = !/confirmat|personalizată/i.test(s.label);
          out.push(`Cantitate: ${it.qty}`, `Preț: ${s.label}${needsNote ? " — de confirmat" : ""}`);
        }
        (it.details || []).forEach((x) => out.push(`• ${x}`));
        if (s.free) { out.push(`+ ${s.free} ${freeLabel(it, s.free)} (0 lei)`); freebies.push(`${s.free} ${freeLabel(it, s.free)} — ${it.title}`); }
        if (it.pending) { out.push(`! ${it.pending}`); toConfirm.push(it.pending); }
        f[`Poziția ${i + 1}: ${it.title}`] = out.join("\n");
      });
      f["Subtotal produse calculabile"] = lei(subtotal);
      if (freebies.length) f["Gratuități (0 lei)"] = freebies.map((x) => `• ${x}`).join("\n");
      if (toConfirm.length) f["Poziții cu disponibilitate de confirmat"] = toConfirm.map((x) => `• ${x}`).join("\n");
      f["Transport"] = "Se confirmă în oferta personalizată";
      f["Disponibilitate și programare"] = "Se confirmă de echipa Absolvire.ro";
      f["Notă"] = "Solicitarea este estimativă și nu constituie comandă fermă sau rezervare.";
      return { fields: f, subtotal, count: items.length };
    }
    let sending = false;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (sending) return; // previne trimiterile duble
      const err = $("[data-form-error]");
      $$(".is-invalid", form).forEach((i) => i.classList.remove("is-invalid"));
      const invalid = $$("input[required], textarea[required]", form).filter((i) => (i.type === "checkbox" ? !i.checked : !i.value.trim()) || !i.checkValidity());
      if (invalid.length) {
        invalid.forEach((i) => i.classList.add("is-invalid"));
        err.textContent = "Completează câmpurile marcate. Datele opționale pot fi trimise ulterior.";
        err.hidden = false; invalid[0].focus(); return;
      }
      err.hidden = true; sending = true;
      const btn = $("button[type=submit]", form); btn.disabled = true; btn.textContent = "Se trimite…";
      const d = new Date();
      const number = `ABS-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const data = Object.fromEntries(new FormData(form).entries());
      const order = orderFields(number, d, data, cart);
      const message = `Cerere de ofertă ${number}: ${order.count} ${order.count === 1 ? "poziție" : "poziții"}, subtotal produse calculabile ${lei(order.subtotal)}. Detaliile sunt mai jos.`;
      const request = { number, createdAt: d.toISOString(), contact: data, fields: order.fields, items: cart.map((it) => Object.assign({}, it, { state: lineState(it) })) };
      // Web3Forms: access_key, name, email, message (+ subiect, reply-to) și câte un câmp pentru fiecare poziție.
      const payload = Object.assign({
        access_key: C.submitAccessKey,
        subject: `Cerere de ofertă ${number} — ${data.school || data.name}`,
        from_name: "Absolvire.ro — cereri de ofertă",
        replyto: data.email,
        name: data.name,
        email: data.email,
        message,
      }, order.fields);
      const send = async () => {
        if (!C.submitEndpoint) return true;
        if (data.botcheck) return true; // honeypot bifat → spam: nu trimitem, dar nu dăm de bănuit
        try {
          const r = await fetch(C.submitEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
          const json = await r.json().catch(() => ({}));
          return r.ok && json.success !== false;
        } catch (_) { return false; }
      };
      const delivered = await send();
      // Cererea se salvează local chiar dacă notificarea eșuează (poate fi retrimisă).
      try { const all = JSON.parse(localStorage.getItem("absolvire-cereri") || "[]"); all.push(Object.assign({ delivered }, request)); localStorage.setItem("absolvire-cereri", JSON.stringify(all)); } catch (_) {}
      const recap = box.innerHTML, summary = $("[data-cart-summary]").innerHTML;
      const sent = $("[data-sent-view]");
      sent.innerHTML = `
        <div class="sent-head card"><img src="assets/img/lauri.webp" alt=""><p class="eyebrow">Cerere înregistrată</p><h2>Mulțumim, ${esc(data.name.split(" ")[0])}!</h2>
        <p>Numărul cererii: <b>${number}</b></p>
        <p>${delivered ? "Echipa Absolvire.ro analizează solicitarea și revine cu oferta, disponibilitatea, programarea și livrarea." : "Cererea a fost salvată, dar notificarea nu a putut fi transmisă. Poți încerca din nou."}</p>
        ${C.submitEndpoint ? "" : `<p class="micro demo">Versiune statică: cererea este salvată în acest browser. Setează <code>submitEndpoint</code> în <code>data.js</code> pentru trimitere reală.</p>`}
        ${!delivered ? `<button class="btn btn-primary" type="button" data-retry>Retrimite cererea</button>` : ""}</div>
        <h2 class="h3-serif">Recapitulare</h2><div class="request-grid"><div><div class="recap">${recap}</div></div><aside class="request-side"><div class="cart-summary">${summary}</div><a class="btn btn-outline btn-block" href="/">Înapoi la prima pagină</a></aside></div>`;
      $$(".ci-actions", sent).forEach((x) => x.remove());
      $("[data-cart-view]").hidden = true; sent.hidden = false;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      const retry = $("[data-retry]", sent);
      if (retry) retry.addEventListener("click", async () => {
        retry.disabled = true;
        if (await send()) { retry.replaceWith(Object.assign(document.createElement("p"), { textContent: "Notificarea a fost transmisă." })); return; }
        retry.disabled = false; toast("Retrimiterea nu a reușit. Încearcă din nou mai târziu.");
      });
      cart = []; save(); form.reset();
      btn.disabled = false; btn.textContent = "Trimite cererea de ofertă și disponibilitate"; sending = false;
    });
    renderCart();
  })();
})();
