// Préparation des données : lit les fichiers BRUTS du défi (dossier donnees-brutes/, non versionné)
// et écrit de petits fichiers JSON PRÉ-FILTRÉS (colonnes utiles seulement, dénominateur conservé,
// 2 décimales) dans src/assets/ et public/donnees/. Aucun fichier brut n'entre dans le dépôt.
//
// Usage : node scripts/preparer-donnees.mjs      (ou : npm run donnees)
// Fichiers attendus dans donnees-brutes/ (chacun est optionnel : ce qui manque est simplement ignoré) :
//   Dec2025_scores.csv, Dec2025_indicators.csv   (Stanford FMTI, dossier Dec2025)
//   comparia_echantillon.csv                      (Compar:IA, échantillon de 20 000 paires)
//   export.geojson                                (OpenStreetMap, centres de données)
//   metropole-version-simplifiee.geojson          (contour de la France, gregoiredavid/france-geojson)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const brut = (f) => join(racine, "donnees-brutes", f);
const assets = (f) => join(racine, "src", "assets", f);
const publicDonnees = (f) => join(racine, "public", "donnees", f);
mkdirSync(join(racine, "public", "donnees"), { recursive: true });

// ---------- outils ----------
export function lireCsv(texte) {
  // analyseur CSV minimal : guillemets, guillemets doublés, retours à la ligne dans les champs
  const lignes = [];
  let ligne = [], champ = "", entre = false;
  const t = texte.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (entre) {
      if (c === '"') { if (t[i + 1] === '"') { champ += '"'; i++; } else entre = false; }
      else champ += c;
    } else if (c === '"') entre = true;
    else if (c === ",") { ligne.push(champ); champ = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      ligne.push(champ); champ = ""; lignes.push(ligne); ligne = [];
    } else champ += c;
  }
  if (champ !== "" || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  const [entete, ...corps] = lignes.filter((l) => l.length > 1 || l[0] !== "");
  return { colonnes: entete, lignes: corps.map((l) => Object.fromEntries(entete.map((k, i) => [k, l[i] ?? ""]))) };
}
const somme = (a, f = (x) => x) => a.reduce((s, x) => s + f(x), 0);
const mediane = (a) => { const t = [...a].sort((x, y) => x - y); const m = t.length >> 1; return t.length ? (t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2) : null; };
const moyenne = (a) => (a.length ? somme(a) / a.length : null);
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
const r3s = (x) => (x == null ? null : Number(x.toPrecision(3))); // 3 chiffres significatifs (valeurs < 1 Wh)
const ecrire = (nom, donnees, aussiPublic = true) => {
  const json = JSON.stringify(donnees, null, 1);
  writeFileSync(assets(nom), json);
  if (aussiPublic) writeFileSync(publicDonnees(nom), json);
  console.log("écrit", nom);
};

