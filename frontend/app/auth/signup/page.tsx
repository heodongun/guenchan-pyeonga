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
    <main className="min-h-screen flex items-center justify-center bg-brand-bg p-5">
      <div className="w-full max-w-[420px]">
        <div className="brand-card space-y-6">
          <div className="text-center space-y-2">
            <span className="brand-pill justify-center">새 계정</span>
            <h1 className="text-3xl font-bold">Homeground 시작하기</h1>
            <p className="text-brand-muted text-sm">닉네임과 이메일만으로 바로 참여할 수 있습니다.</p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-brand-ink">
                이메일
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-brand-ink placeholder:text-brand-muted/70 shadow-sm transition focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                placeholder="name@email.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-brand-ink">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-brand-ink placeholder:text-brand-muted/70 shadow-sm transition focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                placeholder="8자 이상 입력해주세요"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="nickname" className="block text-sm font-semibold text-brand-ink">
                닉네임
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-brand-ink placeholder:text-brand-muted/70 shadow-sm transition focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                placeholder="커뮤니티에서 보여질 이름"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="brand-button w-full justify-center py-4 text-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="muted-link"
            >
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>

          <div className="text-center">
            <Link href="/" className="muted-link">
              ← 홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
