'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { apiUrl } from '@/lib/api';

interface EventForm {
  title: string;
  placeName: string;
  location: string;
  startAt: string;
  endAt: string;
  category: string;
  capacity: number;
  spotInfo: string;
  description: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<EventForm>({
    title: '',
    placeName: '',
    location: '',
    startAt: '',
    endAt: '',
    category: '모임',
    capacity: 20,
    spotInfo: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(apiUrl('/api/events'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          placeId: null,
          startAt: new Date(form.startAt).toISOString(),
          endAt: form.endAt ? new Date(form.endAt).toISOString() : null
        })
      });

      if (response.ok) {
        const event = await response.json();
        alert('일정이 생성되었습니다!');
        router.push(`/schedule/${event.id}`);
      } else {
        const error = await response.json();
        alert(error.error || '일정 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('일정 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-bg p-6 pb-20">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/schedule" className="muted-link flex items-center gap-2">
            <ArrowLeft size={16} />
            일정 목록
          </Link>
          <span className="brand-pill">새 일정</span>
        </div>

        <header className="space-y-2">
          <h1 className="text-3xl font-bold">일정 만들기</h1>
          <p className="text-brand-muted text-sm">
            새로운 모임이나 클래스 일정을 만들어보세요.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="brand-card space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">제목 *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="일정 제목을 입력하세요"
              className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">카테고리 *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="모임">모임</option>
                <option value="클래스">클래스</option>
                <option value="워크샵">워크샵</option>
                <option value="세미나">세미나</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">최대 인원 *</label>
              <input
                type="number"
                required
                min="1"
                max="999"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">장소명 *</label>
            <input
              type="text"
              required
              value={form.placeName}
              onChange={(e) => setForm({ ...form, placeName: e.target.value })}
              placeholder="예: 홍대 카페"
              className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">상세 위치 *</label>
            <input
              type="text"
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="예: 서울 마포구 홍익로 00"
              className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">시작 시간 *</label>
              <input
                type="datetime-local"
                required
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">종료 시간</label>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">추천 정보</label>
            <input
              type="text"
              value={form.spotInfo}
              onChange={(e) => setForm({ ...form, spotInfo: e.target.value })}
              placeholder="예: 초보자 환영, 노트북 필요"
              className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">상세 설명 *</label>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="일정에 대한 상세한 설명을 작성해주세요"
              className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Link
              href="/schedule"
              className="flex-1 rounded-lg border border-brand-border px-6 py-3 font-semibold text-center hover:bg-gray-50 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-brand-primary px-6 py-3 font-semibold text-white hover:bg-brand-primary/90 transition-colors disabled:bg-gray-300"
            >
              {submitting ? '생성 중...' : '일정 생성'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
