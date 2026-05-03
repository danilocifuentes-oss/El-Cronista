/** Ámbitos políticos jugables para tono narrativo / coherencia. */
export type SectAffinity = "camarilla" | "sabbat" | "anarch" | "independent";

export type ClanKnowledgeProfile = {
  name: string;
  sect: readonly SectAffinity[];
  identity: readonly string[];
  curse: string;
  hooks: readonly string[];
  /** Claves Sereno donde aplica (`blood_sorcery`, …) + algunas sólo lore (vicissitude, oblivion …). */
  disciplines: readonly string[];
};

export type DisciplineKnowledge = {
  type: string;
  narrative: readonly string[];
  use: string;
};

export type SectKnowledge = {
  ideology: string;
  style: string;
};

export type PathKnowledge = {
  name: string;
  theme: string;
};

export type NarrativeEntityKind =
  | "kindred_established"
  | "kindred_young"
  | "thin_blood"
  | "ghoul"
  | "herd_contact"
  | "mortal";

export type NarrativeEntityBrief = {
  role: string;
  defaultHooks: readonly string[];
};
