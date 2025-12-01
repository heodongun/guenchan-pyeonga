'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Article {
  id: number;
  title: string;
  authorNickname: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);

  const fetchArticles = async (cursor?: number | null) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const url = cursor
        ? `${apiUrl}/api/articles?lastId=${cursor}&size=20`
        : `${apiUrl}/api/articles?size=20`;

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
  }, []);

  const loadMore = () => {
    if (hasNext && nextCursor) {
      fetchArticles(nextCursor);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">게시판</h1>

      <div className="mb-4">
        <Link
          href="/articles/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          글쓰기
        </Link>
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
