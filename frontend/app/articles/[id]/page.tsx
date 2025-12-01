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
        className={`${comment.depth > 0 ? 'ml-6 pl-4 border-l-2 border-gray-100' : ''} mt-4`}
      >
        <div className="py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm text-toss-text">
              {comment.isDeleted ? '알 수 없음' : comment.authorNickname}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="text-gray-700 mb-2 text-sm leading-relaxed">
            {comment.isDeleted ? '삭제된 댓글입니다.' : comment.content}
          </p>
          {!comment.isDeleted && (
            <button
              onClick={() => setReplyTo(comment.id)}
              className="text-xs text-toss-gray hover:text-toss-blue font-medium transition-colors"
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
        <p className="text-gray-500">로딩 중...</p>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="min-h-screen p-5 bg-toss-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '게시글을 찾을 수 없습니다.'}</p>
          <Link href="/" className="text-toss-blue hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-5 bg-toss-bg pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← 목록으로
          </Link>
        </div>

        <article className="toss-card mb-6">
          <h1 className="text-2xl font-bold mb-4 text-toss-text leading-tight">{article.title}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-100">
            <span className="font-medium text-gray-700">{article.authorNickname}</span>
            <span className="text-gray-300">|</span>
            <span>{new Date(article.createdAt).toLocaleString()}</span>
            <span className="text-gray-300">|</span>
            <span>조회 {article.viewCount}</span>
          </div>
          <div className="prose max-w-none mb-8 text-gray-800 leading-relaxed">
            <p className="whitespace-pre-wrap">{article.content}</p>
          </div>

          {/* Only show delete if user is author - logic handled by backend but UI can be improved later with user context */}
          <div className="flex justify-end border-t border-gray-100 pt-6">
            <button
              onClick={handleDelete}
              className="text-red-500 text-sm hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              삭제하기
            </button>
          </div>
        </article>

        <section className="toss-card">
          <h2 className="text-lg font-bold mb-6 text-toss-text">댓글 <span className="text-toss-blue">{comments.length}</span></h2>

          <form onSubmit={handleSubmitComment} className="mb-8 bg-gray-50 p-4 rounded-xl">
            {replyTo && (
              <div className="mb-3 text-sm text-gray-600 flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-gray-100">
                <span>답글 작성 중...</span>
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
                placeholder="댓글을 남겨보세요"
                rows={1}
                className="flex-1 px-4 py-3 border-none rounded-xl focus:ring-0 bg-transparent resize-none placeholder-gray-400 text-toss-text"
                required
              />
              <button
                type="submit"
                className="bg-toss-blue text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors whitespace-nowrap h-fit self-end"
              >
                등록
              </button>
            </div>
          </form>

          <div className="space-y-1">
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
