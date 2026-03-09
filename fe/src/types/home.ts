export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  url?: string;
  source?: string;
};

export type TopPlayer = {
  id: string;
  name: string;
  team: string;
  positions: string[];
  valueScore: number;
};
