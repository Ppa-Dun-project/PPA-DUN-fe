import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import FadeIn from "../components/ui/FadeIn";
import Skeleton from "../components/ui/Skeleton";
import type { NewsItem } from "../types/home";
import { apiGet } from "../lib/api";
import { timeAgo } from "../features/home/utils";

type NewsListResponse = {
  items: NewsItem[];
  total: number;
};

export default function NewsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    apiGet<NewsListResponse>("/api/news", { limit: 20 }, controller.signal)
      .then((data) => setNews(data.items))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setNews([]);
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

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
            {loading && (
              <>
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                Failed to load news: {error}
              </div>
            )}

            {!loading && !error && news.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                No news yet.
              </div>
            )}

            {!loading &&
              !error &&
              news.map((item) => (
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
