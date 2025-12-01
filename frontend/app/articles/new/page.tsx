'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';

export default function NewArticle() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('로그인이 필요합니다.');
        return;
      }

      const response = await fetch(apiUrl('/api/articles'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '게시글 작성에 실패했습니다.');
      }

      const article = await response.json();
      router.push(`/articles/${article.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-5 bg-toss-bg">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← 취소하고 돌아가기
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-toss-text">글쓰기</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="toss-card">
          <div className="mb-6">
            <label htmlFor="title" className="block text-toss-text text-sm font-semibold mb-2">
              제목
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-toss-blue focus:outline-none transition-all text-toss-text placeholder-gray-400 text-lg font-medium"
              placeholder="제목을 입력하세요"
            />
          </div>

          <div className="mb-8">
            <label htmlFor="content" className="block text-toss-text text-sm font-semibold mb-2">
              내용
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={15}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-toss-blue focus:outline-none transition-all text-toss-text placeholder-gray-400 resize-none"
              placeholder="내용을 입력하세요"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 toss-button py-4 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '작성 중...' : '작성하기'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
