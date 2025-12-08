'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, CalendarClock } from 'lucide-react';
import { apiUrl } from '@/lib/api';

interface EventItem {
  id: number;
  title: string;
  placeName: string;
  location: string;
  startAt: string;
  spotInfo: string;
}

export default function SchedulePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await fetch(apiUrl('/api/events/weekly'));
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <main className="min-h-screen bg-brand-bg p-6 pb-20">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="muted-link flex items-center gap-2">
            <ArrowLeft size={16} />
            홈으로
          </Link>
          <div className="flex gap-2">
            <Link href="/schedule/calendar" className="brand-pill hover:bg-brand-primary hover:text-white transition-colors">
              📅 캘린더
            </Link>
            <Link href="/schedule/my-reservations" className="brand-pill hover:bg-brand-primary hover:text-white transition-colors">
              내 예약
            </Link>
          </div>
        </div>

        <header className="space-y-2">
          <h1 className="text-3xl font-bold">모임과 클래스 일정</h1>
          <p className="text-brand-muted text-sm">이번 주 등록된 클래스와 모임을 확인하고 참여할 일정을 고르세요.</p>
        </header>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="brand-card h-28 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="brand-card text-center text-brand-muted">
            이번 주에 등록된 모임이 없습니다.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => {
              const date = new Date(event.startAt);
              const dayLabel = date.toLocaleDateString('ko-KR', { weekday: 'short', month: 'numeric', day: 'numeric' });
              const time = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

              return (
                <Link
                  key={event.id}
                  href={`/schedule/${event.id}`}
                  className="brand-card space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-sm text-brand-muted">
                    <span className="rounded-full bg-brand-accent-soft px-3 py-1 text-xs font-semibold border border-brand-border">{dayLabel}</span>
                    <span>{time}</span>
                  </div>
                  <p className="text-lg font-semibold">{event.title}</p>
                  <div className="flex items-center gap-2 text-sm text-brand-muted">
                    <MapPin size={14} />
                    <span>{event.placeName}</span>
                  </div>
                  <p className="text-sm font-semibold text-brand-ink">{event.spotInfo}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
