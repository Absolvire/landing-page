/* =====================================================================
   Absolvire.ro — date de catalog (site static)
   ---------------------------------------------------------------------
   Toate valorile de aici sunt editabile (brief, secțiunile 1, 11, 15–18).
   Prețurile sunt cele inițiale din „Brief-site-Absolvire-v1”, rev. 3.
   Nimic din logica paginilor nu presupune un număr fix de culori,
   modele sau campanii: adaugi / scoți elemente din liste și paginile
   se actualizează singure. (După ce schimbi albumele, rulează
   `python3 _src/build.py` ca să se regenereze paginile de album.)
   ===================================================================== */

window.ABS = {
  config: {
    promoYear: 2027, // anul promoției afișat implicit (nu e constantă în cod)
    albumMinQty: 15, // pragul de albume contra cost pentru estimare (secțiunea 4)
    albumBonusMinQty: 15, // albume plătite de la care clasa primește 1 album gratuit pentru diriginte
    outfitBonusMinQty: 15, // pachete plătite pentru bonusul dirigintelui (secțiunile 5, 21)
    carouselInterval: 6500, // rotația caruselului (ms)
    // Trimiterea cererii: Web3Forms (formularul trimite pe email un tabel ASCII cu comanda).
    // Cheia de acces Web3Forms este publică prin design (se pune în pagină). Gol = doar local.
    submitEndpoint: "https://api.web3forms.com/submit",
    submitAccessKey: "fd100f23-ff5f-41d0-a3c7-1ac12db99bd4",
    // Contacte aprobate — de completat înainte de publicare (secțiunea 26).
    contact: { phone: "+40 723 882 511", email: "comenzi.scoli@gmail.com", whatsapp: "" },
    // Datele firmei — apar în subsol, în paginile legale și în datele structurate.
    company: {
      name: "ROBE ABSOLVIRE SRL",
      street: "Str. Vatra Luminoasă nr. 1",
      city: "București",
      region: "Sector 2",
      regCom: "J40/2908/2021",
      cif: "43761331",
      site: "absolvire.ro",
    },
  },

  /* ---------------- Albume (secțiunea 3) ---------------- */
  albums: [
    {
      id: "economy",
      name: "Economy",
      tagline: "Simplu. Elegant. Accesibil.",
      price: 120,
      size: "A4",
      cover: "Copertă tip revistă",
      binding: "Pagini flexibile capsate",
      photos: "1 fotografie / elev",
      layout: "Elevii sunt prezentați în pagini comune, cu câte un portret.",
      short: "Revista clasei: format A4, ușor de răsfoit, la cel mai bun preț.",
      img: "assets/img/economy-cover.webp",
      optionLabel: null,
      options: [],
      interior: [
        { img: "assets/img/economy-int-1.webp", title: "Dirigintele și clasa" },
        { img: "assets/img/economy-int-2.webp", title: "Profesorii și elevii" },
        { img: "assets/img/economy-int-3.webp", title: "Paginile elevilor" },
        { img: "assets/img/economy-int-4.webp", title: "Încheiere — fotografia de grup" },
      ],
    },
    {
      id: "velvet",
      name: "Velvet",
      tagline: "Catifea și fundă, ca un cadou.",
      price: 200,
      size: "20 × 20 cm",
      cover: "Copertă de catifea cu fundă",
      binding: "Pagini flexibile broșate",
      photos: "2 fotografii / elev",
      layout: "O pagină pentru fiecare elev: portret, fotografie cu prietenii și mesaj.",
      short: "Catifea elegantă, disponibilă în mai multe culori, cu fundă din satin.",
      img: "assets/img/velvet-cover.webp",
      // O singură fotografie reală (catifea neagră + fundă smarald). Catifeaua și fundița sunt
      // extrase din ea ca straturi și colorate în nuanța aleasă (opt1 = catifeaua, opt2 = fundița).
      photographed: "catifea neagră cu fundă smarald",
      recolor: { opt1: "assets/img/velvet-catifea.webp", opt2: "assets/img/velvet-funda.webp" },
      optionLabel: "Culoarea catifelei",
      options: [
        { id: "negru", name: "Negru", hex: "#151515" },
        { id: "bleu", name: "Bleu", hex: "#7aa3d6" },
        { id: "albastru", name: "Albastru", hex: "#1f3a93" },
        { id: "gri", name: "Gri albăstrui", hex: "#8fa2ad" },
        { id: "lila", name: "Lila", hex: "#c1a6dc" },
        { id: "mov", name: "Mov", hex: "#6a3d93" },
        { id: "ciclam", name: "Ciclam", hex: "#b0266e" },
        { id: "visiniu", name: "Vișiniu", hex: "#6c1532" },
        { id: "smarald", name: "Smarald", hex: "#0f6e5f" },
      ],
      option2Label: "Culoarea funditei",
      options2: [
        { id: "smarald", name: "Smarald", hex: "#0f6e5f" },
        { id: "visiniu", name: "Vișiniu", hex: "#6c1532" },
        { id: "bej", name: "Bej", hex: "#e8d6b0" },
        { id: "alb", name: "Alb", hex: "#f7f5f0" },
        { id: "albastru", name: "Albastru", hex: "#1f3a93" },
      ],
      interior: [
        { img: "assets/img/velvet-int-1.webp", title: "Introducere — liceul și clasa" },
        { img: "assets/img/velvet-int-2.webp", title: "Dirigintele și mulțumirile clasei" },
        { img: "assets/img/velvet-int-3.webp", title: "Paginile elevilor — o pagină / elev" },
        { img: "assets/img/velvet-int-4.webp", title: "Încheiere — fotografii de grup" },
      ],
    },
    {
      id: "deluxe",
      name: "Deluxe",
      tagline: "Format A4, copertă rigidă de catifea.",
      price: 230,
      size: "A4",
      cover: "Copertă rigidă din catifea",
      binding: "Pagini flexibile broșate",
      photos: "Portret și semigrup",
      layout: "Fiecare elev are portretul său, plus fotografii pe semigrupuri.",
      short: "Catifea în cinci nuanțe, cu anul promoției imprimat auriu.",
      img: "assets/img/deluxe-visiniu.webp",
      optionLabel: "Culoarea copertei",
      options: [
        { id: "negru", name: "Negru", hex: "#151515", img: "assets/img/deluxe-negru.webp" },
        { id: "visiniu", name: "Vișiniu", hex: "#6c1532", img: "assets/img/deluxe-visiniu.webp" },
        { id: "bleu", name: "Bleu", hex: "#7aa3d6", img: "assets/img/deluxe-bleu.webp" },
        { id: "lila", name: "Lila", hex: "#9b7bbf", img: "assets/img/deluxe-lila.webp" },
        { id: "maldives", name: "Maldives", hex: "#2e8a86", img: "assets/img/deluxe-maldives.webp" },
      ],
      interior: [
        { img: "assets/img/deluxe-int-1.webp", title: "Introducere" },
        { img: "assets/img/deluxe-int-2.webp", title: "Dirigintele și clasa" },
        { img: "assets/img/deluxe-int-3.webp", title: "Profesorii și catalogul clasei" },
        { img: "assets/img/deluxe-int-4.webp", title: "Paginile elevilor" },
        { img: "assets/img/deluxe-int-5.webp", title: "Semigrupuri" },
        { img: "assets/img/deluxe-int-6.webp", title: "Încheiere" },
      ],
    },
    {
      id: "class",
      name: "Class",
      tagline: "Coperta spune povestea clasei voastre.",
      price: 260,
      size: "20 × 20 cm",
      cover: "Copertă personalizată, printată",
      binding: "Pagini groase lay-flat",
      photos: "2 elevi / pagină",
      layout: "Paginile se deschid complet plat; câte doi elevi pe pagină.",
      short: "Copertă personalizată cu fotografia clasei și designul vostru.",
      img: "assets/img/class-cover.webp",
      optionLabel: "Design copertă printată",
      options: [
        { id: "foto", name: "Cu fotografia clasei", img: "assets/img/class-cover.webp" },
        { id: "rama", name: "Ramă pentru fotografie", img: "assets/img/class-cover-2.webp" },
      ],
      interior: [
        { img: "assets/img/class-int-1.webp", title: "Dirigintele și profesorii" },
        { img: "assets/img/class-int-2.webp", title: "Mulțumiri și grupuri" },
        { img: "assets/img/class-int-3.webp", title: "Paginile elevilor — 2 elevi / pagină" },
        { img: "assets/img/class-int-4.webp", title: "Încheiere" },
      ],
    },
    {
      id: "elite",
      name: "Elite",
      tagline: "Catifea premium cu bandă personalizată.",
      price: 320,
      size: "25 × 25 cm",
      cover: "Catifea cu inserție personalizată",
      binding: "Pagini lay-flat",
      photos: "Pagină proprie cu 3 fotografii",
      layout: "Fiecare elev are pagina lui, cu trei fotografii.",
      short: "Catifea neagră și bandă marmorată în culoarea clasei.",
      img: "assets/img/elite-lila.webp",
      optionLabel: "Inserția marmorată",
      options: [
        { id: "bej", name: "Bej", code: "21", hex: "#e9dcc4", img: "assets/img/elite-bej.webp" },
        { id: "bleu", name: "Sky", code: "24", hex: "#9cc6ea", img: "assets/img/elite-bleu.webp" },
        { id: "lila", name: "Lila", code: "06", hex: "#cdb7e3", img: "assets/img/elite-lila.webp" },
        { id: "smarald", name: "Smarald", code: "26", hex: "#11695a", img: "assets/img/elite-smarald.webp" },
        { id: "visiniu", name: "Vișiniu", code: "12", hex: "#7b1b33", img: "assets/img/elite-visiniu.webp" },
      ],
      interior: [
        { img: "assets/img/elite-int-1.webp", title: "Introducere" },
        { img: "assets/img/elite-int-2.webp", title: "Dirigintele și mulțumirile clasei" },
        { img: "assets/img/elite-int-3.webp", title: "Profesorii și catalogul" },
        { img: "assets/img/elite-int-4.webp", title: "Pagina elevului — 3 fotografii" },
        { img: "assets/img/elite-int-5.webp", title: "Semigrupuri" },
      ],
    },
  ],

  /* ---------------- Vestimentație (secțiunile 5, 15, 21, 22) ---------------- */
  outfit: {
    basePriceInsigna: 100, // robă + tocă + eșarfă + insignă + diplomă A4
    basePriceCocarda: 110, // robă + tocă + eșarfă + cocardă + diplomă A4
    capCommonDesign: 20, // +20 lei / bucată
    diplomaVelvetUpgrade: 25, // diplomă pe catifea în locul celei simple
    // hat = pălăria simplă, hatPers = design comun al clasei,
    // hatIndividual = exemplu de design individual (prima pagină, „Toca ta. Designul tău.”)
    robes: [
      { id: "negru", name: "Negru", hex: "#151515", img: "assets/img/roba-negru.webp", hat: "assets/img/palarie-negru.webp", hatPers: "assets/img/palarie-negru-pers.webp", hatIndividual: "assets/img/palarie-negru-ai.webp", band: "assets/img/bentita-negru.webp" },
      { id: "albastru", name: "Albastru", hex: "#1c3fa8", img: "assets/img/roba-albastru.webp", hat: "assets/img/palarie-albastru.webp", hatPers: "assets/img/palarie-albastru-pers.webp", hatIndividual: "assets/img/palarie-albastru-ai.webp", band: "assets/img/bentita-albastru.webp" },
      { id: "visiniu", name: "Vișiniu", hex: "#8a1638", img: "assets/img/roba-visiniu.webp", hat: "assets/img/palarie-visiniu.webp", hatPers: "assets/img/palarie-visiniu-pers.webp", hatIndividual: "assets/img/palarie-visiniu-ai.webp", band: "assets/img/bentita-visiniu.webp" },
    ],
    // Paleta de eșarfe din macheta Absolvire.ro. Imprimarea (albă / neagră) este
    // definită explicit pe fiecare nuanță — fără algoritm care ghicește contrastul.
    scarves: [
      { id: "bej", name: "Bej", code: "21", hex: "#e9cf9d", print: "negru" },
      { id: "alb", name: "Alb", code: "1", hex: "#f2f2ee", print: "negru" },
      { id: "roz", name: "Roz", code: "10", hex: "#f4a8c8", print: "negru" },
      { id: "rosu", name: "Roșu", code: "3", hex: "#cf122d", print: "alb" },
      { id: "visiniu", name: "Vișiniu", code: "12", hex: "#790d2d", print: "alb" },
      { id: "orange", name: "Orange", code: "15", hex: "#f38a32", print: "negru" },
      { id: "galben", name: "Galben", code: "6", hex: "#eddb40", print: "negru" },
      { id: "verde", name: "Verde", code: "19", hex: "#329c4d", print: "alb" },
      { id: "caraibe", name: "Caraibe", code: "30", hex: "#35bad1", print: "negru" },
      { id: "sky", name: "Sky", code: "24", hex: "#9fc9e8", print: "negru" },
      { id: "albastru", name: "Albastru", code: "2", hex: "#143da1", print: "alb" },
      { id: "mov", name: "Mov", code: "29", hex: "#602d83", print: "alb" },
    ],
    // Rozeta cocardei: aceeași paletă + negru. Fiecare culoare are fotografia ei
    // (assets/img/cocarda-<id>.webp), cu aceeași insignă centrală.
    extraRosettes: [{ id: "negru", name: "Negru", code: "—", hex: "#2a2a2a" }],
    insignaImg: "assets/img/insigna.webp",
  },

  // Produse separate (secțiunile 15, 22)
  singles: { palarie: 50, esarfa: 35, insigna: 5, cocarda: 15 },

  /* ---------------- Recomandări (secțiunea 23) ---------------- */
  recos: {
    "palarie": { title: "Pălărie cu panglică asortată", text: "În culorile eșarfei, cu ciucure și medalionul anului.", img: "assets/img/palarie-visiniu.webp", href: "palarie", cta: "Configurează" },
    "esarfa": { title: "Eșarfă asortată", text: "Personalizată cu instituția și promoția.", img: "assets/img/esarfa-alba.webp", tint: true, href: "esarfa", cta: "Configurează" },
    "insigna": { title: "Insignă sau cocardă", text: "Un detaliu de distincție pentru fiecare absolvent.", img: "assets/img/cocarda-visiniu.webp", href: "insigna-cocarda", cta: "Configurează" },
    "diploma-a4": { title: "Diplomă standard A4", text: "Model clasic, personalizat cu numele elevului.", img: "assets/img/diploma-a4.webp", href: "premiere", cta: "Vezi produsul" },
    "diploma-catifea": { title: "Diplomă cu suport de catifea", text: "Varianta festivă a diplomei de absolvire.", img: "assets/img/diploma-mapa.webp", href: "premiere", cta: "Vezi produsul" },
    "medalii": { title: "Medalii pentru premiere", text: "Medalii aurii de 7 cm, inscripționate, cu șnur.", img: "assets/img/lauri.webp", href: "premiere", cta: "Vezi produsul" },
    "placheta": { title: "Plachetă pentru diriginte", text: "Un gest de apreciere pentru cei care v-au îndrumat.", img: "assets/img/diploma-prof.webp", href: "premiere", cta: "Vezi produsul" },
  },
  recoSets: {
    outfit: ["medalii", "diploma-catifea", "placheta"],
    palarie: ["esarfa", "medalii", "diploma-a4", "diploma-catifea"],
    esarfa: ["palarie", "insigna", "diploma-a4", "placheta"],
    insigna: ["medalii", "diploma-catifea", "placheta"],
  },

  /* ---------------- Foto pentru diplomă (secțiunea 6) ---------------- */
  idPhotos: [
    { id: "foto6", name: "Set de 6 fotografii simple tip ID", price: 20, unit: "set" },
    { id: "foto18", name: "Set de 18 fotografii autoadezive, 3 × 4 cm", price: 30, unit: "set" },
  ],

  /* ---------------- Premiere, diplome, parade (secțiunile 7, 15) ---------------- */
  awards: [
    { id: "diploma-a4", name: "Diplomă personalizată A4", price: 5, unit: "buc." },
    { id: "diploma-catifea", name: "Diplomă pe suport de catifea", price: 30, unit: "buc." },
    { id: "medalie", name: "Medalie aurie 7 cm, inscripționată, cu șnur", price: 25, unit: "buc." },
    { id: "trofeu", name: "Trofeu figurină absolvent, soclu de marmură", price: 100, unit: "buc." },
    { id: "placheta", name: "Plachetă de onoare în mapă de catifea, 13 × 18 cm", price: 150, unit: "buc." },
    { id: "diploma-onoare", name: "Diplomă de onoare în mapă de catifea, 21 × 31 cm", price: 150, unit: "buc." },
    { id: "cheia", name: "Cheia Succesului", price: 150, unit: "buc." },
  ],
  parade: [
    { id: "steag", name: "Steag personalizat pe o față", price: 150, unit: "buc." },
    { id: "pancarta", name: "Pancartă inscripționată pe o față, 50 × 35 cm", price: 100, unit: "buc." },
    { id: "minibanner", name: "Mini-banner personalizat, cu suport de lemn", price: 180, unit: "buc." },
  ],

  /* ---------------- Servicii eveniment (secțiunile 16–18) ----------------
     mode: "fixed" | "from" | "estimate" | "quote"                         */
  festivalServices: [
    { id: "foto-fest", name: "Fotografiere festivitate", mode: "from", price: 1500, unit: "eveniment" },
    { id: "video-fest", name: "Filmarea festivității", mode: "from", price: 1500, unit: "eveniment" },
    { id: "baloane-decor", name: "Decor cu baloane", mode: "from", price: 1500, unit: "eveniment" },
    { id: "baloane-heliu", name: "Baloane colorate cu heliu, livrate la festivitate", mode: "estimate", price: 20, unit: "elev" },
    { id: "sonorizare-fest", name: "Sonorizare festivitate, cu tehnician de sunet", mode: "quote" },
    { id: "fumigene", name: "Show profesionist de fumigene colorate", mode: "quote" },
    { id: "prezentator", name: "Prezentator festivitate", mode: "quote" },
    { id: "scena", name: "Scenă mobilă în curtea școlii", mode: "quote" },
    { id: "scaune", name: "Scaune de închiriat pentru festivitate", mode: "quote" },
    { id: "photo-wall", name: "Photo wall / photo corner tematic", mode: "quote" },
  ],
  banquetServices: [
    { id: "foto-banchet", name: "Foto banchet", mode: "quote", desc: "Fotografii individuale, de grup și de atmosferă." },
    { id: "video-banchet", name: "Video banchet", mode: "quote", desc: "Cameraman și filmarea evenimentului." },
    { id: "dj", name: "Sonorizare și DJ / MC", mode: "quote", desc: "Muzică, prezentare și instalație de sunet." },
    { id: "manager", name: "Manager de eveniment dedicat", mode: "quote", desc: "Planificare, coordonare, momente speciale." },
    { id: "photobooth", name: "Cabină foto cu accesorii", mode: "quote", desc: "Fundal tematic, accesorii, print instant." },
    { id: "video360", name: "Platformă video selfie 360", mode: "quote", desc: "Clipuri 360 personalizate, livrate digital." },
    { id: "hollywood", name: "Primire Hollywood Glam", mode: "quote", desc: "Covor roșu, stâlpișori, photo wall, echipă de primire." },
    { id: "decor-lumini", name: "Decor și lumini", mode: "quote", desc: "Cifre luminoase, decor de mese, iluminat ambiental." },
    { id: "meniu", name: "Meniu și servicii de bar", mode: "quote", desc: "Meniu, băuturi, tort personalizat, fântână de ciocolată." },
    { id: "entertainment", name: "Entertainment și momente speciale", mode: "quote", desc: "Regele și Regina Balului, concursuri, baghete LED." },
    { id: "invitatii", name: "Planificare și invitații", mode: "quote", desc: "Invitații electronice, schița sălii, aranjarea meselor." },
  ],

  /* ---------------- Campanii (secțiunile 8, 9, 19) ----------------
     Conform brief-ului, la lansare campaniile sunt INACTIVE și neafișate.
     Pentru demonstrație, câteva sunt activate mai jos — pune
     `active: false` pentru a le ascunde (dispar din carusel, din
     pagina de promoții și din mențiunile de pe produse).
     Datele sunt în fusul Europe/Bucharest.                             */
  campaigns: [
    {
      id: "early-booking-albume",
      active: true,
      homepage: true,
      priority: 1,
      start: "2026-09-01T00:00:00+03:00",
      end: "2027-01-31T23:59:00+02:00",
      categories: ["albume"],
      albums: ["velvet", "deluxe", "class", "elite"],
      title: "Early Booking Albume",
      slogan: "Rezervați din toamnă, pozați de două ori.",
      short: "Studio mobil de toamnă și diplomă tip mapă cu fotografia elevului.",
      img: "assets/img/velvet-int-3.webp",
      benefits: [
        "Ședință foto suplimentară în studioul mobil de toamnă, cu fundaluri și accesorii tematice.",
        "Diplomă tip mapă cu fotografia fiecărui elev.",
      ],
      conditions: [
        "Minimum 3 clase ȘI minimum 50 de elevi cu albume contra cost.",
        "Programare comună într-un spațiu interior confirmat.",
        "Beneficiile se acordă claselor eligibile participante, după confirmarea echipei.",
      ],
      buttons: [{ label: "Vezi albumele", href: "albume" }],
    },
    {
      id: "impreuna-in-album",
      active: true,
      homepage: true,
      priority: 2,
      start: "2026-09-01T00:00:00+03:00",
      end: "2027-04-30T23:59:00+03:00",
      categories: ["albume"],
      albums: ["economy", "velvet", "deluxe", "class", "elite"],
      title: "Împreună în album",
      slogan: "Toată promoția, un singur gând pentru profesori.",
      short: "Albume de promoție cadou pentru profesori, când toate clasele aleg albumul.",
      img: "assets/img/deluxe-int-3.webp",
      benefits: ["Albume de promoție cadou pentru profesori (sau o alternativă aprobată, precum panoul promoției)."],
      conditions: [
        "Unanimitate: toate clasele promoției comandă albume — fie 2, fie 8 clase.",
        "Componența promoției și îndeplinirea condiției sunt validate de echipă.",
      ],
      buttons: [{ label: "Vezi albumele", href: "albume" }],
    },
    {
      id: "fidelitate",
      active: true,
      homepage: true,
      priority: 3,
      start: "2026-09-01T00:00:00+03:00",
      end: "2027-05-31T23:59:00+03:00",
      categories: ["albume", "festivitate"],
      albums: ["economy", "velvet", "deluxe", "class", "elite"],
      title: "Avantaj de fidelitate — Album + robe",
      slogan: "Cine alege ambele, primește mai mult.",
      short: "Set bonus de 6 fotografii tip ID pentru elevii care aleg și albumul, și vestimentația.",
      img: "assets/img/roba-visiniu-pack.webp",
      benefits: ["Set bonus de 6 fotografii simple tip ID, pentru documentele de la secretariat."],
      conditions: [
        "Se acordă elevilor care aleg ambele categorii (album + vestimentație).",
        "Exemplu: din 25 de elevi cu vestimentație, 20 comandă și album → 20 de seturi bonus.",
        "Numărul elevilor comuni se înregistrează explicit și se verifică de echipă.",
      ],
      buttons: [
        { label: "Vezi albumele", href: "albume" },
        { label: "Vezi robele", href: "vestimentatie" },
      ],
    },
    {
      id: "early-booking-festivitate",
      active: false,
      homepage: true,
      priority: 4,
      categories: ["festivitate"],
      title: "Early Booking Festivitate",
      slogan: "Rezervați din timp, alegeți avantajul.",
      short: "Personalizarea tocii sau alte variante definite de Absolvire.ro.",
      img: "assets/img/palarie-visiniu-pers.webp",
      benefits: ["Personalizarea tocii sau o altă variantă aleasă de clasă."],
      conditions: ["Condițiile se stabilesc de echipa Absolvire.ro la activare."],
      buttons: [{ label: "Vezi robele", href: "vestimentatie" }],
    },
    {
      id: "impreuna-la-festivitate",
      active: false,
      homepage: false,
      priority: 5,
      categories: ["festivitate"],
      title: "Împreună la festivitate",
      slogan: "Un set de premiere pentru toată promoția.",
      short: "Set colectiv de premiere pentru promoțiile care participă împreună.",
      img: "assets/img/diploma-prof.webp",
      benefits: ["Set colectiv de premiere; poate exista alegere între două sau mai multe seturi."],
      conditions: ["Conținutul și cantitățile sunt definite de Absolvire.ro."],
      buttons: [{ label: "Vezi premierea", href: "premiere" }],
    },
  ],
};
