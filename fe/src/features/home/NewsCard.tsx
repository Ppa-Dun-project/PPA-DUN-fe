// NewsItem 타입 가져오기 (뉴스 데이터 형태 정의)
import type { NewsItem } from "../../types/home";
// timeAgo: ISO 시간을 "3h ago" 형태로 변환하는 유틸
import { timeAgo } from "./utils";

// Props 타입 — 컴포넌트가 받는 props의 형태
type Props = {
  item: NewsItem;  // 뉴스 데이터 객체
};

/**
 * NewsCard: 단일 뉴스 카드
 * - 클릭하면 외부 뉴스 사이트를 새 탭에서 엶
 * - HomePage와 NewsPage 양쪽에서 사용
 */
export default function NewsCard({ item }: Props) {
  return (
    // a 태그: 외부 링크
    // target="_blank": 새 탭에서 열기
    // rel="noreferrer": 보안상 referrer 정보 안 보냄 (외부 사이트에 출처 노출 방지)
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group block w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/8 hover:-translate-y-[2px] active:translate-y-0"
    >
      <div className="flex items-center justify-between gap-3">
        {/* 출처 + 경과 시간 */}
        <div className="text-xs text-white/60">
          {/* ?? 연산자: source가 null/undefined면 "News" 사용 */}
          {item.source ?? "News"} • {timeAgo(item.publishedAt)}
        </div>
        {/* "Open →" 표시 (group-hover로 부모 호버 시 색 변경) */}
        <div className="text-xs text-white/40 group-hover:text-white/60 transition">
          Open →
        </div>
      </div>

      {/* 뉴스 제목 */}
      <h3 className="mt-2 text-base font-semibold text-white">{item.title}</h3>
      {/* 뉴스 요약 (line-clamp-2: 최대 2줄까지만 표시, 넘치면 ...) */}
      <p className="mt-2 line-clamp-2 text-sm text-white/70">{item.summary}</p>
    </a>
  );
}
