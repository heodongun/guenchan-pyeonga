'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarClock, MapPin, Users } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { apiUrl } from '@/lib/api';

interface EventItem {
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

export default function CalendarPage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMonthEvents(date);
  }, [date]);

  const fetchMonthEvents = async (selectedDate: Date) => {
    setLoading(true);
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const response = await fetch(apiUrl(`/api/events/calendar/month/${year}/${month}`));
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (value: any) => {
    const newDate = value as Date;
    setDate(newDate);

    const eventsOnDate = events.filter(event => {
      const eventDate = new Date(event.startAt);
      return eventDate.toDateString() === newDate.toDateString();
    });

    setSelectedDateEvents(eventsOnDate);
  };

  const tileContent = ({ date: tileDate, view }: any) => {
    if (view === 'month') {
      const eventsOnDate = events.filter(event => {
        const eventDate = new Date(event.startAt);
        return eventDate.toDateString() === tileDate.toDateString();
      });

      if (eventsOnDate.length > 0) {
        return (
          <div className="flex justify-center mt-1">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
          </div>
        );
      }
    }
    return null;
  };

  return (
    <main className="min-h-screen bg-brand-bg p-6 pb-20">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/schedule" className="muted-link flex items-center gap-2">
            <ArrowLeft size={16} />
            일정 목록
          </Link>
          <span className="brand-pill">캘린더</span>
        </div>

        <header className="space-y-2">
          <h1 className="text-3xl font-bold">모임 캘린더</h1>
          <p className="text-brand-muted text-sm">
            달력에서 날짜를 선택하여 일정을 확인하세요.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="brand-card">
            <Calendar
              onChange={handleDateChange}
              value={date}
              tileContent={tileContent}
              className="w-full rounded-lg border-0"
              locale="ko-KR"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {date.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
              {selectedDateEvents.length > 0 && (
                <span className="brand-pill">{selectedDateEvents.length}개 일정</span>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="brand-card h-24 animate-pulse" />
                ))}
              </div>
            ) : selectedDateEvents.length === 0 ? (
              <div className="brand-card text-center text-brand-muted py-12">
                선택한 날짜에 일정이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => {
                  const time = new Date(event.startAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={event.id}
                      className="brand-card space-y-3 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push(`/schedule/${event.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-brand-accent-soft px-3 py-1 text-xs font-semibold border border-brand-border">
                          {event.category}
                        </span>
                        <span className="text-sm text-brand-muted">{time}</span>
                      </div>
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-brand-muted">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span>{event.placeName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>{event.currentParticipants}/{event.capacity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
