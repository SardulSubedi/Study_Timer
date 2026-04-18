import { useEffect, useRef } from 'react';
import type { Session } from '@/types';
import { SectionCard } from './SectionCard';
import { actualPagesSoFar, projectedPagesAt } from '@/lib/pace';

interface Props {
  session: Session;
  now: number;
}

export function SectionTimeline({ session, now }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentIdx = session.sections.findIndex((s) => s.status === 'current');

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || currentIdx < 0) return;
    const children = el.children;
    const target = children[currentIdx] as HTMLElement | undefined;
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentIdx]);

  const actual = actualPagesSoFar(session);
  const projected = projectedPagesAt(session, now);
  // For live "pace" view on upcoming section cards, use projected if available.
  const liveSoFar = projected !== undefined ? Math.round(projected) : actual;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2 px-1">
        <span className="small-caps">Timeline</span>
        <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">
          <span className="num-target">target</span>{' '}
          <span className="num-pace">pace</span>
        </span>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-thin"
        style={{ scrollbarWidth: 'thin' }}
      >
        {session.sections.map((s) => {
          // Pace value shown per card:
          // - done section: its recorded actualPagesCumulative (if any)
          // - current section: current actual
          // - upcoming: projected cumulative at end of that section based on observed pace
          let paceCumulative: number | undefined;
          if (s.status === 'done') {
            paceCumulative = s.actualPagesCumulative;
          } else if (s.status === 'current') {
            paceCumulative = liveSoFar || undefined;
          } else if (projected !== undefined) {
            // project forward using observed pace
            const pace = (projected || 0) / Math.max(1, now - session.startMs);
            paceCumulative = Math.round(pace * (s.endMs - session.startMs));
          }
          return (
            <SectionCard
              key={s.index}
              section={s}
              paceCumulative={paceCumulative}
            />
          );
        })}
      </div>
    </div>
  );
}
