import { useEffect, useRef } from 'react';
import type { Session } from '@/types';
import { SectionCard } from './SectionCard';
import { actualPagesSoFar } from '@/lib/pace';

interface Props {
  session: Session;
  /** Wall clock — accepted so the parent can trigger re-renders, but not used directly. */
  now?: number;
}

export function SectionTimeline({ session }: Props) {
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

  const actualNow = actualPagesSoFar(session);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2 px-1">
        <span className="small-caps">Timeline</span>
        <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">
          <span className="num-target">target</span>{' '}
          <span className="num-pace">actual</span>
        </span>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-thin"
        style={{ scrollbarWidth: 'thin' }}
      >
        {session.sections.map((s) => {
          // Show ACTUAL pages reported only — never extrapolate forward.
          // - done: the value recorded at section close
          // - current: the user's most recent log (or undefined if nothing logged yet)
          // - upcoming: nothing (projection lives in the "Est. finish" footer instead)
          let actualCumulative: number | undefined;
          if (s.status === 'done') {
            actualCumulative = s.actualPagesCumulative;
          } else if (s.status === 'current' && actualNow > 0) {
            actualCumulative = actualNow;
          }
          return (
            <SectionCard
              key={s.index}
              section={s}
              actualCumulative={actualCumulative}
            />
          );
        })}
      </div>
    </div>
  );
}