// ---------- 1. Stanford FMTI ----------
// Deux entrées possibles : les CSV d'origine (scores + définitions) OU le JSON des scores seul.
// Avec le JSON seul, le domaine est déduit de l'ordre des lignes (34 Upstream, 30 Model, 36 Downstream,
// ordre vérifié : il redonne les totaux du notebook) et la jointure avec les définitions n'est pas contrôlable.
const aScoresCsv = existsSync(brut("Dec2025_scores.csv"));
const aScoresJson = existsSync(brut("Dec2025_scores.json"));
if (aScoresCsv || aScoresJson) {
  const aDefs = aScoresCsv && existsSync(brut("Dec2025_indicators.csv"));
  const scores = aScoresCsv
    ? lireCsv(readFileSync(brut("Dec2025_scores.csv"), "utf8"))
    : (() => { const l = JSON.parse(readFileSync(brut("Dec2025_scores.json"), "utf8")); return { colonnes: Object.keys(l[0]), lignes: l.map((d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, String(v)]))) }; })();
  const defs = aDefs ? lireCsv(readFileSync(brut("Dec2025_indicators.csv"), "utf8")) : null;
  const dico = new Map((defs?.lignes ?? []).map((d) => [d.Indicator.trim(), d]));
  const etudiees = ["Google", "OpenAI", "Mistral"];
  const entreprises = scores.colonnes.filter((c) => c !== "Indicator");
  const TAILLES = [["Upstream", 34], ["Model", 30], ["Downstream", 36]];
  const domaineParPosition = (i) => { let n = 0; for (const [d, t] of TAILLES) { n += t; if (i < n) return d; } return null; };

  const jointure = scores.lignes.map((d, i) => {
    const info = dico.get(d.Indicator.trim());
    return { id: i + 1, domaine: info?.Domain ?? (aDefs ? null : domaineParPosition(i)), critere: d.Indicator.trim(), definition: info?.Definition ?? "", ...Object.fromEntries(entreprises.map((e) => [e, Number(d[e])])) };
  });

  ecrire("stanford_scores.json", entreprises.map((e) => ({ entreprise: e, score: somme(jointure, (d) => d[e]) })));

  const domaines = TAILLES.map((t) => t[0]);
  const totalReconnu = somme(domaines, (dom) => jointure.filter((d) => d.domaine === dom).length);
  if (totalReconnu !== 100) throw new Error(`Attention : ${totalReconnu} critères reconnus sur 100. Vérifier les domaines Stanford.`);
  ecrire("fmti.json", domaines.flatMap((domaine) => {
    const crit = jointure.filter((d) => d.domaine === domaine);
    return etudiees.map((entreprise) => {
      const satisfaits = somme(crit, (d) => d[entreprise]);
      return { domaine, entreprise, satisfaits, total: crit.length, pourcentage: r2((satisfaits / crit.length) * 100) };
    });
  }));

  // critères environnementaux (énergie, carbone, eau, émissions) : nom du critère + définition si disponible
  ecrire("stanford_environnement.json",
    jointure.filter((d) => /energy|carbon|water|emission/i.test(d.critere + " " + d.definition))
      .map((d) => ({ critere: d.critere, Google: d.Google, OpenAI: d.OpenAI, Mistral: d.Mistral })));

  // contrôle de la jointure (page Méthode) : seulement si le fichier des définitions est fourni
  if (aDefs) {
    const cles = new Set(scores.lignes.map((d) => d.Indicator.trim()));
    const clesDef = new Set(defs.lignes.map((d) => d.Indicator.trim()));
    const invalides = scores.lignes.flatMap((d) => etudiees.filter((e) => { const v = d[e]; return v == null || String(v).trim() === "" || !Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > 1; }));
    ecrire("stanford_controle.json", {
      criteresScores: scores.lignes.length,
      definitions: defs.lignes.length,
      sansDefinition: scores.lignes.filter((d) => !clesDef.has(d.Indicator.trim())).length,
      sansScore: defs.lignes.filter((d) => !cles.has(d.Indicator.trim())).length,
      doublonsScores: scores.lignes.length - cles.size,
      doublonsDefinitions: defs.lignes.length - clesDef.size,
      valeursInvalides: invalides.length,
      scores: Object.fromEntries(etudiees.map((e) => [e, somme(jointure, (d) => d[e])])),
    });
  } else console.log("Stanford : pas de fichier des définitions, contrôle de jointure non produit.");
} else console.log("Stanford : fichiers absents, ignoré.");

// ---------- 2. Compar:IA ----------
const entrepriseDuModele = (nom) => {
  const n = String(nom ?? "").toLowerCase();
  if (/^(gpt|chatgpt|o1|o3|o4)/.test(n)) return "OpenAI";
  if (/^(gemini|gemma)/.test(n)) return "Google";
  if (/^(mistral|mixtral|codestral|ministral|magistral|pixtral|devstral)/.test(n)) return "Mistral";
  return "Autres";
};
if (existsSync(brut("comparia_echantillon.csv"))) {
  const { lignes } = lireCsv(readFileSync(brut("comparia_echantillon.csv"), "utf8"));
  const num = (x) => (x === "" || x == null ? null : Number(x));
  // une paire = deux conversations
  const conv = lignes.flatMap((r) => ["a", "b"].map((c) => {
    const kwh = num(r[`total_conv_${c}_kwh`]);
    const tokens = num(r[`total_conv_${c}_output_tokens`]);
    return {
      modele: r[`model_${c}_name`],
      entreprise: entrepriseDuModele(r[`model_${c}_name`]),
      kwh, wh: kwh > 0 ? kwh * 1000 : null,
      wh1000: kwh > 0 && tokens > 0 ? (kwh * 1e6) / tokens : null,
    };
  }));
  const ok = conv.filter((d) => d.wh > 0);
  const stats = {};
  for (const e of ["OpenAI", "Google", "Mistral"]) {
    const v = ok.filter((d) => d.entreprise === e).map((d) => d.wh);
    stats[e] = { n: v.length, med: r3s(mediane(v)), moy: r3s(moyenne(v)), min: r3s(Math.min(...v)), max: r3s(Math.max(...v)) };
  }
  const parModele = new Map();
  for (const d of ok.filter((x) => x.entreprise !== "Autres")) {
    if (!parModele.has(d.modele)) parModele.set(d.modele, []);
    parModele.get(d.modele).push(d);
  }
  const modeles = [...parModele].map(([modele, v]) => ({
    modele, entreprise: v[0].entreprise, conversations: v.length,
    mediane_wh: r3s(mediane(v.map((d) => d.wh))),
    wh_1000_tokens: r3s(mediane(v.map((d) => d.wh1000).filter((x) => x != null))),
  })).sort((a, b) => b.conversations - a.conversations);
  const compte = (arr, cle) => { const m = new Map(); for (const d of arr) m.set(d[cle], (m.get(d[cle]) ?? 0) + 1); return [...m]; };
  ecrire("compar_stats.json", {
    total: conv.length, exploitables: ok.length, stats, modeles,
    controle: {
      sansKwh: conv.filter((d) => d.kwh == null).length,
      kwhNul: conv.filter((d) => d.kwh === 0).length,
      parEntreprise: compte(conv, "entreprise").map(([entreprise, conversations]) => ({ entreprise, conversations })),
      autres: compte(conv.filter((d) => d.entreprise === "Autres"), "modele").map(([modele, conversations]) => ({ modele, conversations })).sort((a, b) => b.conversations - a.conversations),
    },
  });
} else console.log("Compar:IA : fichier absent, ignoré.");

