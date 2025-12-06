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
        className={`${comment.depth > 0 ? 'ml-6' : ''} mt-4`}
      >
        <div className="relative p-4 bg-white/80 border border-black/5 rounded-xl shadow-sm">
          {comment.depth > 0 && (
            <div className="absolute -left-4 top-5 h-[calc(100%-20px)] w-[2px] bg-gradient-to-b from-toss-blue/30 to-transparent rounded-full" />
          )}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-toss-text">
                {comment.isDeleted ? '알 수 없음' : comment.authorNickname}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-toss-blue/10 text-toss-blue">
              {comment.depth === 0 ? '루트' : `Depth ${comment.depth}`}
            </span>
          </div>
          <p className="text-gray-700 mb-3 text-sm leading-relaxed">
            {comment.isDeleted ? '삭제된 댓글입니다.' : comment.content}
          </p>
          {!comment.isDeleted && (
            <button
              onClick={() => setReplyTo(comment.id)}
              className="text-xs font-semibold text-toss-blue hover:underline"
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
      <main className="min-h-screen p-5 bg-toss-bg flex items-center justify-center">
        <div className="toss-card text-center">
          <p className="text-toss-gray font-semibold">로딩 중입니다. 잠시만 기다려주세요.</p>
        </div>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="min-h-screen p-5 bg-toss-bg flex items-center justify-center">
        <div className="toss-card text-center">
          <p className="text-red-500 font-semibold mb-4">{error || '게시글을 찾을 수 없습니다.'}</p>
          <Link href="/" className="toss-button inline-block px-4 py-3 rounded-xl text-sm font-semibold">
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-5 bg-toss-bg pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-toss-text px-3 py-2 rounded-full bg-white/80 border border-black/5 hover:-translate-y-0.5 transition-transform shadow-sm"
          >
            ← 목록으로
          </Link>
          <span className="pill">읽는 중</span>
        </div>

        <article className="toss-card space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-toss-gray">Article</p>
            <h1 className="text-3xl font-semibold text-toss-text leading-tight">{article.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-toss-gray">
              <span className="px-3 py-1 rounded-full bg-toss-blue/10 text-toss-blue font-semibold">
                {article.authorNickname}
              </span>
              <span className="text-toss-gray">작성 {new Date(article.createdAt).toLocaleString()}</span>
              <span className="text-toss-gray">조회 {article.viewCount}</span>
            </div>
          </div>

          <div className="prose max-w-none mb-4 text-gray-800 leading-relaxed">
            <p className="whitespace-pre-wrap">{article.content}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-toss-gray">
            <div className="rounded-2xl border border-black/5 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.12em]">작성</p>
              <p className="font-semibold text-toss-text">{new Date(article.createdAt).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.12em]">최종 수정</p>
              <p className="font-semibold text-toss-text">{new Date(article.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex justify-end border-t border-black/5 pt-6">
            <button
              onClick={handleDelete}
              className="text-sm font-semibold text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              삭제하기
            </button>
          </div>
        </article>

        <section className="toss-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-toss-text">댓글 <span className="text-toss-blue">{comments.length}</span></h2>
            <span className="text-xs text-toss-gray">맥락을 잇는 짧은 생각들</span>
          </div>

          <form onSubmit={handleSubmitComment} className="mb-8 bg-white/70 p-4 rounded-xl border border-black/5 shadow-sm">
            {replyTo && (
              <div className="mb-3 text-sm text-gray-600 flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-black/5">
                <span className="font-semibold">답글 작성 중...</span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="짧고 선명하게 남겨보세요."
                rows={2}
                className="flex-1 px-4 py-3 border-none rounded-xl focus:ring-0 bg-transparent resize-none placeholder-gray-400 text-toss-text"
                required
              />
              <button
                type="submit"
                className="toss-button px-4 py-3 rounded-xl font-semibold whitespace-nowrap h-fit self-end shadow-md hover:shadow-lg transition"
              >
                등록
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-center py-8">첫 번째 댓글을 남겨보세요.</p>
            ) : (
              comments.map((comment) => renderComment(comment))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
