import type { MyTeamPlayer, MyTeamPosFilter, MyTeamSort } from "../../types/myteam";

// MLB 팀 코드별 배지 색상 매핑 (팀 시그니처 컬러 반영)
const TEAM_BADGE_CLASSES: Record<string, string> = {
  NYY: "bg-sky-500/15 text-sky-200 border-sky-400/25",
  LAD: "bg-blue-500/15 text-blue-200 border-blue-400/25",
  NYM: "bg-indigo-500/15 text-indigo-200 border-indigo-400/25",
  ATL: "bg-red-500/15 text-red-200 border-red-400/25",
  PHI: "bg-rose-500/15 text-rose-200 border-rose-400/25",
  HOU: "bg-orange-500/15 text-orange-200 border-orange-400/25",
  LAA: "bg-amber-500/15 text-amber-200 border-amber-400/25",
  CLE: "bg-violet-500/15 text-violet-200 border-violet-400/25",
  KC: "bg-cyan-500/15 text-cyan-200 border-cyan-400/25",
  SD: "bg-yellow-500/15 text-yellow-200 border-yellow-400/25",
  TEX: "bg-emerald-500/15 text-emerald-200 border-emerald-400/25",
  BAL: "bg-orange-500/15 text-orange-200 border-orange-400/25",
  CIN: "bg-red-500/15 text-red-200 border-red-400/25",
  SEA: "bg-teal-500/15 text-teal-200 border-teal-400/25",
};

/**
 * 선수 목록 필터링
 * - 이름/팀명 검색 (대소문자 무시)
 * - 포지션 필터 (ALL이면 전체)
 * - BENCH(1B) 같은 포맷도 포지션 문자열에 포함되면 매칭
 */
export function filterMyTeam(
  players: MyTeamPlayer[],
  query: string,
  pos: MyTeamPosFilter
): MyTeamPlayer[] {
  const q = query.trim().toLowerCase();

  return players.filter((player) => {
    const matchesQuery =
      !q || player.name.toLowerCase().includes(q) || player.team.toLowerCase().includes(q);
    const matchesPos = pos === "ALL" ? true : player.pos.includes(pos);
    return matchesQuery && matchesPos;
  });
}

/** 선수 목록 정렬 (정렬 옵션별 비교 함수 적용) */
export function sortMyTeam(players: MyTeamPlayer[], sort: MyTeamSort): MyTeamPlayer[] {
  // 원본 배열을 변경하지 않도록 복사본 사용
  const copy = [...players];

  switch (sort) {
    case "score_desc":
      return copy.sort((a, b) => b.ppaValue - a.ppaValue);
    case "score_asc":
      return copy.sort((a, b) => a.ppaValue - b.ppaValue);
    case "cost_desc":
      return copy.sort((a, b) => b.cost - a.cost);
    case "cost_asc":
      return copy.sort((a, b) => a.cost - b.cost);
    case "avg_desc":
      return copy.sort((a, b) => b.avg - a.avg);
    case "hr_desc":
      return copy.sort((a, b) => b.hr - a.hr);
    case "rbi_desc":
      return copy.sort((a, b) => b.rbi - a.rbi);
    case "sb_desc":
      return copy.sort((a, b) => b.sb - a.sb);
    default:
      return copy;
  }
}

/** 타율을 .300 같은 야구식 표기로 포맷 (0이면 "-") */
export function formatAvg(avg: number) {
  if (!avg) return "-";
  return avg.toFixed(3).replace("0.", ".");
}

/** MLB 팀 코드 → 배지 CSS 클래스. 매핑에 없으면 기본 회색 */
export function teamBadgeClass(team: string): string {
  return TEAM_BADGE_CLASSES[team.toUpperCase()] ?? "bg-white/10 text-white/80 border-white/15";
}

/** PPA-DUN 점수에 따른 강조 스타일 (10점 이상이면 발광 효과) */
export function valueScoreClass(value: number): string {
  if (value >= 10) {
    return "text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.55)]";
  }
  return "text-emerald-400";
}
