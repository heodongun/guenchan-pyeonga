'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, CalendarClock, Mail, Phone, X } from 'lucide-react';
import { apiUrl } from '@/lib/api';

interface Reservation {
  id: number;
  eventId: number;
  status: string;
  participantName: string;
  participantEmail: string;
  participantPhone?: string;
  notes: string;
  createdAt: string;
}

interface EventDetail {
  id: number;
  title: string;
  placeName: string;
  location: string;
  startAt: string;
  category: string;
}

export default function MyReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [events, setEvents] = useState<Map<number, EventDetail>>(new Map());
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/reservations/email/${encodeURIComponent(email)}`));
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
        setSearched(true);

        const eventIds = Array.from(new Set(data.map((r: Reservation) => r.eventId))) as number[];
        const eventMap = new Map<number, EventDetail>();

        await Promise.all(
          eventIds.map(async (eventId: number) => {
            try {
              const eventResponse = await fetch(apiUrl(`/api/events/${eventId}`));
              if (eventResponse.ok) {
                const eventData = await eventResponse.json();
                eventMap.set(eventId, eventData);
              }
            } catch (error) {
              console.error(`Failed to fetch event ${eventId}:`, error);
            }
          })
        );

        setEvents(eventMap);
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reservationId: number) => {
    if (!confirm('정말 예약을 취소하시겠습니까?')) return;

    try {
      const response = await fetch(apiUrl(`/api/reservations/${reservationId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (response.ok) {
        alert('예약이 취소되었습니다.');
        setReservations(prev =>
          prev.map(r => r.id === reservationId ? { ...r, status: 'cancelled' } : r)
        );
      } else {
        alert('예약 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to cancel reservation:', error);
      alert('예약 취소에 실패했습니다.');
    }
  };

  return (
    <main className="min-h-screen bg-brand-bg p-6 pb-20">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/schedule" className="muted-link flex items-center gap-2">
            <ArrowLeft size={16} />
            일정 목록
          </Link>
          <span className="brand-pill">내 예약</span>
        </div>

        <header className="space-y-2">
          <h1 className="text-3xl font-bold">내 예약 관리</h1>
          <p className="text-brand-muted text-sm">
            이메일로 예약 내역을 조회하고 관리할 수 있습니다.
          </p>
        </header>

        <form onSubmit={handleSearch} className="brand-card">
          <label className="block text-sm font-medium mb-2">이메일로 조회하기</label>
          <div className="flex gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="예약 시 사용한 이메일을 입력하세요"
              className="flex-1 rounded-lg border border-brand-border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-primary px-6 py-2.5 font-semibold text-white hover:bg-brand-primary/90 transition-colors"
            >
              조회
            </button>
          </div>
        </form>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="brand-card h-32 animate-pulse" />
            ))}
          </div>
        ) : searched && reservations.length === 0 ? (
          <div className="brand-card text-center text-brand-muted py-12">
            해당 이메일로 예약한 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => {
              const event = events.get(reservation.eventId);
              if (!event) return null;

              const eventDate = new Date(event.startAt);
              const isPast = eventDate < new Date();
              const isCancelled = reservation.status === 'cancelled';

              return (
                <div
                  key={reservation.id}
                  className="brand-card space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                          isCancelled
                            ? 'bg-gray-100 border-gray-300 text-gray-600'
                            : 'bg-brand-accent-soft border-brand-border'
                        }`}>
                          {isCancelled ? '취소됨' : event.category}
                        </span>
                        {isPast && !isCancelled && (
                          <span className="rounded-full bg-blue-100 border-blue-300 px-3 py-1 text-xs font-semibold text-blue-700">
                            완료
                          </span>
                        )}
                      </div>
                      <h3
                        className={`text-xl font-bold mb-3 cursor-pointer hover:text-brand-primary ${
                          isCancelled ? 'text-gray-400' : ''
                        }`}
                        onClick={() => router.push(`/schedule/${event.id}`)}
                      >
                        {event.title}
                      </h3>
                    </div>
                    {!isCancelled && !isPast && (
                      <button
                        onClick={() => handleCancel(reservation.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                        title="예약 취소"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center gap-2 text-brand-muted">
                      <CalendarClock size={16} />
                      <span>
                        {eventDate.toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                        {' '}
                        {eventDate.toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-brand-muted">
                      <MapPin size={16} />
                      <span>{event.placeName} - {event.location}</span>
                    </div>

                    <div className="border-t border-brand-border pt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-brand-muted" />
                        <span className="font-medium">{reservation.participantEmail}</span>
                      </div>
                      {reservation.participantPhone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-brand-muted" />
                          <span>{reservation.participantPhone}</span>
                        </div>
                      )}
                      {reservation.notes && (
                        <div className="text-sm text-brand-muted mt-2">
                          <span className="font-semibold">메모:</span> {reservation.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
