// Calculs partagés par les pages (build) et testables sans Astro.
// Reprend les fonctions du notebook Observable (variationsGoogle, etatQ3, donneesChrono, variationsPeriode).

export type Entree = {
  id: string;
  entreprise: string;
  type: string;
  libelle: string;
  valeur: number | null;
  unite: string;
  annee: number | null;
  source: string;
  url: string;
  page: string;
  statut: "primaire" | "presse" | "a_saisir" | "non_trouve";
  note: string;
};

export const ENTREPRISES = ["Google", "OpenAI", "Mistral"] as const;

// Palette de DONNÉES (aucun vert : le vert est réservé à la charte)
export const COULEUR_ENTREPRISE: Record<string, string> = {
  Google: "#2B6CB0",
  OpenAI: "#D6336C",
  Mistral: "#F59E0B",
};
export const COULEURS_V1 = { Publié: "#2B6CB0", "Non identifié": "#E8E8E8" };
export const COULEURS_V3 = {
  "Consommation d'électricité": "#7A4FD0",
  "Émissions de gaz à effet de serre": "#A87600",
};
export const INDICATEURS = [
  { cle: "electricite", nom: "Électricité consommée", court: "Électricité", couleur: "#2A78D6" },
  { cle: "total", nom: "Émissions totales (scopes 1, 2 et 3)", court: "Émissions totales", couleur: "#C4571A" },
  { cle: "operationnel", nom: "Émissions opérationnelles (scopes 1 et 2)", court: "Émissions opérationnelles", couleur: "#7A4FD0" },
  { cle: "scope3", nom: "Émissions de la chaîne (scope 3)", court: "Scope 3", couleur: "#D6336C" },
] as const;
export const COULEURS_STATUT: Record<string, { fond: string; texte: string; label: string }> = {
  primaire: { fond: "#2B5FA8", texte: "#FFFFFF", label: "primaire" },
  presse: { fond: "#F59E0B", texte: "#0f2a33", label: "presse" },
  a_saisir: { fond: "#9AA7AE", texte: "#0f2a33", label: "à saisir" },
  non_trouve: { fond: "#F6D5CF", texte: "#A8564A", label: "non trouvé" },
};

// ---------- formats ----------
export const signe = (x: number | null) =>
  x == null ? "—" : (x > 0 ? "+" : x < 0 ? "−" : "") + Math.abs(x).toLocaleString("fr-FR", { maximumFractionDigits: 0 });
export const pct = (x: number) => `${signe(x)} %`;

// ---------- V1 ----------
export const publications: [string, "oui" | "non", "oui" | "non", "oui" | "non"][] = [
  ["Objectif climat daté", "oui", "non", "non"],
  ["Bilan annuel de CO₂e", "oui", "non", "non"],
  ["Énergie par requête", "oui", "oui", "non"],
  ["CO₂e par requête", "oui", "non", "oui"],
  ["Eau par requête", "oui", "oui", "oui"],
  ["Analyse du cycle de vie d'un modèle", "non", "non", "oui"],
];
export const donneesV1 = publications.flatMap((ligne) =>
  ENTREPRISES.map((entreprise, i) => ({
    indicateur: ligne[0],
    entreprise,
    statut: ligne[i + 1] === "oui" ? "Publié" : "Non identifié",
  })),
);
export const nbPublies = (e: string) => donneesV1.filter((d) => d.entreprise === e && d.statut === "Publié").length;

export const SOURCES_V1 = {
  google: "https://sustainability.google/intl/fr_fr/google-2026-environmental-report/",
  googleRequete:
    "https://blog.google/intl/fr-fr/nouveautes-produits/dans-le-cloud/quelle-consommation-energetique-pour-lia-de-google-nous-avons-fait-le-calcul/",
  openai: "https://blog.samaltman.com/the-gentle-singularity",
  mistral: "https://mistral.ai/news/our-contribution-to-a-global-environmental-standard-for-ai/",
};
// Précisions affichées au survol (clé : « Entreprise|Indicateur »)
export const PRECISIONS_V1: Record<string, { detail: string; source: string }> = {
  "Google|Objectif climat daté": { detail: "Google annonce des objectifs climatiques pour 2030.", source: SOURCES_V1.google },
  "Google|Bilan annuel de CO₂e": { detail: "Google publie des bilans annuels de ses émissions de gaz à effet de serre.", source: SOURCES_V1.google },
  "Google|Énergie par requête": { detail: "0,24 Wh pour un prompt textuel médian de Gemini Apps (2025).", source: SOURCES_V1.googleRequete },
  "OpenAI|Énergie par requête": { detail: "0,34 Wh par requête moyenne selon Sam Altman (2025). La méthode n'est pas détaillée dans cette déclaration.", source: SOURCES_V1.openai },
  "Google|CO₂e par requête": { detail: "0,03 gCO₂e pour un prompt textuel médian de Gemini Apps.", source: SOURCES_V1.googleRequete },
  "Mistral|CO₂e par requête": { detail: "1,14 gCO₂e pour une réponse type de 400 tokens de Le Chat.", source: SOURCES_V1.mistral },
  "Google|Eau par requête": { detail: "0,26 mL d'eau pour un prompt textuel médian de Gemini Apps.", source: SOURCES_V1.googleRequete },
  "OpenAI|Eau par requête": { detail: "0,000085 gallon d'eau par requête moyenne selon Sam Altman (2025). Méthode non détaillée dans cette déclaration.", source: SOURCES_V1.openai },
  "Mistral|Eau par requête": { detail: "45 mL d'eau pour une réponse type de 400 tokens de Le Chat.", source: SOURCES_V1.mistral },
  "Mistral|Analyse du cycle de vie d'un modèle": { detail: "Analyse environnementale de Mistral Large 2 publiée en 2025, réalisée avec Carbone 4 et revue par Resilio et Hubblo.", source: SOURCES_V1.mistral },
};

