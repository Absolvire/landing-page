const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector("#nav");
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("open", open);
});
nav.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
  }),
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("open")) {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
    menu.focus();
  }
});
document.querySelectorAll("[data-service]").forEach((link) =>
  link.addEventListener("click", () => {
    document.querySelector('[name="service"]').value = link.dataset.service;
  }),
);
document.querySelectorAll("[data-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    document
      .querySelectorAll("[data-filter]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    document.querySelectorAll(".gallery-item").forEach((item) => {
      item.hidden =
        button.dataset.filter !== "all" &&
        item.dataset.category !== button.dataset.filter;
    });
  }),
);
const lightbox = document.querySelector("#lightbox");
document.querySelectorAll(".gallery-item").forEach((button) =>
  button.addEventListener("click", () => {
    const source = button.querySelector("img");
    lightbox.querySelector("img").src = button.dataset.image;
    lightbox.querySelector("img").alt = source.alt;
    lightbox.querySelector("p").textContent = source.alt;
    lightbox.showModal();
  }),
);
lightbox
  ?.querySelector(".close")
  .addEventListener("click", () => lightbox.close());
lightbox?.addEventListener("click", (e) => {
  if (e.target === lightbox) {
    const r = lightbox.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      lightbox.close();
  }
});
document.querySelector("#year").textContent = new Date().getFullYear();
const form = document.querySelector("#contact-form");
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const status = document.querySelector("#form-status");
  const button = form.querySelector('[type="submit"]');
  status.hidden = true;
  status.className = "";
  const data = new FormData(form);
  if (data.get("botcheck")) return;
  if (data.get("access_key") === "test-test-test") {
    status.textContent =
      "Formularul este în curs de configurare. Cererea nu a fost trimisă. Contactează-ne la 0723 88 25 11 sau comenzi.scoli@gmail.com.";
    status.hidden = false;
    return;
  }
  data.set(
    "message",
    `Instituția: ${data.get("school")}\nTelefon: ${data.get("phone") || "Nespecificat"}\nServiciu: ${data.get("service")}\nParticipanți: ${data.get("participants") || "Nespecificat"}\n\n${data.get("message")}`,
  );
  ["school", "phone", "service", "participants"].forEach((key) =>
    data.delete(key),
  );
  const original = button.innerHTML;
  button.disabled = true;
  button.textContent = "Se trimite…";
  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: data,
      signal: AbortSignal.timeout(20000),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error("Submission failed");
    status.className = "success";
    status.textContent =
      "Mulțumim! Cererea ta a fost trimisă. Vom reveni cu un răspuns pentru promoția voastră.";
    form.reset();
  } catch {
    status.textContent =
      "Nu am putut confirma trimiterea. Încearcă din nou sau contactează-ne la 0723 88 25 11. Datele completate au fost păstrate.";
  } finally {
    status.hidden = false;
    button.disabled = false;
    button.innerHTML = original;
  }
});

const requestedService = new URLSearchParams(window.location.search).get(
  "serviciu",
);
const serviceNames = {
  "robe-si-esarfe": "Robe și eșarfe",
  "diplome-si-accesorii": "Diplome și accesorii",
  albume: "Albume și fotografie",
  "festivitati-si-baluri": "Festivități și baluri",
};
if (form && serviceNames[requestedService])
  form.elements.service.value = serviceNames[requestedService];

// Use the original photographed variants, committing selection only after loading.
const scarfImage = document.querySelector("#scarf-image");
if (scarfImage) {
  const swatches = [...document.querySelectorAll("[data-scarf]")];
  const status = document.querySelector("#scarf-status");
  let selectionRequest = 0;
  swatches.forEach((button, index) =>
    button.addEventListener("click", async () => {
      const request = ++selectionRequest;
      status.textContent = `Se încarcă nuanța ${button.dataset.label}…`;
      const preview = new Image();
      preview.src = button.dataset.src;
      try {
        await preview.decode();
      } catch {
        if (request === selectionRequest)
          status.textContent =
            "Imaginea nu s-a încărcat. Încearcă din nou; selecția anterioară este păstrată.";
        return;
      }
      if (request !== selectionRequest) return;
      scarfImage.src = button.dataset.src;
      scarfImage.alt = `Eșarfă de absolvire — ${button.dataset.label}`;
      swatches.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
      document.querySelector("#scarf-name").textContent = button.dataset.label;
      document.querySelector("#scarf-counter").textContent =
        `${String(index + 1).padStart(2, "0")} / ${swatches.length}`;
      document
        .querySelector(".scarf-studio")
        .style.setProperty(
          "--selected-scarf",
          button.style.getPropertyValue("--swatch"),
        );
      status.textContent = `Culoare selectată: ${button.dataset.label}.`;

    }),
  );
}

