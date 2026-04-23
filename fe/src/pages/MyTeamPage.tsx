// 내 팀 페이지 (로그인 필수)
// - 백엔드에서 드래프트한 선수 목록 + 예산 정보를 받아옴
// - 필터/정렬/검색은 전부 프론트에서 처리 (백엔드는 원시 데이터만 제공)
import { useEffect, useMemo, useState } from "react";
import FadeIn from "../components/ui/FadeIn";
import Skeleton from "../components/ui/Skeleton";
import Dropdown from "../components/ui/Dropdown";

import type { MyTeamPlayer, MyTeamPosFilter, MyTeamSort } from "../types/myteam";
import {
  filterMyTeam,
  formatAvg,
  sortMyTeam,
} from "../features/myteam/utils";
import { mlbTeamBadgeClass } from "../features/draft/utils";
import { formatPpa, ppaValueClass } from "../utils/playerValue";
import { apiGet } from "../lib/api";
import PlayerInfoModal from "../features/players/components/PlayerInfoModal";
import { DRAFT_ROOM_ID } from "../lib/runtimeConfig";

// 백엔드 GET /api/my-team/players 응답 타입
type MyTeamPlayersResponse = {
  items: MyTeamPlayer[];
  totalBudget: number;
  spentBudget: number;
  remainingBudget: number;
};

// 예산 정보를 하나의 객체로 묶음 (useState 3번 → 1번)
type Budget = { total: number; spent: number; remaining: number };

const INITIAL_BUDGET: Budget = { total: 260, spent: 0, remaining: 260 };

// 포지션 필터 옵션 (고정)
const POSITION_FILTERS: MyTeamPosFilter[] = [
  "ALL", "C", "1B", "2B", "3B", "SS", "OF", "UTIL",
  "LF", "RF", "CF", "DH", "SP", "RP",
];

// 정렬 옵션 (고정)
const SORT_OPTIONS: { value: MyTeamSort; label: string }[] = [
  { value: "score_desc", label: "By Score" },
  { value: "cost_desc", label: "By Value $" },
  { value: "avg_desc", label: "By AVG" },
  { value: "hr_desc", label: "By HR" },
  { value: "rbi_desc", label: "By RBI" },
  { value: "sb_desc", label: "By SB" },
];

// 테이블 컬럼 그리드 정의 (헤더와 각 행에서 공유)
const TABLE_GRID_COLS =
  "grid-cols-[1.8fr_.6fr_.6fr_.7fr_.7fr_.7fr_.7fr_.7fr_.9fr]";