// ---------- 3. OpenStreetMap ----------
if (existsSync(brut("export.geojson"))) {
  const osm = JSON.parse(readFileSync(brut("export.geojson"), "utf8"));
  const st = { initial: osm.features.length, sansTag: 0, sansCoordonnees: 0, horsMetropole: 0, doublons: 0, conserves: 0 };
  const ids = new Set(), lieux = [];
  const points = (g) => { const out = []; (function p(e) { if (!Array.isArray(e)) return; if (typeof e[0] === "number" && typeof e[1] === "number") out.push(e); else e.forEach(p); })(g?.coordinates); return out; };
  for (const f of osm.features) {
    const p = f.properties ?? {};
    if (p.telecom !== "data_center" && p.building !== "data_center") { st.sansTag++; continue; }
    const pts = points(f.geometry).filter((c) => Number.isFinite(c[0]) && Number.isFinite(c[1]));
    if (!pts.length) { st.sansCoordonnees++; continue; }
    const lo = pts.map((c) => c[0]), la = pts.map((c) => c[1]);
    const longitude = (Math.min(...lo) + Math.max(...lo)) / 2, latitude = (Math.min(...la) + Math.max(...la)) / 2;
    if (longitude < -6 || longitude > 10 || latitude < 41 || latitude > 52) { st.horsMetropole++; continue; }
    const id = f.id ?? p["@id"];
    if (ids.has(id)) { st.doublons++; continue; }
    ids.add(id);
    lieux.push({ id, nom: p.name ?? "Centre de données non nommé", operateur: p.operator ?? "Non renseigné", longitude: Math.round(longitude * 1e4) / 1e4, latitude: Math.round(latitude * 1e4) / 1e4, typeGeometrie: f.geometry.type });
  }
  st.conserves = lieux.length;
  if (st.initial !== st.sansTag + st.sansCoordonnees + st.horsMetropole + st.doublons + st.conserves) throw new Error("Le bilan du nettoyage ne correspond pas au total initial.");
  ecrire("centres_donnees.json", { statistiques: st, lieux });
} else console.log("OpenStreetMap : fichier absent, ignoré.");

// ---------- 4. Contour de la France (coordonnées arrondies à 3 décimales) ----------
if (existsSync(brut("metropole-version-simplifiee.geojson"))) {
  const arrondir = (e) => (typeof e === "number" ? Math.round(e * 1e3) / 1e3 : Array.isArray(e) ? e.map(arrondir) : e);
  const g = JSON.parse(readFileSync(brut("metropole-version-simplifiee.geojson"), "utf8"));
  const contour = { type: "FeatureCollection", features: (g.features ?? [g]).map((f) => ({ type: "Feature", properties: {}, geometry: { ...f.geometry, coordinates: arrondir(f.geometry.coordinates) } })) };
  ecrire("france_metropole.json", contour, false);
} else console.log("Contour France : fichier absent, ignoré.");