function updatePromotionYear() {
 const currentYear = new Intl.DateTimeFormat('ro-RO', {year:'numeric', timeZone:'Europe/Bucharest'}).format(new Date());
 document.querySelectorAll('.promotion-year').forEach(node => { node.textContent = String(Number(currentYear) + 1); });
}
updatePromotionYear();
if(document.querySelector('.promotion-year')) {
 setInterval(updatePromotionYear, 60000);
 document.addEventListener('visibilitychange', () => { if(!document.hidden) updatePromotionYear(); });
}

const capImage = document.querySelector('#cap-image');
if(capImage) {
 let capModel = 0, capColor = 0, bandName = "Roșu";
 const models = ['Perfect Fit', 'Clasică'];
 const colors = ['Negru', 'Albastru', 'Vișiniu'];
 function updateCap() {
  capImage.style.backgroundPosition = `${capColor * 50}% ${capModel * 100}%`;
  const tint = document.querySelector('#cap-band-tint');
  tint.style.backgroundPosition = "0% 100%";
  tint.hidden = capModel !== 1;
  document.querySelector('#cap-band-controls').hidden = capModel !== 1;
  const bandDescription = capModel === 1 ? ` · Bentiță ${bandName.toLowerCase()}` : '';
  capImage.setAttribute('aria-label', `Tocă ${models[capModel]}, culoarea ${colors[capColor]}${bandDescription}`);
  document.querySelector('#cap-caption').textContent = `${models[capModel]} · ${colors[capColor]}${bandDescription}`;
  document.querySelector('#cap-status').textContent = `${models[capModel]}, în culoarea ${colors[capColor]}${bandDescription}.`;
  document.querySelectorAll('[data-cap-model]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.capModel) === capModel)));
  document.querySelectorAll('[data-cap-color]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.capColor) === capColor)));
 }
 document.querySelectorAll('[data-band-color]').forEach(button => button.addEventListener('click', () => {
  bandName = button.dataset.bandName;
  document.querySelector('#ribbon-fill').setAttribute('flood-color', button.dataset.bandColor);
  document.querySelectorAll('[data-band-color]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  updateCap();
 }));
 document.querySelectorAll('[data-cap-model]').forEach(b => b.addEventListener('click', () => {capModel = Number(b.dataset.capModel); updateCap();}));
 document.querySelectorAll('[data-cap-color]').forEach(b => b.addEventListener('click', () => {capColor = Number(b.dataset.capColor); updateCap();}));
}

const bandTrack = document.querySelector('#band-color-track');
if(bandTrack) {
 const previous = document.querySelector('#band-prev');
 const next = document.querySelector('#band-next');
 function updateBandArrows() {
  previous.disabled = bandTrack.scrollLeft <= 2;
  next.disabled = bandTrack.scrollLeft + bandTrack.clientWidth >= bandTrack.scrollWidth - 2;
 }
 function scrollBand(direction) {
  const item = bandTrack.querySelector('button');
  const step = item.getBoundingClientRect().width + 8;
  const count = Math.max(1, Math.floor(bandTrack.clientWidth / step));
  bandTrack.scrollBy({left:direction * count * step,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 previous.addEventListener('click',()=>scrollBand(-1));
 next.addEventListener('click',()=>scrollBand(1));
 bandTrack.addEventListener('scroll',updateBandArrows,{passive:true});
 new ResizeObserver(updateBandArrows).observe(bandTrack);
 updateBandArrows();
}