export default function MyTeamPage() {
  // 로딩/에러 상태 (초기값 loading=true: 마운트 직후 API 호출 중)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 백엔드에서 받아온 선수 목록 + 예산 정보
  const [players, setPlayers] = useState<MyTeamPlayer[]>([]);
  const [budget, setBudget] = useState<Budget>(INITIAL_BUDGET);

  // 검색어 / 포지션 필터 / 정렬 상태
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<MyTeamPosFilter>("ALL");
  const [sort, setSort] = useState<MyTeamSort>("score_desc");

  // 선수 정보 모달 상태 (선택된 선수 ID)
  const [profilePlayerId, setProfilePlayerId] = useState<number | null>(null);

  // 마운트 시 한 번만 백엔드에서 내 팀 데이터 로드
  useEffect(() => {
    const controller = new AbortController();

    apiGet<MyTeamPlayersResponse>(
      "/api/my-team/players",
      { userId: DRAFT_ROOM_ID },  // 백엔드 가이드: roomId → userId로 통일
      controller.signal
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        setPlayers(data.items);
        setBudget({
          total: data.totalBudget,
          spent: data.spentBudget,
          remaining: data.remainingBudget,
        });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
        setPlayers([]);
        setError(err instanceof Error ? err.message : "Failed to load my team");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  // 클라이언트 측 필터링 + 정렬 (백엔드 재호출 없이 메모리에서 계산)
  const visiblePlayers = useMemo(
    () => sortMyTeam(filterMyTeam(players, query, pos), sort),
    [players, query, pos, sort]
  );

  return (
    <div className="space-y-6">
      {/* 상단: 제목 + 예산 카드 */}
      <FadeIn>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-black text-white/70">PPA-DUN</div>
            <h1 className="mt-1 text-3xl font-black text-white">My Team</h1>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
            <div className="text-sm font-extrabold text-white/70">Budget</div>
            <div className="text-xl font-black text-emerald-400">${budget.remaining}</div>
            <div className="text-xs font-semibold text-white/50">
              (${budget.spent} / ${budget.total} spent)
            </div>
          </div>
        </div>
      </FadeIn>

      {/* 본문: 검색/정렬/포지션 필터 + 선수 목록 테이블 */}
      <FadeIn delayMs={60} className="relative z-40">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          {/* 검색창 + 정렬 드롭다운 */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full lg:max-w-md">
              <div className="text-xs font-extrabold text-white/70">Search</div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search player or team..."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/40 focus:border-white/25"
              />
            </div>

            <div className="w-full lg:w-72">
              <Dropdown<MyTeamSort>
                label="Sort"
                value={sort}
                options={SORT_OPTIONS}
                onChange={setSort}
              />
            </div>
          </div>

          {/* 포지션 필터 칩 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {POSITION_FILTERS.map((position) => (
              <button
                key={position}
                onClick={() => setPos(position)}
                className={`rounded-full px-3 py-1 text-xs font-extrabold transition ${
                  pos === position
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                {position}
              </button>
            ))}
          </div>

          {/* 선수 목록 테이블 */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            {/* 테이블 헤더 */}
            <div className={`grid ${TABLE_GRID_COLS} bg-black/40 px-4 py-3 text-xs font-extrabold text-white/60`}>
              <div>Player</div>
              <div>Pos</div>
              <div>$</div>
              <div>Team</div>
              <div>AVG</div>
              <div>HR</div>
              <div>RBI</div>
              <div>SB</div>
              <div className="text-right">PPA-DUN Value</div>
            </div>

            {/* 테이블 본문: 로딩/에러/빈 상태/정상 4가지 분기 */}
            <div className="bg-black/20">
              {loading && (
                <div className="p-4">
                  <Skeleton className="h-24" />
                </div>
              )}

              {!loading && error && (
                <div className="p-4 text-sm text-red-200">Failed to load my team: {error}</div>
              )}

              {!loading && !error && visiblePlayers.length === 0 && (
                <div className="p-4 text-sm text-white/70">No players found.</div>
              )}

              {!loading && !error && visiblePlayers.map((player) => (
                <div
                  key={player.id}
                  className={`grid w-full ${TABLE_GRID_COLS} items-center px-4 py-3 text-left text-sm text-white/85 transition hover:bg-white/5`}
                >
                  {/* 선수 이름 (클릭 시 모달) */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setProfilePlayerId(Number(player.id))}
                      className="rounded-md border border-transparent px-2 py-1 -mx-2 -my-1 font-semibold text-white transition hover:border-white/35 hover:bg-white/5 hover:text-amber-200 focus-visible:border-white/45 focus-visible:bg-white/10 focus-visible:outline-none"
                    >
                      {player.name}
                    </button>
                  </div>

                  {/* 포지션 배지 */}
                  <div>
                    <span className="rounded-lg bg-white/10 px-2 py-1 text-xs font-extrabold text-white/80">
                      {player.pos}
                    </span>
                  </div>

                  {/* 드래프트 비용 */}
                  <div className="font-semibold text-white/80">{player.cost}</div>

                  {/* MLB 팀 배지 (팀별 색상) */}
                  <div>
                    <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs font-extrabold ${mlbTeamBadgeClass(player.team)}`}>
                      {player.team}
                    </span>
                  </div>

                  {/* 스탯 */}
                  <div className="text-white/70">{formatAvg(player.avg)}</div>
                  <div className="font-semibold text-amber-300">{player.hr ?? "-"}</div>
                  <div className="text-white/70">{player.rbi ?? "-"}</div>
                  <div className="font-semibold text-amber-300">{player.sb ?? "-"}</div>

                  {/* PPA-DUN 가치 점수 (10점 이상이면 발광 효과) */}
                  <div className={`text-right text-sm font-black ${ppaValueClass(player.ppaValue)}`}>
                    {formatPpa(player.ppaValue)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* 선수 정보 모달 */}
      <PlayerInfoModal
        open={profilePlayerId !== null}
        playerId={profilePlayerId}
        onClose={() => setProfilePlayerId(null)}
      />
    </div>
  );
}
