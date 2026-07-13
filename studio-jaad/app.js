/* ═══════════════════════════════════════════════════════════
   STUDIO JAAD — Portfolio & Esposizione
   Vanilla JS · no dependencies
   ═══════════════════════════════════════════════════════════ */

"use strict";

/* ───────────────────────────────────────────────
   OPERE IN MOSTRA
   Per usare le foto reali del profilo Instagram:
   1. Salva le immagini in studio-jaad/assets/ (es. 01.jpg, 02.jpg…)
   2. Aggiungi `src: "assets/01.jpg"` alla voce corrispondente.
   Senza `src`, viene generata automaticamente una tavola
   astratta segnaposto coerente con la palette del sito.
   ─────────────────────────────────────────────── */
const WORKS = [
  { title: "Opera I — Soglia",      category: "Serie",     year: "2026", palette: ["#e8c15a", "#0b0b0c", "#5a6ee8"] },
  { title: "Opera II — Riverbero",  category: "Studio",    year: "2026", palette: ["#5a6ee8", "#121214", "#e8c15a"] },
  { title: "Opera III — Trama",     category: "Dettaglio", year: "2025", palette: ["#c96f4a", "#0b0b0c", "#e8c15a"] },
  { title: "Opera IV — Vuoto",      category: "Serie",     year: "2025", palette: ["#9b968c", "#121214", "#e8c15a"] },
  { title: "Opera V — Attrito",     category: "Dettaglio", year: "2025", palette: ["#e8c15a", "#1a1a1e", "#c96f4a"] },
  { title: "Opera VI — Quiete",     category: "Studio",    year: "2025", palette: ["#5a8ee8", "#0b0b0c", "#f2efe9"] },
  { title: "Opera VII — Innesto",   category: "Serie",     year: "2024", palette: ["#b4862b", "#121214", "#5a6ee8"] },
  { title: "Opera VIII — Margine",  category: "Studio",    year: "2024", palette: ["#f2efe9", "#0b0b0c", "#e8c15a"] },
  { title: "Opera IX — Eco",        category: "Dettaglio", year: "2024", palette: ["#7a5ae8", "#0b0b0c", "#e8c15a"] },
];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ─────────────── PLACEHOLDER ART ───────────────
   Tavole astratte generate in SVG, deterministiche
   per indice, così ogni card è unica ma stabile. */
