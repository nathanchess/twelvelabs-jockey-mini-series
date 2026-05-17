export type CompetitorModel = {
  id: string;
  label: string;
  shortLabel: string;
  endpoint: string;
};

export const jockeyModel = {
  id: "jockey1.0",
  label: "Jockey",
  endpoint: "/api/jockey_prompt",
} as const;

export const competitorModels: CompetitorModel[] = [
  {
    id: "gemini-2.5-flash",
    label: "Google Gemini 2.5 Flash",
    shortLabel: "Gemini",
    endpoint: "/api/gemini_prompt",
  },
];

export const defaultCompetitorId = competitorModels[0].id;
