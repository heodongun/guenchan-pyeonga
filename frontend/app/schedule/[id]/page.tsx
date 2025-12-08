'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, CalendarClock, Users, Info } from 'lucide-react';
import { apiUrl } from '@/lib/api';

interface EventDetail {
  id: number;
  title: string;
  placeName: string;
  location: string;
  startAt: string;
  endAt?: string;
  category: string;
  capacity: number;
  currentParticipants: number;
  spotInfo: string;
  description: string;
}

interface ReservationForm {
  participantName: string;
  participantEmail: string;
  participantPhone: string;
  notes: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [form, setForm] = useState<ReservationForm>({
    participantName: '',
    participantEmail: '',
    participantPhone: '',
    notes: ''
  });

  useEffect(() => {
    fetchEventDetail();
  }, [params.id]);

  const fetchEventDetail = async () => {
    try {
      const response = await fetch(apiUrl(`/api/events/${params.id}`));
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(apiUrl('/api/reservations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event?.id,
          ...form
        })
      });

      if (response.ok) {
        alert('예약이 완료되었습니다!');
        router.push('/schedule/my-reservations');
      } else {
        const error = await response.json();
        alert(error.error || '예약에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to create reservation:', error);
      alert('예약에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-bg p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="brand-card h-96 animate-pulse" />
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-brand-bg p-6">
        <div className="mx-auto max-w-3xl">
          <div className="brand-card text-center py-12">
            <p className="text-brand-muted">일정을 찾을 수 없습니다.</p>
            <Link href="/schedule" className="mt-4 inline-block muted-link">
              일정 목록으로
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const eventDate = new Date(event.startAt);
  const isFull = event.currentParticipants >= event.capacity;

  return (
    <main className="min-h-screen bg-brand-bg p-6 pb-20">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/schedule" className="muted-link flex items-center gap-2">
            <ArrowLeft size={16} />
            일정 목록
          </Link>
          <span className="brand-pill">{event.category}</span>
        </div>

        <div className="brand-card space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <p className="text-brand-muted">{event.description}</p>
          </div>

          <div className="space-y-3 border-t border-brand-border pt-4">
            <div className="flex items-start gap-3">
              <CalendarClock size={20} className="text-brand-muted mt-0.5" />
              <div>
                <p className="font-semibold">
                  {eventDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </p>
                <p className="text-sm text-brand-muted">
                  {eventDate.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {event.endAt && ` - ${new Date(event.endAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-brand-muted mt-0.5" />
              <div>
                <p className="font-semibold">{event.placeName}</p>
                <p className="text-sm text-brand-muted">{event.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users size={20} className="text-brand-muted mt-0.5" />
              <div>
                <p className="font-semibold">
                  참가 인원: {event.currentParticipants}/{event.capacity}명
                </p>
                {isFull && (
                  <p className="text-sm text-red-600 font-semibold">정원이 마감되었습니다</p>
                )}
              </div>
            </div>

            {event.spotInfo && (
              <div className="flex items-start gap-3">
                <Info size={20} className="text-brand-muted mt-0.5" />
                <div>
                  <p className="font-semibold text-brand-primary">{event.spotInfo}</p>
                </div>
              </div>
            )}
          </div>

          {!showBookingForm ? (
            <button
              onClick={() => setShowBookingForm(true)}
              disabled={isFull}
              className="w-full rounded-lg bg-brand-primary px-6 py-3 font-semibold text-white hover:bg-brand-primary/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isFull ? '정원 마감' : '예약하기'}
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 border-t border-brand-border pt-6">
              <h2 className="text-xl font-semibold">예약 정보</h2>

              <div>
                <label className="block text-sm font-medium mb-2">이름 *</label>
                <input
                  type="text"
                  required
                  value={form.participantName}
                  onChange={(e) => setForm({ ...form, participantName: e.target.value })}
                  className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">이메일 *</label>
                <input
                  type="email"
                  required
                  value={form.participantEmail}
                  onChange={(e) => setForm({ ...form, participantEmail: e.target.value })}
                  className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">전화번호</label>
                <input
                  type="tel"
                  value={form.participantPhone}
                  onChange={(e) => setForm({ ...form, participantPhone: e.target.value })}
                  className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">메모</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 rounded-lg border border-brand-border px-6 py-3 font-semibold hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-brand-primary px-6 py-3 font-semibold text-white hover:bg-brand-primary/90 transition-colors disabled:bg-gray-300"
                >
                  {submitting ? '예약 중...' : '예약 확정'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
