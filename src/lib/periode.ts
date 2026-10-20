// Options Plot du graphique « variations entre deux années » : fonction réutilisable (TP5).
// Elle n'utilise QUE les données reçues en paramètre. Utilisée par V4 (route B, navigateur)
// et par le test de réutilisation de la page Méthode (route A, build).
import * as Plot from "@observablehq/plot";

export type LignePeriode = { mesure: string; couleur: string; pourcent: number };

export const fmtPct = (x: number) =>
  `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} %`;

export function optionsPeriode(
  donnees: LignePeriode[],
  { largeur = 760, titre = "", sousTitre = "" }: { largeur?: number; titre?: string; sousTitre?: string } = {},
) {
  const etendue = Math.max(10, Math.ceil(Math.max(...donnees.map((d) => Math.abs(d.pourcent))) / 10) * 10);
  return {
    title: titre,
    subtitle: sousTitre,
    width: largeur,
    height: 80 + donnees.length * 52,
    marginLeft: 170,
    marginRight: 60,
    x: { label: "Variation (%)", grid: true, domain: [-etendue, etendue] },
    y: { label: null, domain: donnees.map((d) => d.mesure) },
    marks: [
      Plot.ruleX([0]),
      Plot.barX(donnees, {
        x: "pourcent",
        y: "mesure",
        fill: "couleur",
        inset: 6,
        title: (d: LignePeriode) => `${d.mesure}\n${d.pourcent.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`,
      }),
      // second repère que la couleur : la valeur écrite
      Plot.text(donnees, {
        x: "pourcent",
        y: "mesure",
        text: (d: LignePeriode) => fmtPct(d.pourcent),
        textAnchor: (d: LignePeriode) => (d.pourcent >= 0 ? "start" : "end"),
        dx: (d: LignePeriode) => (d.pourcent >= 0 ? 6 : -6),
        fontWeight: 600,
      }),
    ],
  };
}
