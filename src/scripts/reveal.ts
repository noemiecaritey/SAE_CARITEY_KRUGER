// Un seul script partagé pour toutes les animations de scroll (CSS d'abord, IntersectionObserver en repli).
// Uniquement transform + opacity. Désactivé par prefers-reduced-motion. Sans JS : tout reste visible
// (l'état « masqué » n'existe que si <html class="js">).
const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js");
if (reduit) document.documentElement.classList.add("reduit");

// --- 1. Apparition des blocs (une seule fois) ---
const blocs = document.querySelectorAll<HTMLElement>(".reveal");
document.querySelectorAll<HTMLElement>(".reveal-stagger").forEach((g) => {
  Array.from(g.children).forEach((c, i) => (c as HTMLElement).style.setProperty("--d", `${i * 80}ms`));
});
// --- 2. Graphiques qui se dessinent (≈ 30 % visibles) ---
const graphiques = document.querySelectorAll<HTMLElement>("[data-anim]");
// --- 3. Compteurs ---
const compteurs = document.querySelectorAll<HTMLElement>("[data-count]");

function prepareGraphique(el: HTMLElement) {
  // décalage progressif : une ligne/colonne après l'autre selon l'ordre des éléments SVG
  const svg = el.querySelector("svg[role=img]");
  if (!svg) return;
  let i = 0;
  svg.querySelectorAll("rect").forEach((r) => {
    (r as SVGElement).style.setProperty("--d", `${i * 35}ms`);
    i++;
  });
  svg.querySelectorAll("text").forEach((t) => (t as SVGElement).style.setProperty("--d", `${i * 35 + 150}ms`));
}

function compte(el: HTMLElement) {
  const fin = Number(el.dataset.count);
  const prefixe = el.dataset.prefix ?? "";
  const suffixe = el.dataset.suffix ?? "";
  const final = el.textContent ?? "";
  if (reduit || Number.isNaN(fin)) return;
  const debut = performance.now();
  const duree = 900;
  const tick = (t: number) => {
    const p = Math.min(1, (t - debut) / duree);
    const v = Math.round(fin * (1 - Math.pow(1 - p, 3)));
    el.textContent = `${prefixe}${v.toLocaleString("fr-FR")}${suffixe}`;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = final;
  };
  requestAnimationFrame(tick);
}

graphiques.forEach(prepareGraphique);

const io = new IntersectionObserver(
  (entrees) => {
    for (const e of entrees) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLElement;
      el.classList.add("in");
      if (el.hasAttribute("data-count")) compte(el);
      io.unobserve(el); // une seule fois
    }
  },
  { threshold: 0.3 },
);
[...blocs, ...graphiques, ...compteurs].forEach((el) => io.observe(el));

// --- 4. Barre de progression de lecture (repli JS si animation-timeline: scroll() n'existe pas) ---
const barre = document.getElementById("progression");
if (barre && !CSS.supports("animation-timeline: scroll()")) {
  const maj = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    barre.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  };
  addEventListener("scroll", maj, { passive: true });
  maj();
}

// --- 5. Menu d'ancres : section visible = .active (comme dans le TP : .menu-item / .item / .active) ---
// Les sections sont plus hautes que l'écran : un seuil de 0,5 de la section ne serait jamais atteint.
// On applique donc le seuil sur une bande centrale de l'écran (rootMargin) ; threshold 0 = dès qu'elle touche la bande.
const items = document.querySelectorAll<HTMLElement>(".item");
const liens = document.querySelectorAll<HTMLElement>(".menu-item");
if (items.length) {
  const nav = new IntersectionObserver(
    (entrees) => {
      for (const e of entrees) {
        if (!e.isIntersecting) continue;
        liens.forEach((l) => {
          const actif = l.getAttribute("href") === `#${e.target.id}`;
          l.classList.toggle("active", actif);
          if (actif) {
            // garde le <select> d'ancres (mobile) synchronisé avec la section visible
            const sel = document.getElementById("menu-ancres") as HTMLSelectElement | null;
            if (sel) sel.value = `#${e.target.id}`;
          }
          if (actif) l.setAttribute("aria-current", "true");
          else l.removeAttribute("aria-current");
        });
      }
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
  );
  items.forEach((i) => nav.observe(i));
}
