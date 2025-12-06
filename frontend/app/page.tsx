'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

interface Article {
  id: number;
  title: string;
  authorNickname: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
}

interface User {
  id: number;
  email: string;
  nickname: string;
}

export default function Home() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const fetchArticles = async (cursor?: number | null) => {
    setLoading(true);
    try {
      const url = cursor
        ? apiUrl(`/api/articles?lastId=${cursor}&size=20`)
        : apiUrl('/api/articles?size=20');

      const response = await fetch(url);
      const data = await response.json();

      if (cursor) {
        setArticles((prev) => [...prev, ...data.articles]);
      } else {
        setArticles(data.articles);
      }

      setHasNext(data.hasNext);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const loadMore = () => {
    if (hasNext && nextCursor) {
      fetchArticles(nextCursor);
    }
  };

  const userInitial = user?.nickname?.charAt(0)?.toUpperCase() ?? 'G';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen pb-24 text-toss-text">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="pill bg-white/80 border border-white/70 shadow-sm">Now</span>
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-[0.16em] text-toss-gray">Waveboard</p>
              <h1 className="text-lg font-semibold text-toss-text">읽고, 쓰고, 연결하기</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 bg-white/70 border border-black/5 px-3 py-2 rounded-full shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-toss-blue text-white flex items-center justify-center font-bold">
                    {userInitial}
                  </div>
                  <div className="leading-tight">
                    <p className="text-[11px] text-toss-gray">Signed in</p>
                    <p className="text-sm font-semibold">{user.nickname}</p>
                  </div>
                </div>
                <Link
                  href="/articles/new"
                  className="text-sm toss-button px-4 py-2 rounded-full shadow-md hover:shadow-lg transition"
                >
                  글쓰기
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-toss-gray hover:text-toss-text transition-colors ml-1"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm font-semibold text-toss-text px-3 py-2 rounded-full hover:bg-white transition-colors border border-transparent hover:border-black/5"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm toss-button px-4 py-2 rounded-full shadow-md hover:shadow-lg transition"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 pt-8 space-y-8">
        <section className="toss-card">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="space-y-3">
              <span className="pill">오늘의 흐름</span>
              <div>
                <h2 className="text-3xl font-semibold leading-tight">
                  안녕하세요, {user ? `${user.nickname}님` : '방문자님'}
                </h2>
                <p className="text-sm text-toss-gray mt-2">
                  글과 의견이 자연스럽게 흐르는, 작지만 날카로운 커뮤니티.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-toss-blue/10 text-toss-blue font-semibold text-sm border border-toss-blue/20">
                  🔥 실시간 피드 {articles.length > 0 ? `(${articles.length}건 표시 중)` : ''}
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm border border-amber-200">
                  💡 더 깊게, 더 짧게
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-[220px]">
              <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.14em] text-toss-gray">현재 글</p>
                <p className="text-2xl font-bold">{articles.length}</p>
                <p className="text-xs text-toss-gray mt-1">지금 화면에 표시 중</p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-gradient-to-br from-toss-blue/10 to-amber-100 px-4 py-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.14em] text-toss-gray">새로 올라온 글</p>
                <p className="text-2xl font-bold">{articles[0] ? `#${articles[0].id}` : '-'}</p>
                <p className="text-xs text-toss-gray mt-1">방금 전 스냅샷</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {user ? (
              <Link
                href="/articles/new"
                className="toss-button px-4 py-3 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition"
              >
                새 글 작성하기
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-3 rounded-xl border border-black/5 bg-white/80 text-sm font-semibold hover:-translate-y-0.5 transition-transform shadow-sm"
              >
                로그인하고 글 쓰기
              </Link>
            )}
            <Link
              href="#feed"
              className="px-4 py-3 rounded-xl border border-transparent hover:border-black/5 bg-white/70 text-sm font-semibold text-toss-text shadow-sm"
            >
              피드로 바로가기
            </Link>
          </div>
        </section>

        <section id="feed" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-toss-gray">Latest</p>
              <h3 className="text-xl font-semibold">지금 막 올라온 글</h3>
            </div>
            {hasNext && (
              <button
                onClick={loadMore}
                className="text-sm font-semibold text-toss-blue hover:underline"
              >
                이어서 보기
              </button>
            )}
          </div>

          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="block toss-card p-5 hover:-translate-y-1 transition-transform duration-200 active:translate-y-0.5 border-l-4 border-transparent hover:border-l-toss-blue"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-toss-gray mb-2">글 #{article.id}</p>
                    <h3 className="text-lg font-semibold text-toss-text leading-tight line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="mt-3 flex items-center gap-2 text-xs text-toss-gray">
                      <span className="px-3 py-1 rounded-full bg-toss-blue/10 text-toss-blue font-semibold">
                        {article.authorNickname}
                      </span>
                      <span>·</span>
                      <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm text-toss-gray">
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/70 border border-black/5 shadow-sm">
                      👁️ {article.viewCount}
                    </span>
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/70 border border-black/5 shadow-sm">
                      💬 {article.commentCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Loading / Empty States */}
          {loading && (
            <div className="py-10 text-center text-toss-gray font-semibold">
              로딩 중입니다. 조금만 기다려주세요.
            </div>
          )}

          {!loading && articles.length === 0 && (
            <div className="toss-card text-center text-toss-gray">
              <p className="text-lg font-semibold mb-2">아직 게시글이 없어요.</p>
              <p className="text-sm">첫 글을 남겨주세요.</p>
            </div>
          )}

          {hasNext && !loading && (
            <div className="text-center">
              <button
                onClick={loadMore}
                className="toss-button px-5 py-3 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition"
              >
                다음 글 더 보기
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
