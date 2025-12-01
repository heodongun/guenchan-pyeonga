'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchArticle();
    fetchComments();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/articles/${id}`);
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
      const response = await fetch(`${apiUrl}/api/comments/article/${id}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
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
      const response = await fetch(`${apiUrl}/api/comments`, {
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
      const response = await fetch(`${apiUrl}/api/articles/${id}`, {
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
        className={`border-l-2 ${comment.depth > 0 ? 'ml-8 mt-2' : 'mt-4'}`}
      >
        <div className="pl-4 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">
              {comment.isDeleted ? '알 수 없음' : comment.authorNickname}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="text-gray-800 mb-2">
            {comment.isDeleted ? '삭제된 댓글입니다.' : comment.content}
          </p>
          {!comment.isDeleted && (
            <button
              onClick={() => setReplyTo(comment.id)}
              className="text-xs text-blue-500 hover:underline"
            >
              답글
            </button>
          )}
        </div>
        {comment.children.map((child) => renderComment(child))}
      </div>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8 max-w-4xl mx-auto">
        <p>로딩 중...</p>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="min-h-screen p-8 max-w-4xl mx-auto">
        <p className="text-red-500">{error || '게시글을 찾을 수 없습니다.'}</p>
        <Link href="/" className="text-blue-500 hover:underline">
          목록으로
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="text-blue-500 hover:underline">
          ← 목록으로
        </Link>
      </div>

      <article className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-4 border-b">
          <span>{article.authorNickname}</span>
          <span>조회 {article.viewCount}</span>
          <span>{new Date(article.createdAt).toLocaleString()}</span>
        </div>
        <div className="prose max-w-none mb-6">
          <p className="whitespace-pre-wrap">{article.content}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            삭제
          </button>
        </div>
      </article>

      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">댓글 {comments.length}개</h2>

        <form onSubmit={handleSubmitComment} className="mb-6">
          {replyTo && (
            <div className="mb-2 text-sm text-gray-600">
              답글 작성 중...{' '}
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-blue-500 hover:underline"
              >
                취소
              </button>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
            rows={3}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {replyTo ? '답글 작성' : '댓글 작성'}
          </button>
        </form>

        <div className="space-y-2">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">댓글이 없습니다.</p>
          ) : (
            comments.map((comment) => renderComment(comment))
          )}
        </div>
      </section>
    </main>
  );
}
