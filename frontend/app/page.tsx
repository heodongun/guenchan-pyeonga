'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Home as HomeIcon,
  MapPin,
  NotebookPen,
  Sparkles,
  Users,
} from 'lucide-react';
import { apiUrl } from '@/lib/api';

interface Article {
  id: number;
  title: string;
  authorNickname: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
}

interface Spot {
  id: number;
  name: string;
  tag: string;
  meta: string;
  location: string;
  description: string;
  createdAt: string;
}

interface EventItem {
  id: number;
  title: string;
  placeName: string;
  location: string;
  startAt: string;
  spotInfo: string;
}

interface User {
  id: number;
  email: string;
  nickname: string;
}

const serviceBlocks = [
  {
    title: '공간 예약',
    description: '공유주방, 공방, 회의실을 손쉽게 예약하고 리뷰까지 한 번에 남겨요.',
    icon: HomeIcon,
  },
  {
    title: '모임 일정',
    description: '동네 모임과 클래스를 캘린더로 확인하고 알림을 받아보세요.',
    icon: CalendarDays,
  },
  {
    title: '이야기 아카이브',
    description: '운영 노하우, 후기, 질문을 기록해두는 커뮤니티 보드.',
    icon: NotebookPen,
  },
];

export default function Home() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoadingArticles(true);
      try {
        const response = await fetch(apiUrl('/api/articles?size=6'));
        const data = await response.json();
        setArticles(data.articles);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoadingArticles(false);
      }
    };

    const fetchSpots = async () => {
      setLoadingSpots(true);
      try {
        const response = await fetch(apiUrl('/api/spots?size=6'));
        const data = await response.json();
        setSpots(data);
      } catch (error) {
        console.error('Failed to fetch spots:', error);
      } finally {
        setLoadingSpots(false);
      }
    };

    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const response = await fetch(apiUrl('/api/events/weekly'));
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchArticles();
    fetchSpots();
    fetchEvents();
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.refresh();
  };

  const todayLabel = new Date().toLocaleDateString('ko-KR', { weekday: 'short' });

  const formattedMetrics = useMemo(() => [
    { label: '입점 공간', value: spots.length.toLocaleString(), note: '실시간 카운트' },
    { label: '이번 주 모임', value: events.length.toLocaleString(), note: '이번 주 일정' },
    { label: '멤버 응답률', value: '98%', note: '문의 · 댓글 응답' },
  ], [spots.length, events.length]);

  const todaysEvents = useMemo(
    () =>
      events.filter((event) => {
        const date = new Date(event.startAt);
        const now = new Date();
        return date.toDateString() === now.toDateString();
      }),
    [events]
  );

  const weeklySchedule = events;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-brand-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-ink text-white font-semibold">
              HG
            </div>
            <div>
              <p className="text-base font-bold leading-tight">Homeground</p>
              <p className="text-xs text-brand-muted leading-tight">동네 생활을 한 번에</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-4 text-sm font-medium text-brand-muted md:flex">
              <Link href="#services" className="hover:text-brand-ink transition-colors">서비스</Link>
              <Link href="#schedule" className="hover:text-brand-ink transition-colors">모임</Link>
              <Link href="#stories" className="hover:text-brand-ink transition-colors">이야기</Link>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-brand-muted hidden sm:inline">{user.nickname}</span>
                <button
                  onClick={handleLogout}
                  className="muted-link"
                >
                  로그아웃
                </button>
                <Link
                  href="/articles/new"
                  className="brand-button px-4 py-2 text-sm"
                >
                  새 글 쓰기
                </Link>
              </div>
            ) : (
              <Link href="/auth/login" className="brand-button-ghost px-4 py-2 text-sm">
                로그인
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-accent-soft/60 via-white to-transparent" />
            <div className="absolute top-[-120px] right-[-80px] h-72 w-72 rounded-full bg-brand-accent/10 blur-3xl" />
            <div className="absolute bottom-[-160px] left-[-40px] h-80 w-80 rounded-full bg-brand-olive/10 blur-3xl" />
            <div className="absolute inset-0 opacity-60 bg-soft-grid [background-size:32px_32px]" />
          </div>

          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <span className="brand-pill w-fit">
                  새로워진 Homeground
                  <Sparkles size={14} className="text-brand-ink" />
                </span>
                <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                  동네 공간, 모임, 이야기를
                  <br />
                  한 번에 관리하는 <span className="text-brand-accent">Homeground</span>
                </h1>
                <p className="text-lg text-brand-muted max-w-2xl">
                  예약부터 일정 공유, 후기까지 흩어져 있던 동네 생활 정보를 한 자리에 모았습니다.
                  운영자와 이웃 모두가 다시 찾고 싶은 기록을 남길 수 있어요.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <Link href={user ? '/articles/new' : '/auth/login'} className="brand-button">
                    {user ? '새 이야기 작성' : '시작하기'}
                  </Link>
                  <Link href="#stories" className="brand-button-ghost">
                    최근 이야기 보기
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-4">
                  {formattedMetrics.map((metric) => (
                    <div key={metric.label} className="brand-card">
                      <p className="text-sm text-brand-muted">{metric.label}</p>
                      <p className="mt-2 text-2xl font-bold">{metric.value}</p>
                      <p className="text-xs text-brand-muted mt-1">{metric.note}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="space-y-4"
              >
                <div className="brand-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-brand-muted">이번 주 추천 스폿</p>
                      <p className="text-lg font-semibold">운영자와 이웃들이 직접 올린 공간</p>
                    </div>
                    <span className="brand-pill">실시간 업데이트</span>
                  </div>
                  <div className="mt-5 space-y-3">
                    {loadingSpots ? (
                      [1, 2, 3].map((i) => (
                        <div key={i} className="h-20 rounded-xl border border-brand-border bg-brand-surface animate-pulse" />
                      ))
                    ) : spots.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-brand-border px-4 py-6 text-center text-sm text-brand-muted">
                        아직 등록된 공간이 없습니다.
                      </div>
                    ) : (
                      spots.slice(0, 3).map((spot) => (
                        <div key={spot.id} className="flex items-start justify-between rounded-xl border border-brand-border px-4 py-3 bg-brand-surface">
                          <div>
                            <p className="font-semibold">{spot.name}</p>
                            <p className="text-sm text-brand-muted">{spot.meta}</p>
                            <p className="text-xs text-brand-muted">{spot.location}</p>
                          </div>
                          <span className="rounded-full bg-brand-accent-soft px-3 py-1 text-xs font-semibold text-brand-ink border border-brand-border">
                            {spot.tag}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="brand-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-brand-muted">오늘 일정</p>
                      <p className="font-semibold">바로 참여할 수 있는 모임</p>
                    </div>
                    <Clock3 size={18} className="text-brand-muted" />
                  </div>
                  <div className="space-y-3">
                    {loadingEvents ? (
                      [1, 2].map((i) => (
                        <div key={i} className="h-16 rounded-xl border border-brand-border bg-brand-surface animate-pulse" />
                      ))
                    ) : todaysEvents.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-brand-border px-4 py-6 text-center text-sm text-brand-muted">
                        오늘 참여할 일정이 없습니다.
                      </div>
                    ) : (
                      todaysEvents.slice(0, 2).map((item) => {
                        const time = new Date(item.startAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div key={item.id} className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-surface-strong/60 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold border border-brand-border">{todayLabel}</span>
                              <div>
                                <p className="font-semibold">{item.title}</p>
                                <p className="text-sm text-brand-muted">{item.placeName}</p>
                              </div>
                            </div>
                            <span className="text-sm text-brand-muted">{time}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="border-t border-brand-border bg-white/80 py-14">
          <div className="mx-auto max-w-6xl px-6 space-y-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-brand-muted">서비스 구성</p>
                <h2 className="text-2xl font-bold">동네 생활을 위한 세 가지 축</h2>
              </div>
              <p className="text-sm text-brand-muted max-w-xl">
                Homeground는 단순한 게시판을 넘어, 공간 예약과 모임 일정까지 함께 묶어 운영자가 바로 활용할 수 있는 흐름을 제공합니다.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {serviceBlocks.map((service) => (
                <div key={service.title} className="brand-card flex flex-col gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent-soft text-brand-ink">
                    <service.icon size={18} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{service.title}</h3>
                    <p className="text-sm text-brand-muted leading-relaxed">{service.description}</p>
                  </div>
                  <Link
                    href={service.title === '공간 예약' ? '/spots' : service.title === '모임 일정' ? '/schedule' : '#stories'}
                    className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-brand-ink hover:text-brand-accent transition-colors"
                  >
                    바로가기
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section id="schedule" className="py-14">
          <div className="mx-auto max-w-6xl px-6 space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-brand-muted">이번 주 캘린더</p>
                <h2 className="text-2xl font-bold">모임과 클래스 일정</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-brand-muted flex items-center gap-2">
                  <Users size={16} />
                  실제 운영자들이 업데이트합니다
                </span>
                <Link href="/schedule" className="brand-button-ghost px-4 py-2 text-sm">
                  전체 보기
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadingEvents ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="brand-card h-32 animate-pulse" />
                ))
              ) : weeklySchedule.length === 0 ? (
                <div className="brand-card col-span-full text-center text-brand-muted">
                  이번 주에 등록된 모임이 없습니다.
                </div>
              ) : (
                weeklySchedule.map((item) => {
                  const date = new Date(item.startAt);
                  const dayLabel = date.toLocaleDateString('ko-KR', { weekday: 'short' });
                  const time = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <Link key={item.id} href={`/schedule/${item.id}`} className="brand-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-brand-accent-soft px-3 py-1 text-xs font-semibold border border-brand-border">{dayLabel}</span>
                        <span className="text-xs text-brand-muted">{time}</span>
                      </div>
                      <p className="text-lg font-semibold">{item.title}</p>
                      <div className="flex items-center gap-2 text-sm text-brand-muted">
                        <MapPin size={14} />
                        <span>{item.placeName}</span>
                      </div>
                      <p className="text-sm font-semibold text-brand-ink">{item.spotInfo}</p>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Stories */}
        <section id="stories" className="border-t border-brand-border bg-white/70 py-14">
          <div className="mx-auto max-w-6xl px-6 space-y-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-brand-muted">커뮤니티</p>
                <h2 className="text-2xl font-bold">이웃들의 이야기</h2>
              </div>
              <Link href={user ? '/articles/new' : '/auth/login'} className="brand-button-ghost">
                글 쓰기
                <NotebookPen size={16} />
              </Link>
            </div>

            {loadingArticles ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-brand-surface shadow-inner animate-pulse border border-brand-border" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.length === 0 ? (
                  <div className="brand-card col-span-full text-center text-brand-muted">
                    아직 등록된 이야기가 없습니다. 첫 글을 남겨보세요.
                  </div>
                ) : (
                  articles.map((article) => (
                    <Link href={`/articles/${article.id}`} key={article.id}>
                      <div className="brand-card h-full flex flex-col gap-4 hover:border-brand-ink/40">
                        <div className="flex items-center justify-between text-xs text-brand-muted">
                          <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                          <span className="font-semibold text-brand-ink">#{article.id.toString().padStart(4, '0')}</span>
                        </div>
                        <h3 className="text-xl font-bold leading-tight line-clamp-2">{article.title}</h3>
                        <div className="flex items-center justify-between text-sm text-brand-muted">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-brand-accent-soft flex items-center justify-center font-bold text-brand-ink">
                              {article.authorNickname.charAt(0).toUpperCase()}
                            </div>
                            <span>{article.authorNickname}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span>조회 {article.viewCount}</span>
                            <span>댓글 {article.commentCount}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-brand-ink">
                          자세히 보기
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-brand-border bg-brand-surface py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold">Homeground</p>
            <p className="text-sm text-brand-muted">동네 생활을 기록하고 연결하는 서비스</p>
          </div>
          <p className="text-sm text-brand-muted">© 2025 Homeground. 모두의 동네에서 함께 만들어갑니다.</p>
        </div>
      </footer>
    </div>
  );
}
