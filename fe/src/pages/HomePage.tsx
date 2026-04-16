// Landing page: hero banner with search, Latest News cards, and a right panel
// that shows either SignInCard (guest) or DraftSetupCard (authenticated).
// News data is hardcoded; clicking a card opens the external URL in a new tab.
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import FadeIn from "../components/ui/FadeIn";

import type { NewsItem } from "../types/home";
import NewsCard from "../features/home/NewsCard";

import DraftSetupCard from "../features/home/DraftSetupCard";
import SignInCard from "../features/home/SignInCard";

import baseballImg from "../assets/Baseball.jpg";
import { useAuth } from "../lib/auth";

// Hardcoded news data — no backend call needed.
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

export default function HomePage() {
  const navigate = useNavigate();
  const authed = useAuth(); // Reactive: re-renders on login/logout

  const [query, setQuery] = useState(""); // Hero search input

  // Navigate to Draft page with search query pre-filled.
  const onSearch = () => {
    const q = query.trim();
    if (!q) return;
    navigate(`/draft?query=${encodeURIComponent(q)}`);
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black p-6 md:p-10">
          <div className="absolute inset-0">
            <img
              src={baseballImg}
              alt="Baseball background"
              className="h-full w-full object-cover object-right origin-right scale-80 brightness-145 saturate-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
            <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.75)]" />
          </div>

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/70">
                PPA-Dun Project • TEAM BLACK
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Build your roster with the Best Players.
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">
                Check the latest news, scout top players for your Fantasy.
              </p>
            </div>

            {/* Search */}
            <div className="w-full max-w-xl">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/60 p-2 backdrop-blur">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSearch();
                  }}
                  placeholder="Search players (e.g., Judge, Ohtani)..."
                  className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
                />
                <button
                  onClick={onSearch}
                  className="rounded-xl bg-black/80 px-4 py-2 text-sm font-extrabold text-white
                             ring-1 ring-white/25
                             transition hover:translate-y-[-1px] hover:bg-black/70 hover:ring-white/40
                             active:translate-y-0"
                >
                  Search
                </button>
              </div>
              <div className="mt-2 text-xs text-white/60">Tip: Press Enter to search.</div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Grid: News + Right panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Latest News */}
        <FadeIn className="lg:col-span-2" delayMs={60}>
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Latest News</h2>
                <p className="mt-1 text-sm text-white/60">
                  Guest users can read news anytime.
                </p>
              </div>

              <button
                className="text-xs font-bold text-white/60 hover:text-white transition"
                onClick={() => navigate("/news")}
              >
                View all →
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4">
              {STATIC_NEWS.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        </FadeIn>

        {/* Right panel: guest => SignInCard, authed => DraftSetupCard */}
        <FadeIn className="lg:col-span-1" delayMs={120}>
          {authed ? <DraftSetupCard /> : <SignInCard />}
        </FadeIn>
      </div>

    </div>
  );
}
