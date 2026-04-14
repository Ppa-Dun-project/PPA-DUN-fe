// News card component: renders a single news item as a clickable external link.
// Opens the article URL in a new tab. Used on both HomePage and NewsPage.
import type { NewsItem } from "../../types/home";
import { timeAgo } from "./utils";

type Props = {
  item: NewsItem;
};

export default function NewsCard({ item }: Props) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group block w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/8 hover:-translate-y-[2px] active:translate-y-0"
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
      <p className="mt-2 line-clamp-2 text-sm text-white/70">
        {item.summary}
      </p>
    </a>
  );
}
