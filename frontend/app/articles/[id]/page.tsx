'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';

interface Article {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorNickname: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: number;
  content: string;
  authorId: number;
  authorNickname: string;
  parentId: number | null;
  depth: number;
  isDeleted: boolean;
  createdAt: string;
  children: Comment[];
}

const normalizeCommentTree = (items: unknown): Comment[] => {
  if (!Array.isArray(items)) return [];

  const normalize = (item: any): Comment => {
    const normalizedChildren = Array.isArray(item?.children)
      ? item.children.map((child: any) => normalize(child))
      : [];

    return {
      id: item?.id ?? 0,
      content: item?.content ?? '',
      authorId: item?.authorId ?? 0,
      authorNickname: item?.authorNickname ?? '',
      parentId: item?.parentId ?? null,
      depth: item?.depth ?? 0,
      isDeleted: Boolean(item?.isDeleted),
      createdAt: item?.createdAt ?? '',
      children: normalizedChildren,
    };
  };

  return items.map(normalize);
};

export default function ArticleDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchArticle();
    fetchComments();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await fetch(apiUrl(`/api/articles/${id}`));
      if (!response.ok) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }
      const data = await response.json();
      setArticle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(apiUrl(`/api/comments/article/${id}`));
      if (!response.ok) return;

      const data = await response.json();
      setComments(normalizeCommentTree(data));
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setComments([]);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/comments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newComment,
          articleId: Number(id),
          parentId: replyTo,
        }),
      });

      if (!response.ok) {
        throw new Error('댓글 작성에 실패했습니다.');
      }

      setNewComment('');
      setReplyTo(null);
      fetchComments();
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/articles/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.');
      }

      router.push('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const renderComment = (comment: Comment) => {
    return (
      <div
        key={comment.id}
        className={`${comment.depth > 0 ? 'ml-6 border-l border-brand-border pl-6' : ''} mt-4`}
      >
        <div className="rounded-xl border border-brand-border bg-white px-4 py-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {comment.isDeleted ? '삭제된 사용자' : comment.authorNickname}
              </span>
              <span className="text-xs text-brand-muted">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            <span className="rounded-full border border-brand-border px-2 py-0.5 text-[11px] font-semibold text-brand-muted">
              {comment.depth === 0 ? '원댓글' : `대댓글 ${comment.depth}`}
            </span>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-brand-ink">
            {comment.isDeleted ? '삭제된 댓글입니다.' : comment.content}
          </p>
          {!comment.isDeleted && (
            <button
              onClick={() => setReplyTo(comment.id)}
              className="text-xs font-semibold text-brand-ink transition-colors hover:text-brand-accent"
            >
              답글 달기
            </button>
          )}
        </div>
        {(comment.children ?? []).map((child) => renderComment(child))}
      </div>
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-bg p-5">
        <div className="brand-card text-center">
          <p className="text-brand-muted font-semibold">불러오는 중입니다. 잠시만 기다려주세요.</p>
        </div>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-bg p-5">
        <div className="brand-card text-center space-y-4">
          <p className="text-red-600 font-semibold">{error || '게시글을 찾을 수 없습니다.'}</p>
          <Link href="/" className="brand-button-ghost justify-center">
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg p-6 pb-24">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="muted-link">
            &larr; 이야기 목록
          </Link>
          <span className="brand-pill">동네 이야기</span>
        </div>

        <article className="brand-card space-y-8">
          <div className="space-y-4 border-b border-brand-border pb-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-brand-muted">
              <span className="font-semibold text-brand-ink">#{article.id.toString().padStart(4, '0')}</span>
              <div className="flex flex-wrap items-center gap-3">
                <span>{new Date(article.createdAt).toLocaleString()}</span>
                <span>조회 {article.viewCount}</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{article.title}</h1>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent-soft font-bold text-brand-ink">
                {article.authorNickname.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-brand-ink">{article.authorNickname}</span>
            </div>
          </div>

          <div className="text-base leading-relaxed text-brand-ink">
            <p className="whitespace-pre-wrap">{article.content}</p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleDelete}
              className="text-sm font-semibold text-brand-muted transition-colors hover:text-red-600"
            >
              글 삭제하기
            </button>
          </div>
        </article>

        <section className="brand-card space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">댓글 {comments.length}</h2>
          </div>

          <form onSubmit={handleSubmitComment} className="space-y-4">
            {replyTo && (
              <div className="flex items-center justify-between rounded-lg border border-brand-border bg-brand-accent-soft/60 px-4 py-2 text-sm text-brand-ink">
                <span>대댓글을 작성 중입니다.</span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="font-semibold hover:text-brand-accent"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="운영 노하우나 궁금한 점을 남겨주세요."
                rows={3}
                className="flex-1 rounded-xl border border-brand-border bg-white px-4 py-3 text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition resize-none"
                required
              />
              <button
                type="submit"
                className="brand-button h-fit whitespace-nowrap px-5 py-3"
              >
                댓글 등록
              </button>
            </div>
          </form>

          <div className="space-y-6">
            {comments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-brand-border px-4 py-10 text-center text-brand-muted">
                아직 댓글이 없습니다. 첫 의견을 남겨보세요.
              </div>
            ) : (
              comments.map((comment) => renderComment(comment))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
