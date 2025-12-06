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
    <main className="min-h-screen p-5 bg-toss-bg pb-24">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-sm font-semibold text-toss-text px-3 py-2 rounded-full bg-white/80 border border-black/5 hover:-translate-y-0.5 transition-transform shadow-sm"
          >
            ← 돌아가기
          </Link>
          <span className="pill">새 글</span>
        </div>

        <div className="toss-card mb-6">
          <div className="mb-6 space-y-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-toss-gray">Writer mode</p>
            <h1 className="text-3xl font-semibold text-toss-text">새로운 이야기를 시작하세요</h1>
            <p className="text-sm text-toss-gray">핵심만 간결하게, 읽는 사람이 바로 행동할 수 있게.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm font-semibold border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-toss-text text-sm font-semibold">
                제목
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/80 border border-black/5 focus:bg-white focus:border-toss-blue focus:outline-none transition-all text-toss-text placeholder-gray-400 text-lg font-medium shadow-sm"
                placeholder="독자를 멈춰 세울 한 문장"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="block text-toss-text text-sm font-semibold">
                내용
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={14}
                className="w-full px-4 py-3 rounded-xl bg-white/80 border border-black/5 focus:bg-white focus:border-toss-blue focus:outline-none transition-all text-toss-text placeholder-gray-400 resize-none shadow-sm"
                placeholder="핵심 요약 → 근거 → 한 줄 의견 순으로 적어보세요."
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 min-w-[160px] toss-button py-4 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed text-center shadow-md hover:shadow-lg transition"
              >
                {loading ? '작성 중...' : '작성하기'}
              </button>
              <Link
                href="/"
                className="flex-1 min-w-[160px] bg-white/80 text-toss-text border border-black/5 rounded-xl py-4 text-lg font-medium hover:-translate-y-0.5 transition-transform text-center shadow-sm"
              >
                취소
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
