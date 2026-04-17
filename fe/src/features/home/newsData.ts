import type { NewsItem } from "../../types/home";

/**
 * hoursAgo: N시간 전의 ISO 타임스탬프를 만드는 헬퍼
 * - Date.now(): 현재 밀리초 타임스탬프
 * - h * 60 * 60 * 1000: N시간을 밀리초로 변환
 * - .toISOString(): ISO 8601 형식 문자열 (예: "2026-04-17T10:00:00.000Z")
 */
const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

/**
 * STATIC_NEWS: 하드코딩된 뉴스 데이터
 * - 백엔드 없이 프론트에서 직접 표시하기 위한 정적 데이터
 * - HomePage (3개 표시)와 NewsPage (전체 표시)에서 공통 사용
 */
export const STATIC_NEWS: NewsItem[] = [
  {
    id: "n1",
    title: "6 MVP Awards, 4 HRs: Trout, Judge do battle in epic dinger duel",
    summary:
      "Mike Trout and Aaron Judge each hit two homers as the Yankees edged the Angels in a memorable slugfest between two generational talents.",
    publishedAt: hoursAgo(2),   // 2시간 전
    url: "https://www.mlb.com/news/mike-trout-aaron-judge-each-hit-two-homers-in-yankees-win-over-angels",
    source: "MLB.com",
  },
  {
    id: "n2",
    title: "Top 100 MLB Players for the 2026 Season",
    summary:
      "A comprehensive ranking of the best 100 players heading into the 2026 MLB season, from rising stars to established superstars.",
    publishedAt: hoursAgo(8),   // 8시간 전
    url: "https://www.justbaseball.com/mlb/top-100-mlb-players-ranking-2026/",
    source: "Just Baseball",
  },
  {
    id: "n3",
    title: "MLB's average player salary rises to $5.34M",
    summary:
      "MLB's average player salary rises to $5.34M, plus which team is barely spending more than a top player makes.",
    publishedAt: hoursAgo(18),  // 18시간 전
    url: "https://www.cbssports.com/mlb/news/mlb-average-player-salary-juan-soto-cody-bellinger-mets-guardians/",
    source: "CBS Sports",
  },
];
