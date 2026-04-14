// Full news listing page — reached via "View all →" on the HomePage.
// News data is hardcoded; each card is a direct external link (opens in new tab).
import { Link } from "react-router-dom";

import FadeIn from "../components/ui/FadeIn";
import type { NewsItem } from "../types/home";
import { timeAgo } from "../features/home/utils";

// Hardcoded news data — same as HomePage.
const STATIC_NEWS: NewsItem[] = [
  {
    id: "n1",
    title: "6 MVP Awards, 4 HRs: Trout, Judge do battle in epic dinger duel",
    summary: "Mike Trout and Aaron Judge each hit two homers as the Yankees edged the Angels in a memorable slugfest between two generational talents.",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    url: "https://www.mlb.com/news/mike-trout-aaron-judge-each-hit-two-homers-in-yankees-win-over-angels",
    source: "MLB.com",
  },
  {
    id: "n2",
    title: "Top 100 MLB Players for the 2026 Season",
    summary: "A comprehensive ranking of the best 100 players heading into the 2026 MLB season, from rising stars to established superstars.",
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    url: "https://www.justbaseball.com/mlb/top-100-mlb-players-ranking-2026/",
    source: "Just Baseball",
  },
  {
    id: "n3",
    title: "MLB's average player salary rises to $5.34M",
    summary: "MLB's average player salary rises to $5.34M, plus which team is barely spending more than a top player makes.",
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    url: "https://www.cbssports.com/mlb/news/mlb-average-player-salary-juan-soto-cody-bellinger-mets-guardians/",
    source: "CBS Sports",
  },
];

export default function NewsPage() {
  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">All News</h1>
            <p className="mt-1 text-sm text-white/60">
              Latest MLB and fantasy baseball news
            </p>
          </div>
          <Link
            to="/"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </FadeIn>

      <FadeIn delayMs={60}>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="grid grid-cols-1 gap-4">
            {STATIC_NEWS.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="group block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/8 hover:-translate-y-[2px] active:translate-y-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-white/60">
                    {item.source ?? "News"} • {timeAgo(item.publishedAt)}
                  </div>
                  <div className="text-xs text-white/40 group-hover:text-white/60 transition">
                    Open →
                  </div>
                </div>
                <h3 className="mt-2 text-base font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  {item.summary}
                </p>
                <div className="mt-3 text-xs text-white/40">
                  {new Date(item.publishedAt).toLocaleString()}
                </div>
              </a>
            ))}
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
