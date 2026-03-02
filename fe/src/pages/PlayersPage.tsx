import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import FadeIn from "../components/ui/FadeIn";
import Skeleton from "../components/ui/Skeleton";

import type { PlayerSort } from "../types/player";
import { mockPlayers } from "../features/players/mock";
import type { PositionFilter } from "../features/players/mock";
import { filterPlayers, paginate, sortPlayers } from "../features/players/utils";

import PlayersToolbar from "../features/players/components/PlayersToolbar";
import PlayerCard from "../features/players/components/PlayerCard";
import Pagination from "../features/players/components/Pagination";
import TopPlayersPanel from "../features/players/components/TopPlayersPanel";
import DraftSummaryBadge from "../features/players/components/DraftSummaryBadge";

function getParam(params: URLSearchParams, key: string, fallback: string) {
  return params.get(key) ?? fallback;
}

export default function PlayersPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // URL state
  const query = getParam(params, "query", "");
  const position = getParam(params, "position", "ALL") as PositionFilter;
  const sort = getParam(params, "sort", "value_desc") as PlayerSort;
  const page = Number(getParam(params, "page", "1")) || 1;
  const pageSize = 8;

  // local UI state (optional): for instant typing before submit
  const [draftQuery, setDraftQuery] = useState(query);

  const onSubmitSearch = () => {
    const next = new URLSearchParams(params);
    next.set("query", draftQuery.trim());
    next.set("page", "1");
    setParams(next, { replace: true });
  };

  const onChangePosition = (p: PositionFilter) => {
    const next = new URLSearchParams(params);
    next.set("position", p);
    next.set("page", "1");
    setParams(next, { replace: true });
  };

  const onChangeSort = (s: PlayerSort) => {
    const next = new URLSearchParams(params);
    next.set("sort", s);
    next.set("page", "1");
    setParams(next, { replace: true });
  };

  const onChangePage = (nextPage: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    setParams(next, { replace: true });
  };

  const onReset = () => {
    setDraftQuery("");
    setParams(new URLSearchParams(), { replace: true });
  };

  // MVP: mock loading simulation switch (필요하면 true로)
  const loading = false;
  const error: string | null = null;

  const filtered = useMemo(() => {
    const f = filterPlayers(mockPlayers, query, position);
    return sortPlayers(f, sort);
  }, [query, position, sort]);

  const { items, total, totalPages, page: safePage } = useMemo(() => {
    return paginate(filtered, page, pageSize);
  }, [filtered, page]);

  const topPlayers = useMemo(() => {
    // top players always by value desc
    return sortPlayers(mockPlayers, "value_desc");
  }, []);

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">Players</h1>
            <p className="mt-2 text-sm text-white/60">
              Search, filter, and sort players. ValueScore is always visible.
            </p>
          </div>

          {/* draft badge on top right */}
          <div className="lg:w-[360px]">
            <DraftSummaryBadge />
          </div>
        </div>
      </FadeIn>

      <FadeIn delayMs={60}>
        <PlayersToolbar
          query={draftQuery}
          position={position}
          sort={sort}
          onChangeQuery={setDraftQuery}
          onSubmitSearch={onSubmitSearch}
          onChangePosition={onChangePosition}
          onChangeSort={onChangeSort}
          onReset={onReset}
        />
      </FadeIn>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* List */}
        <FadeIn className="lg:col-span-2" delayMs={120}>
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs font-black text-white/60">
                  Results: <span className="text-white">{total}</span>
                </div>
                <div className="mt-1 text-sm text-white/60">
                  Click a player to view details.
                </div>
              </div>
              <div className="text-xs text-white/50">
                Showing {items.length} / {total}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4">
              {loading && (
                <>
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </>
              )}

              {!loading && error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  Failed to load players: {error}
                </div>
              )}

              {!loading && !error && items.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                  No results. Try another search or reset filters.
                </div>
              )}

              {!loading &&
                !error &&
                items.map((p) => (
                  <PlayerCard key={p.id} player={p} onClick={() => navigate(`/players/${p.id}`)} />
                ))}
            </div>

            {!loading && !error && totalPages > 1 && (
              <Pagination page={safePage} totalPages={totalPages} onChange={onChangePage} />
            )}
          </section>
        </FadeIn>

        {/* Side panel: Top Players */}
        <FadeIn className="lg:col-span-1" delayMs={180}>
          <TopPlayersPanel players={topPlayers} />
        </FadeIn>
      </div>
    </div>
  );
}