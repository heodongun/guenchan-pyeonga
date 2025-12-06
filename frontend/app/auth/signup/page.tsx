'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, nickname }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '회원가입에 실패했습니다.');
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
      <div className="w-full max-w-[420px]">
        <div className="toss-card">
          <div className="text-center mb-8 space-y-2">
            <span className="pill">새 계정</span>
            <h1 className="text-3xl font-bold text-toss-text">시작을 가볍게</h1>
            <p className="text-toss-gray text-sm">선명한 닉네임과 이메일만 있으면 바로 참여할 수 있습니다.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm font-semibold border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-toss-text text-sm font-semibold">
                이메일
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/80 border border-black/5 focus:bg-white focus:border-toss-blue focus:outline-none transition-all text-toss-text placeholder-gray-400 shadow-sm"
                placeholder="name@email.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-toss-text text-sm font-semibold">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white/80 border border-black/5 focus:bg-white focus:border-toss-blue focus:outline-none transition-all text-toss-text placeholder-gray-400 shadow-sm"
                placeholder="8자 이상, 안전하게"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="nickname" className="block text-toss-text text-sm font-semibold">
                닉네임
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/80 border border-black/5 focus:bg-white focus:border-toss-blue focus:outline-none transition-all text-toss-text placeholder-gray-400 shadow-sm"
                placeholder="커뮤니티에서 보여질 이름"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full toss-button py-4 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-toss-text hover:text-toss-blue transition-colors"
            >
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← 홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
