// TypeScript type definitions for the Home page features.

// A news article with external link — displayed on HomePage and NewsPage.
export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  url?: string;
  source?: string;
};

// Top-ranked player summary for home page widgets.
export type TopPlayer = {
  id: string;
  name: string;
  team: string;
  positions: string[];
  valueScore: number;
};
