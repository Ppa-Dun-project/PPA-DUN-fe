// Link: 페이지 이동 링크 (a 태그의 React Router 버전, 새로고침 없이 이동)
import { Link } from "react-router-dom";

import FadeIn from "../components/ui/FadeIn";
import NewsCard from "../features/home/NewsCard";
// 하드코딩된 뉴스 데이터 (HomePage와 공용)
import { STATIC_NEWS } from "../features/home/newsData";

/**
 * NewsPage: 뉴스 전체 목록 페이지
 * - HomePage의 "View all →" 버튼으로 진입
 * - NewsCard를 재사용해서 일관된 UI 유지
 */
export default function NewsPage() {
  return (
    <div className="space-y-6">
      {/* 상단 헤더 */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">All News</h1>
            <p className="mt-1 text-sm text-white/60">
              Latest MLB and fantasy baseball news
            </p>
          </div>
          {/* 홈으로 돌아가기 링크 */}
          <Link
            to="/"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </FadeIn>

      {/* 뉴스 목록 */}
      <FadeIn delayMs={60}>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="grid grid-cols-1 gap-4">
            {/* 배열을 반복 렌더링 */}
            {STATIC_NEWS.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
