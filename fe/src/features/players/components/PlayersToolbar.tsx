import { positionsForFilter, type PlayerSort, type PositionFilter } from "../../../types/player";

type Props = {
  query: string;
  position: PositionFilter;
  sort: PlayerSort;
  onChangeQuery: (v: string) => void;
  onSubmitSearch: () => void;
  onChangePosition: (p: PositionFilter) => void;
  onChangeSort: (s: PlayerSort) => void;
  onReset: () => void;
};

export default function PlayersToolbar({
  query,
  position,
  sort,
  onChangeQuery,
  onSubmitSearch,
  onChangePosition,
  onChangeSort,
  onReset,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* Search */}
        <div className="w-full lg:max-w-xl">
          <div className="text-xs font-black text-white/70">Search</div>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/60 p-2 backdrop-blur">
            <input
              value={query}
              onChange={(e) => onChangeQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmitSearch();
              }}
              placeholder="Search by name or team…"
              className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
            />
            <button
              onClick={onSubmitSearch}
              className="rounded-xl bg-black/80 px-4 py-2 text-sm font-black text-white
                         ring-1 ring-white/25 transition
                         hover:translate-y-[-1px] hover:bg-black/70 hover:ring-white/40
                         active:translate-y-0"
            >
              Search
            </button>
          </div>
        </div>

        {/* Sort */}
        <div className="w-full lg:w-64">
          <div className="text-xs font-black text-white/70">Sort</div>
          <select
            value={sort}
            onChange={(e) => onChangeSort(e.target.value as PlayerSort)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="value_desc">ValueScore (high → low)</option>
            <option value="value_asc">ValueScore (low → high)</option>
            <option value="name_asc">Name (A → Z)</option>
            <option value="name_desc">Name (Z → A)</option>
          </select>
        </div>

        {/* Reset */}
        <div className="lg:pb-[2px]">
          <button
            onClick={onReset}
            className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm font-black text-white/90 transition hover:bg-white/5 lg:w-auto"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Position filter chips */}
      <div className="mt-4">
        <div className="text-xs font-black text-white/70">Position</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {positionsForFilter.map((p) => {
            const active = position === p;
            return (
              <button
                key={p}
                onClick={() => onChangePosition(p)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-black transition",
                  active
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                ].join(" ")}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
