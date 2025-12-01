'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl('/api/auth/signin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '로그인에 실패했습니다.');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-5 bg-toss-bg">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-toss-text mb-2">로그인</h1>
          <p className="text-gray-500">서비스 이용을 위해 로그인해주세요.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="toss-card">
          <div className="mb-4">
            <label htmlFor="email" className="block text-toss-text text-sm font-semibold mb-2">
              이메일
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-toss-blue focus:outline-none transition-all text-toss-text placeholder-gray-400"
              placeholder="이메일을 입력하세요"
            />
          </div>

          <div className="mb-8">
            <label htmlFor="password" className="block text-toss-text text-sm font-semibold mb-2">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-toss-blue focus:outline-none transition-all text-toss-text placeholder-gray-400"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full toss-button py-4 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <div className="mt-6 text-center">
            <Link
              href="/auth/signup"
              className="text-sm text-gray-500 hover:text-toss-blue transition-colors"
            >
              계정이 없으신가요? 회원가입
            </Link>
          </div>
        </form>

        <div className="text-center mt-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
