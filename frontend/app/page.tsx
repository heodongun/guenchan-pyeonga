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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold text-toss-text">게시판</h1>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">{user.nickname}님</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-600 hover:text-toss-blue transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm bg-toss-blue text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 pt-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-toss-text mb-2">
            안녕하세요,<br />
            오늘의 이야기를 들려주세요.
          </h2>
        </div>

        {/* Article List */}
        <div className="space-y-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.id}`}
              className="block toss-card hover:scale-[1.02] transition-transform duration-200 active:scale-[0.98]"
            >
              <h3 className="text-lg font-bold text-toss-text mb-2 line-clamp-1">
                {article.title}
              </h3>
              <div className="flex items-center text-sm text-gray-500 gap-2">
                <span>{article.authorNickname}</span>
                <span>·</span>
                <span>{new Date(article.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  👁️ {article.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  💬 {article.commentCount}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Loading / Empty States */}
        {loading && (
          <div className="py-8 text-center text-gray-500">
            로딩 중...
          </div>
        )}

        {!loading && articles.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            아직 게시글이 없어요.
          </div>
        )}

        {hasNext && !loading && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMore}
              className="text-toss-blue font-medium hover:underline py-2 px-4"
            >
              더 보기
            </button>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 max-w-2xl mx-auto w-full pointer-events-none flex justify-end px-5">
        {user ? (
          <Link
            href="/articles/new"
            className="pointer-events-auto bg-toss-blue text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors text-2xl pb-1"
          >
            +
          </Link>
        ) : (
          <button
            onClick={() => alert('로그인이 필요합니다.')}
            className="pointer-events-auto bg-gray-400 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-not-allowed text-2xl pb-1"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