// ---------- V3 ----------
export const IDS_2025 = ["g_elec_2025", "g_ops_2025", "g_scope3_2025"] as const;
export const ETIQUETTES_V3: Record<string, string> = {
  g_elec_2025: "Électricité consommée",
  g_ops_2025: "Émissions opérationnelles",
  g_scope3_2025: "Chaîne d'approvisionnement (scope 3)",
};
export function variationsGoogle(registre: Entree[]) {
  return registre
    .filter((d) => d.entreprise === "Google" && d.type === "variation" && d.valeur !== null)
    .map((d) => ({
      id: d.id,
      libelle: `${d.libelle} (${d.annee})`,
      etiquette: ETIQUETTES_V3[d.id] ?? d.libelle,
      valeur: d.valeur as number,
      famille: d.id.startsWith("g_elec") ? "Consommation d'électricité" : "Émissions de gaz à effet de serre",
      page: d.page,
      source: d.source,
    }));
}

// ---------- Q3 ----------
export type EtatQ3 = "publie" | "presse" | "a_saisir" | "rien";
export function etatQ3(registre: Entree[], entreprise: string, type: string): EtatQ3 {
  const l = registre.filter((d) => d.entreprise === entreprise && d.type === type);
  return l.some((d) => d.statut === "primaire") ? "publie"
    : l.some((d) => d.statut === "presse") ? "presse"
    : l.some((d) => d.statut === "a_saisir") ? "a_saisir" : "rien";
}
export const TXT_Q3: Record<EtatQ3, string> = {
  publie: "✔ publié par l'entreprise",
  presse: "≈ relayé par la presse",
  a_saisir: "… existe, à saisir",
  rien: "✘ rien trouvé",
};
// Même logique que le notebook : objectif identifié (officiel ou presse) ET série d'au moins 2 années → « partiellement vérifiable ».
export function conditionsQ3(registre: Entree[], serie: LigneSerie[]) {
  const ok = (x: EtatQ3) => x === "publie" || x === "presse";
  return ["Google", "OpenAI", "Mistral"].map((entreprise) => {
    const objectif = etatQ3(registre, entreprise, "objectif");
    const objectifTrouve = ok(objectif);
    const annees =
      entreprise === "Google"
        ? [...new Set(serie.filter((d) => Number.isFinite(d.total)).map((d) => d.annee))].sort((a, b) => a - b)
        : [];
    const serieDisponible = annees.length >= 2;
    const partiel = objectifTrouve && serieDisponible;
    return {
      entreprise,
      objectif,
      objectifTexte:
        objectif === "publie" ? "Objectif annoncé dans une source officielle"
        : objectif === "presse" ? "Objectif mentionné dans la presse"
        : "Non identifié dans notre registre",
      serie: (serieDisponible ? "publie" : "rien") as EtatQ3,
      serieTexte: serieDisponible
        ? `Émissions totales déclarées : ${annees[0]}–${annees.at(-1)} (à contrôler)`
        : "Pas de série annuelle comparable exploitée",
      annees,
      resultat: partiel ? "Partiellement vérifiable" : "Non vérifiable avec notre corpus",
      limite: partiel
        ? "Série annuelle disponible, mais périmètre de l'objectif et méthode à vérifier."
        : !objectifTrouve
          ? "Aucun objectif chiffré et daté identifié dans le registre."
          : "Données annuelles insuffisantes pour suivre l'objectif.",
      mesurable: false, // aucune des trois ne permet une mesure complète avec notre corpus
    };
  });
}

