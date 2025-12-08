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
        setLoading(false);
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
    <main className="min-h-screen bg-brand-bg p-6 pb-24">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="muted-link">
            &larr; 홈으로 돌아가기
          </Link>
          <span className="brand-pill">동네 이야기 작성</span>
        </div>

        <div className="brand-card">
          <div className="mb-8 space-y-2 border-b border-brand-border pb-6">
            <p className="text-sm text-brand-muted">운영 기록과 후기를 공유하세요</p>
            <h1 className="text-3xl font-bold">이웃들과 이야기 나누기</h1>
            <p className="text-sm text-brand-muted">공간 운영 경험, 모임 후기, 동네 질문까지 자유롭게 남길 수 있습니다.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-semibold border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-semibold text-brand-ink">
                제목
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-lg font-medium text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition"
                placeholder="예) 주방 예약 팁을 정리해봤어요"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="block text-sm font-semibold text-brand-ink">
                내용
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={14}
                className="w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition resize-none"
                placeholder="운영 노하우, 후기, 질문을 적어주세요."
              />
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 min-w-[160px] brand-button py-4 text-base font-bold text-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? '등록 중...' : '글 올리기'}
              </button>
              <Link
                href="/"
                className="flex-1 min-w-[160px] brand-button-ghost py-4 text-base font-semibold text-center"
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
