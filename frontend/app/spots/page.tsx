'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, ArrowLeft } from 'lucide-react';
import { apiUrl } from '@/lib/api';

interface Spot {
  id: number;
  name: string;
  tag: string;
  meta: string;
  location: string;
  description: string;
  createdAt: string;
}

export default function SpotsPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSpots = async () => {
      setLoading(true);
      try {
        const response = await fetch(apiUrl('/api/spots?size=30'));
        const data = await response.json();
        setSpots(data);
      } catch (error) {
        console.error('Failed to fetch spots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();
  }, []);

  return (
    <main className="min-h-screen bg-brand-bg p-6 pb-20">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="muted-link flex items-center gap-2">
            <ArrowLeft size={16} />
            홈으로
          </Link>
          <span className="brand-pill">실시간 공간 목록</span>
        </div>

        <header className="space-y-2">
          <h1 className="text-3xl font-bold">추천 공간</h1>
          <p className="text-brand-muted text-sm">운영자와 이웃들이 등록한 공간을 확인하고 예약 문의를 시작해보세요.</p>
        </header>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="brand-card h-36 animate-pulse" />
            ))}
          </div>
        ) : spots.length === 0 ? (
          <div className="brand-card text-center text-brand-muted">
            아직 등록된 공간이 없습니다.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {spots.map((spot) => (
              <div key={spot.id} className="brand-card space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold">{spot.name}</p>
                    <p className="text-sm text-brand-muted">{spot.meta}</p>
                  </div>
                  <span className="rounded-full bg-brand-accent-soft px-3 py-1 text-xs font-semibold text-brand-ink border border-brand-border">
                    {spot.tag}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-brand-muted">
                  <MapPin size={14} />
                  <span>{spot.location}</span>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed line-clamp-3">{spot.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