// ---------- V5 (chronologie) ----------
export type EtatChrono = "suivi" | "ponctuel" | "manquant" | "objectif";
export function donneesChrono(registre: Entree[], serie: LigneSerie[]) {
  const annees = Array.from({ length: 7 }, (_, i) => 2019 + i); // 2019 à 2025 : dénominateur = 7
  const citable = (d: Entree) => d.statut === "primaire" || d.statut === "presse";
  const lignes: { entreprise: string; annee: number; etat: EtatChrono; n: number; detail: string }[] = [];
  for (const entreprise of ["Google", "OpenAI", "Mistral"]) {
    const l = registre.filter((d) => d.entreprise === entreprise && citable(d));
    for (const annee of annees) {
      const bilan = entreprise === "Google" ? serie.find((d) => d.annee === annee && Number.isFinite(d.total)) : undefined;
      const ponctuelles = l.filter((d) => Number(d.annee) === annee && d.type !== "objectif");
      if (bilan) {
        lignes.push({ entreprise, annee, etat: "suivi", n: 1, detail: `Émissions totales déclarées : ${bilan.total.toLocaleString("fr-FR")} tonnes de CO₂e. Source : rapport environnemental Google 2025.` });
      } else if (ponctuelles.length) {
        lignes.push({ entreprise, annee, etat: "ponctuel", n: ponctuelles.length, detail: ponctuelles.map((d) => d.libelle).join(" · ") });
      } else {
        lignes.push({ entreprise, annee, etat: "manquant", n: 0, detail: "Aucune donnée annuelle exploitable identifiée dans notre corpus pour cette année." });
      }
    }
    for (const o of l.filter((d) => d.type === "objectif" && Number(d.annee) > 2025)) {
      lignes.push({ entreprise, annee: Number(o.annee), etat: "objectif", n: 0, detail: o.libelle });
    }
  }
  return lignes;
}

export const COULEURS_V5 = {
  suivi: "#2B5FA8",
  ponctuel: "#9AA7AE",
  rien: "#F6D5CF",
  objectif: "#C4571A",
  objectifNon: "#E8E8E8",
};
export const STATUTS_V5 = [
  { cle: "Suivi annuel disponible", couleur: COULEURS_V5.suivi, lettre: "A" },
  { cle: "Information ponctuelle", couleur: COULEURS_V5.ponctuel, lettre: "P" },
  { cle: "Non identifié", couleur: COULEURS_V5.rien, lettre: "—" },
  { cle: "Objectif annoncé", couleur: COULEURS_V5.objectif, lettre: "O" },
  { cle: "Objectif non identifié", couleur: COULEURS_V5.objectifNon, lettre: "?" },
] as const;

export function casesV5(chrono: ReturnType<typeof donneesChrono>, entreprises: string[], debut = 2019, fin = 2025, objectifAnnee = 2030) {
  const annees = [...Array.from({ length: fin - debut + 1 }, (_, i) => String(debut + i)), "…", String(objectifAnnee)];
  const cases: { e: string; a: string; statut: string; lettre: string; couleur: string; n: number; detail: string }[] = [];
  for (const e of entreprises) {
    for (const a of annees) {
      if (a === "…") continue;
      const l = chrono.find((d) => d.entreprise === e && String(d.annee) === a);
      let st: (typeof STATUTS_V5)[number];
      let detail: string;
      if (a === String(objectifAnnee)) {
        st = l?.etat === "objectif" ? STATUTS_V5[3] : STATUTS_V5[4];
        detail = l?.etat === "objectif" ? l.detail : "Aucun objectif identifié dans notre registre pour cette échéance.";
      } else if (l?.etat === "suivi") { st = STATUTS_V5[0]; detail = l.detail; }
      else if (l?.etat === "ponctuel") { st = STATUTS_V5[1]; detail = l.detail; }
      else { st = STATUTS_V5[2]; detail = "Aucune donnée correspondante identifiée dans notre corpus."; }
      cases.push({ e, a, statut: st.cle, lettre: st.lettre, couleur: st.couleur, n: l?.n ?? 0, detail });
    }
  }
  return { annees, cases };
}
export const nbSuivi = (chrono: ReturnType<typeof donneesChrono>, e: string) =>
  chrono.filter((d) => d.entreprise === e && d.etat === "suivi" && d.annee >= 2019 && d.annee <= 2025).length;

// ---------- V4 (même logique que le script client, testée côté build) ----------
export type LigneSerie = { annee: number; total: number; operationnel: number; scope3: number; electricite: number | null };
export function variationsPeriode(serie: LigneSerie[], depart: number, arrivee: number) {
  const a = serie.find((d) => d.annee === depart);
  const b = serie.find((d) => d.annee === arrivee);
  if (!a || !b || arrivee <= depart) return [];
  return INDICATEURS.filter((i) => a[i.cle] != null && b[i.cle] != null).map((i) => ({
    mesure: i.court,
    couleur: i.couleur,
    pourcent: 100 * ((b[i.cle] as number) / (a[i.cle] as number) - 1),
  }));
}
