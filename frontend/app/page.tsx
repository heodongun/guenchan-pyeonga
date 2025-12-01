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
    // Load user from localStorage
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
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">게시판</h1>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-gray-700">환영합니다, {user.nickname}님</span>
              <button
                onClick={handleLogout}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                로그인
              </Link>
              <Link
                href="/auth/signup"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mb-4">
        {user ? (
          <Link
            href="/articles/new"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block"
          >
            글쓰기
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className="bg-gray-400 text-white px-4 py-2 rounded inline-block cursor-not-allowed"
            onClick={(e) => {
              e.preventDefault();
              alert('로그인이 필요합니다.');
            }}
          >
            글쓰기 (로그인 필요)
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.id}`}
            className="block p-4 border rounded hover:bg-gray-50"
          >
            <h2 className="text-xl font-semibold mb-2">{article.title}</h2>
            <div className="text-sm text-gray-600">
              <span>{article.authorNickname}</span>
              <span className="mx-2">·</span>
              <span>조회 {article.viewCount}</span>
              <span className="mx-2">·</span>
              <span>댓글 {article.commentCount}</span>
              <span className="mx-2">·</span>
              <span>{new Date(article.createdAt).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>

      {hasNext && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 disabled:bg-gray-300"
          >
            {loading ? '로딩 중...' : '더 보기'}
          </button>
        </div>
      )}

      {articles.length === 0 && !loading && (
        <p className="text-center text-gray-500 mt-8">게시글이 없습니다.</p>
      )}
    </main>
  );
}