function placeholderArt(i, palette) {
  const [a, bg, c] = palette;
  const seed = (n) => {
    const x = Math.sin((i + 1) * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const shapes = [];
  const kind = i % 3;
  if (kind === 0) {
    // grandi archi concentrici
    for (let k = 0; k < 5; k++) {
      const r = 60 + k * 52 + seed(k) * 20;
      shapes.push(`<circle cx="${420 + seed(k + 9) * 160}" cy="${330 + seed(k + 4) * 120}" r="${r}" fill="none" stroke="${k % 2 ? a : c}" stroke-opacity="${0.55 - k * 0.08}" stroke-width="${2 + seed(k) * 2}"/>`);
    }
    shapes.push(`<circle cx="${430 + seed(2) * 120}" cy="${340 + seed(7) * 90}" r="${38 + seed(3) * 26}" fill="${a}"/>`);
  } else if (kind === 1) {
    // bande diagonali
    for (let k = 0; k < 7; k++) {
      const y = k * 110 + seed(k) * 60 - 120;
      shapes.push(`<rect x="-200" y="${y}" width="1200" height="${26 + seed(k + 5) * 44}" fill="${k % 2 ? a : c}" fill-opacity="${0.5 - k * 0.05}" transform="rotate(-14 400 300)"/>`);
    }
    shapes.push(`<circle cx="${560 + seed(1) * 120}" cy="${170 + seed(6) * 120}" r="${54 + seed(8) * 30}" fill="none" stroke="${a}" stroke-width="3"/>`);
  } else {
    // griglia di semicerchi
    for (let r = 0; r < 3; r++) {
      for (let col = 0; col < 4; col++) {
        const flip = seed(r * 4 + col) > 0.5 ? 0 : 180;
        const cx = 100 + col * 200, cy = 120 + r * 190;
        shapes.push(`<path d="M ${cx - 70} ${cy} A 70 70 0 0 1 ${cx + 70} ${cy} Z" fill="${(r + col) % 2 ? a : c}" fill-opacity="${0.6 + seed(col) * 0.3}" transform="rotate(${flip} ${cx} ${cy})"/>`);
      }
    }
  }
  return `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Tavola astratta segnaposto">
    <defs>
      <radialGradient id="g${i}" cx="30%" cy="20%" r="90%">
        <stop offset="0%" stop-color="${bg}" stop-opacity="1"/>
        <stop offset="100%" stop-color="#08080a"/>
      </radialGradient>
    </defs>
    <rect width="800" height="600" fill="url(#g${i})"/>
    ${shapes.join("\n")}
    <text x="40" y="560" fill="${a}" fill-opacity="0.85" font-family="Georgia, serif" font-style="italic" font-size="26">JAAD — n.${String(i + 1).padStart(2, "0")}</text>
  </svg>`;
}

function workMediaHTML(work, i) {
  if (work.src) {
    return `<img src="${work.src}" alt="${work.title}" loading="lazy"/>`;
  }
  return placeholderArt(i, work.palette || ["#e8c15a", "#121214", "#5a6ee8"]);
}

/* ─────────────── PRELOADER ─────────────── */
const preloader = document.getElementById("preloader");
const preloaderCount = document.getElementById("preloaderCount");
(function runPreloader() {
  if (prefersReducedMotion) {
    preloader.remove();
    document.body.classList.add("is-loaded");
    return;
  }
  let n = 0;
  const tick = () => {
    n = Math.min(100, n + Math.ceil(Math.random() * 8));
    preloaderCount.textContent = String(n).padStart(3, "0");
    if (n < 100) {
      setTimeout(tick, 34);
    } else {
      preloader.classList.add("is-done");
      document.body.classList.add("is-loaded");
      setTimeout(() => preloader.remove(), 1400);
    }
  };
  setTimeout(tick, 300);
})();

/* ─────────────── SPLIT TEXT ─────────────── */
function splitChars(el) {
  const text = el.textContent;
  el.textContent = "";
  [...text].forEach((ch, idx) => {
    const s = document.createElement("span");
    s.className = "char";
    s.textContent = ch === " " ? " " : ch;
    s.style.transitionDelay = `${idx * 0.035}s`;
    el.appendChild(s);
  });
}
document.querySelectorAll("[data-split]").forEach(splitChars);

function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = "";
  words.forEach((w, idx) => {
    const wrap = document.createElement("span");
    wrap.className = "word";
    const inner = document.createElement("span");
    inner.textContent = w;
    inner.style.transitionDelay = `${idx * 0.06}s`;
    wrap.appendChild(inner);
    el.appendChild(wrap);
    if (idx < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
}
document.querySelectorAll("[data-split-words]").forEach(splitWords);

/* ─────────────── CURSOR ─────────────── */
const cursor = document.getElementById("cursor");
const cursorLabel = document.getElementById("cursorLabel");
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !prefersReducedMotion) {
  const dot = cursor.querySelector(".cursor__dot");
  const ring = cursor.querySelector(".cursor__ring");
  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my;
  addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
  (function loop() {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    ring.style.left = cursorLabel.style.left = `${rx}px`;
    ring.style.top = cursorLabel.style.top = `${ry}px`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener("mouseover", (e) => {
    const t = e.target.closest("[data-cursor]");
    cursor.classList.toggle("is-hover", !!t && t.dataset.cursor === "hover");
    const view = !!t && t.dataset.cursor === "view";
    cursor.classList.toggle("is-view", view);
    cursorLabel.textContent = view ? "apri ↗" : "";
  });
} else {
  cursor.remove();
}

/* ─────────────── NAV: hide on scroll down, bg on scroll ─────────────── */
const nav = document.getElementById("nav");
const progressBar = document.getElementById("scrollProgress");
let lastY = 0;
addEventListener("scroll", () => {
  const y = scrollY;
  nav.classList.toggle("is-scrolled", y > 60);
  nav.classList.toggle("is-hidden", y > 400 && y > lastY && !menu.classList.contains("is-open"));
  lastY = y;
  const max = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
}, { passive: true });

/* ─────────────── MENU OVERLAY ─────────────── */
const burger = document.getElementById("burger");
const menu = document.getElementById("menu");
function toggleMenu(force) {
  const open = force !== undefined ? force : !menu.classList.contains("is-open");
  menu.classList.toggle("is-open", open);
  burger.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-hidden", String(!open));
  document.body.style.overflow = open ? "hidden" : "";
}
burger.addEventListener("click", () => toggleMenu());
menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

/* ─────────────── MARQUEE (loop infinito) ─────────────── */
const marqueeTrack = document.getElementById("marqueeTrack");
(function marquee() {
  marqueeTrack.innerHTML += marqueeTrack.innerHTML + marqueeTrack.innerHTML;
  if (prefersReducedMotion) return;
  let x = 0;
  const speed = 0.6;
  const third = () => marqueeTrack.scrollWidth / 3;
  (function step() {
    x -= speed;
    if (-x >= third()) x += third();
    marqueeTrack.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(step);
  })();
})();

/* ─────────────── WORKS GRID ─────────────── */
const grid = document.getElementById("worksGrid");
const filtersBox = document.getElementById("filters");

function renderWorks() {
  grid.innerHTML = "";
  WORKS.forEach((w, i) => {
    const el = document.createElement("article");
    el.className = "work reveal-watch";
    el.dataset.category = w.category;
    el.dataset.index = i;
    el.setAttribute("data-cursor", "view");
    el.innerHTML = `
      <div class="work__frame">
        <div class="work__media">${workMediaHTML(w, i)}</div>
        <div class="work__veil"></div>
        <span class="work__tag">${w.category} · ${w.year}</span>
        <span class="work__open" aria-hidden="true">↗</span>
      </div>
      <div class="work__info">
        <h3 class="work__title">${w.title}</h3>
        <span class="work__idx">n.${String(i + 1).padStart(2, "0")}</span>
      </div>`;
    el.addEventListener("click", () => openLightbox(i));
    grid.appendChild(el);
  });
}
renderWorks();

/* filtri */
const categories = ["Tutti", ...new Set(WORKS.map((w) => w.category))];
categories.forEach((cat, idx) => {
  const b = document.createElement("button");
  b.className = "filter" + (idx === 0 ? " is-active" : "");
  b.textContent = cat;
  b.setAttribute("data-cursor", "hover");
  b.setAttribute("role", "tab");
  b.addEventListener("click", () => {
    filtersBox.querySelectorAll(".filter").forEach((f) => f.classList.remove("is-active"));
    b.classList.add("is-active");
    grid.querySelectorAll(".work").forEach((card) => {
      const show = cat === "Tutti" || card.dataset.category === cat;
      card.classList.toggle("is-filtered-out", !show);
      if (show) {
        card.classList.remove("in-view");
        requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add("in-view")));
      }
    });
  });
  filtersBox.appendChild(b);
});

/* ─────────────── LIGHTBOX ─────────────── */
const lightbox = document.getElementById("lightbox");
const lightboxMedia = document.getElementById("lightboxMedia");
const lightboxTitle = document.getElementById("lightboxTitle");
const lightboxMeta = document.getElementById("lightboxMeta");
let currentIndex = 0;

function openLightbox(i) {
  currentIndex = (i + WORKS.length) % WORKS.length;
  const w = WORKS[currentIndex];
  lightboxMedia.innerHTML = workMediaHTML(w, currentIndex);
  lightboxTitle.textContent = w.title;
  lightboxMeta.textContent = `${w.category} — ${w.year} — n.${String(currentIndex + 1).padStart(2, "0")}`;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
document.getElementById("lightboxPrev").addEventListener("click", () => openLightbox(currentIndex - 1));
document.getElementById("lightboxNext").addEventListener("click", () => openLightbox(currentIndex + 1));
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
addEventListener("keydown", (e) => {
  if (menu.classList.contains("is-open") && e.key === "Escape") { toggleMenu(false); return; }
  if (!lightbox.classList.contains("is-open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") openLightbox(currentIndex - 1);
  if (e.key === "ArrowRight") openLightbox(currentIndex + 1);
});

/* ─────────────── SCROLL REVEALS ─────────────── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

document.querySelectorAll(".reveal-line, .reveal-up, .work, .section__title, .igcta__handle")
  .forEach((el) => observer.observe(el));

/* ─────────────── STATEMENT: parole che si accendono allo scroll ─────────────── */
const statementText = document.getElementById("statementText");
(function initStatement() {
  const words = statementText.textContent.trim().split(/\s+/);
  statementText.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
  const spans = statementText.querySelectorAll(".w");
  const update = () => {
    const rect = statementText.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (innerHeight * 0.85 - rect.top) / (rect.height + innerHeight * 0.35)));
    const lit = Math.floor(progress * spans.length);
    spans.forEach((s, i) => s.classList.toggle("is-lit", i <= lit));
  };
  addEventListener("scroll", update, { passive: true });
  update();
})();

/* ─────────────── COUNTERS ─────────────── */
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    counterObserver.unobserve(el);
    const target = parseInt(el.dataset.count, 10);
    if (prefersReducedMotion) { el.textContent = target; return; }
    const start = performance.now();
    const dur = 1600;
    (function frame(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(frame);
    })(start);
  });
}, { threshold: 0.6 });
document.querySelectorAll("[data-count]").forEach((el) => counterObserver.observe(el));

/* ─────────────── PARALLAX (orbs + media) ─────────────── */
if (!prefersReducedMotion) {
  const orbs = document.querySelectorAll(".hero__orb");
  addEventListener("scroll", () => {
    const y = scrollY;
    orbs.forEach((o, i) => {
      o.style.translate = `0 ${y * (i ? 0.12 : 0.2)}px`;
    });
  }, { passive: true });
}

/* ─────────────── MAGNETIC BUTTONS ─────────────── */
if (window.matchMedia("(hover: hover)").matches && !prefersReducedMotion) {
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = 0.35;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transition = "transform 0.6s cubic-bezier(0.19,1,0.22,1)";
      el.style.transform = "translate(0,0)";
      setTimeout(() => (el.style.transition = ""), 600);
    });
  });
}

/* ─────────────── MISC ─────────────── */
const year = new Date().getFullYear();
document.getElementById("footerYear").textContent = year;
document.getElementById("menuYear").textContent = year;
document.getElementById("toTop").addEventListener("click", () =>
  scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })
);
